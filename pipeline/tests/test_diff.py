from pipeline import diff


def feed_entries():
    return [
        {"id": "testvid0001", "title": "newest"},
        {"id": "testvid0002", "title": "middle"},
        {"id": "testvid0003", "title": "oldest"},
    ]


def catalog_with(*ids):
    return {"videos": [{"id": i} for i in ids]}


def test_empty_catalog_everything_is_new():
    assert len(diff.new_entries(catalog_with(), feed_entries())) == 3


def test_only_unknown_entries_are_new():
    fresh = diff.new_entries(catalog_with("testvid0002", "testvid0003"), feed_entries())
    assert [e["id"] for e in fresh] == ["testvid0001"]


def test_idempotent_after_merge():
    catalog = catalog_with("testvid0002", "testvid0003")
    fresh = diff.new_entries(catalog, feed_entries())
    catalog["videos"] = fresh + catalog["videos"]
    assert diff.new_entries(catalog, feed_entries()) == []


def test_patch_known_dates_upgrades_approximate_and_missing():
    catalog = {
        "videos": [
            {"id": "testvid0001", "published_at": "2026-08-01T00:00:00Z", "source": "ytdlp"},
            {"id": "testvid0002", "published_at": None, "source": "ytdlp"},
            {"id": "testvid0003", "published_at": "2026-08-15T08:00:00Z", "source": "api"},
        ]
    }
    feed = [
        {"id": "testvid0001", "published_at": "2026-08-19T09:00:00Z"},
        {"id": "testvid0002", "published_at": "2026-08-17T15:30:00Z"},
        {"id": "testvid0003", "published_at": "2026-08-15T08:00:00Z"},  # already exact
    ]
    assert diff.patch_known_dates(catalog, feed) == 2
    assert catalog["videos"][0]["published_at"] == "2026-08-19T09:00:00Z"
    assert catalog["videos"][0]["source"] == "rss"  # precision upgraded
    assert catalog["videos"][1]["published_at"] == "2026-08-17T15:30:00Z"
    # second run changes nothing -> poll stays idempotent
    assert diff.patch_known_dates(catalog, feed) == 0
