from pathlib import Path

from pipeline import rss

FIXTURE = Path(__file__).parent / "fixtures" / "feed_sample.xml"


def load_fixture() -> bytes:
    return FIXTURE.read_bytes()


def test_parse_feed_extracts_all_entries():
    entries = rss.parse_feed(load_fixture())
    assert len(entries) == 3
    assert [e["id"] for e in entries] == ["testvid0001", "testvid0002", "testvid0003"]


def test_parse_feed_fields():
    entry = rss.parse_feed(load_fixture())[0]
    assert entry["title"] == "WHY HARD WORK ALONE WILL NEVER MAKE YOU WEALTHY"
    assert entry["published_at"] == "2026-08-19T09:00:00Z"  # normalized to Z
    assert entry["thumbnail"] == "https://i2.ytimg.com/vi/testvid0001/hqdefault.jpg"
    assert entry["description_snippet"].startswith("Wealth is built through leverage")


def test_normalize_date():
    assert rss.normalize_date("2026-08-19T09:00:00+00:00") == "2026-08-19T09:00:00Z"
    assert rss.normalize_date(None) is None
