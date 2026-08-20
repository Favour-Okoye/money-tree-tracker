"""Keyless full backfill via yt-dlp (fallback path, run locally).

Two passes:
1. flat dump of the uploads playlist  -> complete video set + durations
2. flat dumps of the /videos, /shorts and /streams tabs with the
   ``youtubetab:approximate_date`` extractor arg -> approximate timestamps

Dates are approximate (derived from YouTube's relative "N months ago" labels).
A later API enrich overwrites them with exact values while keeping
first_seen_at; the poller also patches exact dates for anything still in the
RSS window.
"""
import json
import subprocess
import sys
from datetime import datetime, timezone

from . import catalog as catalog_mod
from . import config, models

EXACT_SOURCES = {"rss", "api"}


def _flat_dump(url: str, extra_args: tuple[str, ...] = ()) -> list[dict]:
    cmd = [
        sys.executable, "-m", "yt_dlp", "-J", "--flat-playlist", *extra_args, url,
    ]
    result = subprocess.run(
        cmd, capture_output=True, text=True, encoding="utf-8", timeout=900, check=True
    )
    return json.loads(result.stdout).get("entries") or []


def fetch_approximate_dates() -> dict[str, str]:
    dates: dict[str, str] = {}
    for tab in ("videos", "shorts", "streams"):
        url = f"https://www.youtube.com/{config.CHANNEL_HANDLE}/{tab}"
        try:
            entries = _flat_dump(url, ("--extractor-args", "youtubetab:approximate_date"))
        except subprocess.CalledProcessError:
            print(f"  (no {tab} tab, skipping)")
            continue
        for entry in entries:
            video_id = entry.get("id")
            ts = entry.get("timestamp")
            if video_id and ts and video_id not in dates:
                dates[video_id] = datetime.fromtimestamp(ts, tz=timezone.utc).strftime(
                    "%Y-%m-%dT%H:%M:%SZ"
                )
        print(f"  {tab}: {len(entries)} entries")
    return dates


def run() -> int:
    playlist_url = f"https://www.youtube.com/playlist?list={config.UPLOADS_PLAYLIST_ID}"
    entries = _flat_dump(playlist_url)
    if not entries:
        print("ERROR: yt-dlp returned no entries.", file=sys.stderr)
        return 1
    print(f"uploads playlist: {len(entries)} entries")
    approx_dates = fetch_approximate_dates()

    existing = catalog_mod.load() or catalog_mod.empty()
    known = {v["id"]: v for v in existing["videos"]}
    stamp = models.now_iso()

    videos = []
    seen_ids = set()
    for entry in entries:
        video_id = entry.get("id")
        if not video_id or video_id in seen_ids:
            continue
        seen_ids.add(video_id)
        previous = known.get(video_id)
        # never replace an exact (API/RSS) date with an approximate one
        prev_exact = (
            previous.get("published_at")
            if previous and previous.get("source") in EXACT_SOURCES
            else None
        )
        published_at = (
            prev_exact
            or approx_dates.get(video_id)
            or (previous.get("published_at") if previous else None)
        )
        duration = entry.get("duration")
        videos.append(
            models.make_video(
                id=video_id,
                title=(entry.get("title") or "").strip(),
                published_at=published_at,
                first_seen_at=previous["first_seen_at"] if previous else stamp,
                description_snippet=(entry.get("description") or "")[
                    : config.DESCRIPTION_SNIPPET_CHARS
                ],
                duration_s=int(duration) if duration else None,
                source=previous["source"] if previous and prev_exact else "ytdlp",
            )
        )

    # Keep known videos missing from the dump (deleted/private) instead of dropping.
    for video_id, previous in known.items():
        if video_id not in seen_ids:
            videos.append({**models.ordered(previous), "removed": True})

    catalog_mod.save({**existing, "videos": videos})
    dated = sum(1 for v in videos if v["published_at"])
    print(f"Catalog saved: {len(videos)} videos, {dated} with dates (yt-dlp).")
    return 0


if __name__ == "__main__":
    raise SystemExit(run())
