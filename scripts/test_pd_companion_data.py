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


def payload():
    text = (SITE / "assets/patient-evidence-data.js").read_text()
    return json.loads(text.split("window.PD_PATIENT_EVIDENCE = ", 1)[1].rstrip(";\n"))


class Page(HTMLParser):
    def __init__(self, path):
        super().__init__()
        self.ids, self.refs, self.images = [], [], []
        self.feed(path.read_text())

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if "id" in attrs:
            self.ids.append(attrs["id"])
        for key in ["href", "src", "data-figure-open"]:
            if key in attrs:
                self.refs.append(attrs[key])
        if tag == "img":
            self.images.append(attrs)


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


if __name__ == "__main__":
    unittest.main()
