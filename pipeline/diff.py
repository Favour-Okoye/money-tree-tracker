"""Pure diff between the stored catalog and freshly fetched feed entries."""


def new_entries(catalog: dict, feed_entries: list[dict]) -> list[dict]:
    known = {video["id"] for video in catalog.get("videos", [])}
    return [entry for entry in feed_entries if entry["id"] not in known]


def patch_known_dates(catalog: dict, feed_entries: list[dict]) -> int:
    """Upgrade approximate/missing publish dates to the feed's exact ones.

    Mutates the catalog in place and returns how many videos changed
    (0 on a repeat run, keeping the poll idempotent).
    """
    by_id = {video["id"]: video for video in catalog.get("videos", [])}
    patched = 0
    for entry in feed_entries:
        video = by_id.get(entry["id"])
        exact_date = entry.get("published_at")
        if video and exact_date and video.get("published_at") != exact_date:
            video["published_at"] = exact_date
            if video.get("source") == "ytdlp":
                video["source"] = "rss"
            patched += 1
    return patched
