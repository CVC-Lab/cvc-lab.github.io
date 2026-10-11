"""Checks for the narrow, static patient-evidence export and project links."""
import json
import math
from html.parser import HTMLParser
from pathlib import Path
import re
import unittest
from urllib.parse import urlsplit

ROOT = Path(__file__).resolve().parents[1]
SITE = ROOT / "static/projects/pd-research-companion"


def png_size(path):
    header = path.read_bytes()[:24]
    return int.from_bytes(header[16:20], "big"), int.from_bytes(header[20:24], "big")


def lossless_webp_size(path):
    header = path.read_bytes()[:25]
    assert header[12:16] == b"VP8L", path
    bits = int.from_bytes(header[21:25], "little")
    return (bits & 0x3FFF) + 1, ((bits >> 14) & 0x3FFF) + 1


def webp_size(path):
    header = path.read_bytes()[:30]
    chunk = header[12:16]
    if chunk == b"VP8L":
        return lossless_webp_size(path)
    if chunk == b"VP8X":
        return int.from_bytes(header[24:27], "little") + 1, int.from_bytes(header[27:30], "little") + 1
    assert chunk == b"VP8 ", path
    return (int.from_bytes(header[26:28], "little") & 0x3FFF,
            int.from_bytes(header[28:30], "little") & 0x3FFF)


def srcset_candidates(value):
    candidates = []
    for item in value.split(","):
        url, descriptor = item.split()
        assert descriptor.endswith("w"), value
        candidates.append((url, int(descriptor[:-1])))
    return candidates


def payload():
    text = (SITE / "assets/patient-evidence-data.js").read_text()
    return json.loads(text.split("window.PD_PATIENT_EVIDENCE = ", 1)[1].rstrip(";\n"))


class Page(HTMLParser):
    def __init__(self, path):
        super().__init__()
        self.ids, self.refs, self.images, self.figures = [], [], [], []
        self.feed(path.read_text())

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if "id" in attrs:
            self.ids.append(attrs["id"])
        for key in ["href", "src", "data-figure-open"]:
            if key in attrs:
                self.refs.append(attrs[key])
        if "srcset" in attrs:
            self.refs.extend(url for url, _ in srcset_candidates(attrs["srcset"]))
        if tag == "img":
            self.images.append(attrs)
        if "data-figure-open" in attrs:
            self.figures.append(attrs["data-figure-open"])


