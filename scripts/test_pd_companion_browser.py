"""Static-page interaction and layout checks; requires Playwright, not Gatsby."""
import json
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1] / "static/projects/pd-research-companion"
SHOTS = Path("/tmp/pd-companion-screenshots")
SHOTS.mkdir(exist_ok=True)


def main():
    counts = {"pages": 0, "views": 0}
    with sync_playwright() as pw:
        browser = pw.chromium.launch()
        for name in ["pd-validity-gates", "pd-signed-laterality"]:
            for width, height in [(1440, 1050), (390, 844), (375, 812)]:
                page = browser.new_page(viewport={"width": width, "height": height}, reduced_motion="reduce")
                errors = []
                page.on("pageerror", lambda e: errors.append(str(e)))
                page.goto((ROOT / name / "index.html").as_uri())
                page.wait_for_selector("[data-patient-explorer] svg")
                explorer = page.locator("[data-patient-explorer]")
                assert page.locator("body").evaluate("(el) => el.scrollWidth <= innerWidth"), "Horizontal page overflow"
                assert explorer.locator("[data-observed]").count() == 0
                assert explorer.locator(".evidence-forecast").count() == 0
                if name == "pd-validity-gates":
                    verdict = explorer.locator(".evidence-verdict")
                    assert "ABSTAIN" in verdict.inner_text()
                    assert "cohort-level" in verdict.inner_text()
                    assert "not diagnoses" in verdict.inner_text()
                page.screenshot(path=str(SHOTS / (name + "-" + str(width) + "-top.png")))
                explorer.screenshot(path=str(SHOTS / (name + "-" + str(width) + "-measured.png")))
                for tab in explorer.locator("[data-record]").all():
                    tab.click()
                    assert explorer.locator("[data-stage-index='0']").get_attribute("aria-selected") == "true"
                    assert explorer.locator("[data-observed]").count() == 0
                if name == "pd-signed-laterality":
                    explorer.locator("[data-record='0']").click()
                explorer.locator("[data-stage-index='0']").focus()
                page.keyboard.press("ArrowRight")
                assert explorer.locator("[data-stage-index='1']").get_attribute("aria-selected") == "true"
                assert explorer.locator("[data-observed]").count() == 0
                assert explorer.locator(".evidence-forecast").count() > 0
                page.keyboard.press("End")
                assert explorer.locator("[data-observed]").count() == (2 if name == "pd-validity-gates" else 1)
                explorer.screenshot(path=str(SHOTS / (name + "-" + str(width) + "-followup.png")))
                assert "separate model" in explorer.inner_text()
                explorer.locator("[data-reset]").click()
                assert explorer.locator("[data-observed]").count() == 0
                explorer.locator("[data-replay]").click()
                assert explorer.locator("[data-replay]").get_attribute("aria-pressed") == "true"
                explorer.locator("[data-replay]").click()
                assert explorer.locator("[data-replay]").get_attribute("aria-pressed") == "false"
                if width == 1440:
                    explorer.locator("[data-replay]").click()
                    page.wait_for_timeout(8500)
                    assert explorer.locator("[data-stage-index='2']").get_attribute("aria-selected") == "true"
                    assert explorer.locator("[data-replay]").get_attribute("aria-pressed") == "false"
                for img in page.locator("img").all():
                    if not img.is_visible():
                        continue
                    img.scroll_into_view_if_needed()
                    img.evaluate("(img) => img.decode()")
                    assert img.evaluate("(img) => img.naturalWidth > 0"), "Missing image"
                figure = page.locator("[data-figure-open]").first
                figure.click()
                assert page.locator("dialog").is_visible()
                page.keyboard.press("Escape")
                assert not page.locator("dialog").is_visible()
                assert not errors, errors
                assert page.locator("body").evaluate("(el) => el.scrollWidth <= innerWidth"), "Overflow after interactions"
                counts["views"] += 1
                page.close()
            counts["pages"] += 1
        browser.close()
    print(json.dumps(counts))


if __name__ == "__main__":
    main()
