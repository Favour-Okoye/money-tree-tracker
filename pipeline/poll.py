"""Poll entrypoint: fetch RSS -> diff -> update catalog -> hand off new items.

Idempotent by design: when nothing is new the catalog files are not touched,
so the CI commit step sees a clean tree and no email is sent.
"""
import json
import os
import sys

from . import catalog as catalog_mod
from . import config, diff, models, rss


def emit_output(name: str, value) -> None:
    gh_output = os.environ.get("GITHUB_OUTPUT")
    if gh_output:
        with open(gh_output, "a", encoding="utf-8") as f:
            f.write(f"{name}={value}\n")


def main() -> int:
    catalog = catalog_mod.load()
    if catalog is None:
        print(
            "ERROR: data/videos.json missing - run the backfill first "
            "(python -m pipeline.backfill_api or pipeline.backfill_ytdlp).",
            file=sys.stderr,
        )
        return 1

    feed_entries = rss.fetch_feed()
    fresh = diff.new_entries(catalog, feed_entries)

    new_videos = []
    if fresh:
        stamp = models.now_iso()
        new_videos = [
            models.make_video(
                id=e["id"],
                title=e["title"],
                published_at=e["published_at"],
                first_seen_at=stamp,
                thumbnail=e.get("thumbnail"),
                description_snippet=e.get("description_snippet", ""),
                source="rss",
            )
            for e in fresh
        ]
        catalog["videos"] = new_videos + catalog["videos"]

    patched = diff.patch_known_dates(catalog, feed_entries)
    if new_videos or patched:
        catalog_mod.save(catalog)

    if new_videos:
        with open(config.NEW_ITEMS_JSON, "w", encoding="utf-8") as f:
            json.dump(new_videos, f, indent=2, ensure_ascii=False)
        for v in new_videos:
            print(f"NEW: {v['title']} (https://www.youtube.com/watch?v={v['id']})")
    else:
        config.NEW_ITEMS_JSON.unlink(missing_ok=True)
        print(f"No new uploads (feed: {len(feed_entries)}, catalog: {catalog['count']}).")
    if patched:
        print(f"Patched exact dates on {patched} known video(s).")

    emit_output("new_count", len(new_videos))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