class CompanionTests(unittest.TestCase):
    def test_export_contract(self):
        data = payload()
        self.assertEqual([c["id"] for c in data["paper1"]], ["P1-A", "P1-B"])
        self.assertEqual([c["id"] for c in data["paper2"]], list("ABCD"))
        for cases in data.values():
            for case in cases:
                self.assertTrue(9 <= case["gap"] <= 15)
                self.assertTrue(all(-24 <= h["month"] <= 0 for h in case["history"]))
                cutoff = [h["value"] for h in case["history"] if h["month"] == 0]
                self.assertEqual(len(cutoff), 1)
                self.assertTrue(math.isclose(cutoff[0], case["baseline"], abs_tol=.0001))
                self.assertLessEqual(case["uq"]["low"], case["uq"]["center"])
                self.assertLessEqual(case["uq"]["center"], case["uq"]["high"])
                self.assertTrue(all(s["age"] is None or s["age"] >= 0 for s in case["sources"]))
        serialized = json.dumps(data, allow_nan=False)
        for forbidden in ["PATNO", "cutoff_month", "anchor_month", "INFODT", "tie_hash", "/scratch/", "/home1/"]:
            self.assertNotIn(forbidden, serialized)

    def test_only_public_display_fields(self):
        data = payload()
        common = {"id", "motor", "sources", "history", "baseline", "gap", "observed", "forecasts", "uq"}
        for paper, cases in data.items():
            extras = {"slope", "visits", "span", "axes", "futureMotor"} if paper == "paper1" else {
                "leftSbr", "rightSbr", "leftMotor", "rightMotor", "imaging"}
            for case in cases:
                self.assertEqual(set(case), common | extras)
                self.assertTrue(all(set(p) == {"month", "value"} for p in case["history"]))
        self.assertIsNone(re.search(r"\b(?:19|20)\d{2}-\d{2}-\d{2}\b", json.dumps(data)))

    def test_paper1_missingness_and_freshness(self):
        a, b = payload()["paper1"]
        self.assertEqual((a["motor"], b["motor"]), (10, 11))
        self.assertIsNone(b["sources"][0]["value"])
        self.assertIsNone(a["sources"][2]["value"])
        self.assertEqual(b["sources"][2]["value"], 1300)
        self.assertEqual(b["sources"][-1]["age"], 14)
        self.assertEqual(len(a["sources"]), len(b["sources"]))
        self.assertEqual((a["gap"], a["observed"]), (9, 16))
        self.assertEqual((b["gap"], b["observed"]), (12, 8))

    def test_measured_side_conventions(self):
        for case in payload()["paper2"]:
            self.assertAlmostEqual(case["imaging"], (case["rightSbr"] - case["leftSbr"]) /
                (case["rightSbr"] + case["leftSbr"]), places=3)
            self.assertAlmostEqual(case["baseline"], (case["rightMotor"] - case["leftMotor"]) /
                (case["rightMotor"] + case["leftMotor"]), places=3)

    def test_mixed_forecast_outcomes_not_curated_successes(self):
        cases = {c["id"]: c for c in payload()["paper2"]}
        error = lambda r, i: abs(r["forecasts"][i]["value"] - r["observed"])
        self.assertGreater(error(cases["A"], 3), error(cases["A"], 0))
        self.assertLess(error(cases["B"], 3), error(cases["B"], 0))
        self.assertGreater(error(cases["D"], 3), error(cases["D"], 2))
        self.assertEqual((cases["C"]["uq"]["low"], cases["C"]["uq"]["high"]), (-1, 1))

    def test_context_is_not_promoted_to_forecast_input(self):
        for case in payload()["paper2"]:
            for source in case["sources"][1:4]:
                self.assertIn("Context only", source["role"])
            self.assertNotEqual(case["uq"]["center"], case["forecasts"][3]["value"])

    def test_local_links_and_fragments(self):
        for path in SITE.rglob("*.html"):
            page = Page(path)
            self.assertEqual(len(page.ids), len(set(page.ids)), path)
            for link in page.refs:
                parsed = urlsplit(link)
                if parsed.scheme or parsed.netloc or parsed.path.startswith("/"):
                    continue
                target = (path.parent / parsed.path).resolve() if parsed.path else path.resolve()
                if target.is_dir():
                    target = target / "index.html"
                self.assertTrue(target.exists(), (path.name, link))
                if parsed.fragment:
                    self.assertIn(parsed.fragment, Page(target).ids, (path.name, link))
            self.assertTrue(all(img.get("alt") for img in page.images))

    def test_inline_figures_are_lossless_copies_of_the_full_figures(self):
        # Rebuild a copy with: cwebp -lossless -z 9 -quiet NAME.png -o NAME.webp
        for path in SITE.rglob("*.html"):
            page = Page(path)
            inline = {img["src"]: img for img in page.images}
            for full in page.figures:
                copy = full[:-len(".png")] + ".webp"
                self.assertIn(copy, inline, (path.name, full))
                size = png_size(path.parent / full)
                self.assertEqual(lossless_webp_size(path.parent / copy), size, copy)
                self.assertEqual((int(inline[copy]["width"]), int(inline[copy]["height"])), size, copy)

    def test_inline_images_offer_display_size_copies(self):
        # Rebuild a figure copy with sharp: resize({ width: 1200 }).webp({ quality: 90, effort: 6 })
        for path in SITE.rglob("*.html"):
            page = Page(path)
            inline = {img["src"]: img for img in page.images}
            for full in page.figures:
                self.assertIn("srcset", inline[full[:-len(".png")] + ".webp"], (path.name, full))
            for img in page.images:
                if "srcset" not in img:
                    continue
                self.assertTrue(img.get("sizes"), img["src"])
                width, height = int(img["width"]), int(img["height"])
                candidates = srcset_candidates(img["srcset"])
                self.assertEqual(candidates[-1], (img["src"], width), img["src"])
                self.assertEqual(webp_size(path.parent / img["src"]), (width, height), img["src"])
                for url, descriptor in candidates[:-1]:
                    self.assertLess(descriptor, width, url)
                    copy_width, copy_height = webp_size(path.parent / url)
                    self.assertEqual(copy_width, descriptor, url)
                    self.assertLessEqual(abs(copy_height - descriptor * height / width), 1, url)

    def test_main_site_links_are_root_relative(self):
        for path in SITE.rglob("*.html"):
            for link in Page(path).refs:
                self.assertFalse(link.startswith("https://cvc-lab.github.io/"), (path.name, link))

    def test_source_glossaries_and_repository_access_are_explicit(self):
        for slug in ["pd-validity-gates", "pd-signed-laterality"]:
            source = (SITE / slug / "index.html").read_text()
            self.assertIn("access required", source)
            self.assertIn("https://github.com/CVC-Lab/" + slug, source)
            self.assertIn("available from the authors on request", source)
            self.assertIn("<caption>", source)
        laterality = (SITE / "pd-signed-laterality/index.html").read_text()
        self.assertIn("separate exploratory context comparisons", laterality)
        self.assertIn("not inputs to these focused forecasts", laterality)


if __name__ == "__main__":
    unittest.main()
