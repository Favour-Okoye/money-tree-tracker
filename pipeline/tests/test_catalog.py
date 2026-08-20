import json

from pipeline import catalog, config, models


def test_save_sorts_counts_and_truncates_latest(tmp_path, monkeypatch):
    monkeypatch.setattr(config, "VIDEOS_JSON", tmp_path / "videos.json")
    monkeypatch.setattr(config, "LATEST_JSON", tmp_path / "latest.json")
    monkeypatch.setattr(config, "LATEST_COUNT", 2)

    videos = [
        models.make_video(
            id="oldvideo001",
            title="old",
            published_at="2024-01-01T00:00:00Z",
            first_seen_at="2026-08-20T00:00:00Z",
            source="api",
        ),
        models.make_video(
            id="undatedvid1",
            title="undated (ytdlp gap)",
            published_at=None,
            first_seen_at="2020-01-01T00:00:00Z",
            source="ytdlp",
        ),
        models.make_video(
            id="newvideo001",
            title="new",
            published_at="2026-08-19T09:00:00Z",
            first_seen_at="2026-08-20T00:00:00Z",
            source="rss",
        ),
    ]
    catalog.save({**catalog.empty(), "videos": videos})

    saved = json.loads((tmp_path / "videos.json").read_text(encoding="utf-8"))
    assert saved["count"] == 3
    assert [v["id"] for v in saved["videos"]][:2] == ["newvideo001", "oldvideo001"]
    # undated video falls back to first_seen_at for ordering
    assert saved["videos"][-1]["id"] == "undatedvid1"
    # stable key order for clean diffs
    assert list(saved["videos"][0].keys()) == models.KEY_ORDER

    latest = json.loads((tmp_path / "latest.json").read_text(encoding="utf-8"))
    assert latest["count"] == 3  # total count, truncated list
    assert len(latest["videos"]) == 2


def test_make_video_short_heuristic():
    short = models.make_video(
        id="shortvid001", title="s", published_at=None,
        first_seen_at="2026-08-20T00:00:00Z", source="api", duration_s=45,
    )
    longform = models.make_video(
        id="longvid0001", title="l", published_at=None,
        first_seen_at="2026-08-20T00:00:00Z", source="api", duration_s=600,
    )
    assert short["is_short"] is True
    assert longform["is_short"] is False
