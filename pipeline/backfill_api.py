"""Full catalog build/refresh via the YouTube Data API v3 (free key).

Used two ways:
- initial backfill of the whole uploads playlist (~903 videos, ~40 quota units)
- monthly "enrich": re-fetch everything, fill durations, heal RSS gaps, and
  flag deleted/private videos as removed (they are never dropped, so personal
  statuses keep pointing at something).

Merge semantics: known videos keep their original first_seen_at.
"""
import os
import re
import sys

import requests

from . import catalog as catalog_mod
from . import config, models

API_BASE = "https://www.googleapis.com/youtube/v3"
_DURATION_RE = re.compile(
    r"PT(?:(?P<h>\d+)H)?(?:(?P<m>\d+)M)?(?:(?P<s>\d+)S)?"
)


def iso8601_duration_to_seconds(value: str | None) -> int | None:
    if not value:
        return None
    match = _DURATION_RE.fullmatch(value)
    if not match:
        return None
    h = int(match.group("h") or 0)
    m = int(match.group("m") or 0)
    s = int(match.group("s") or 0)
    return h * 3600 + m * 60 + s


def _get(session: requests.Session, endpoint: str, params: dict) -> dict:
    resp = session.get(f"{API_BASE}/{endpoint}", params=params, timeout=30)
    resp.raise_for_status()
    return resp.json()


def fetch_upload_ids(session: requests.Session, key: str) -> list[str]:
    ids: list[str] = []
    page_token = None
    while True:
        params = {
            "part": "contentDetails",
            "playlistId": config.UPLOADS_PLAYLIST_ID,
            "maxResults": 50,
            "key": key,
        }
        if page_token:
            params["pageToken"] = page_token
        data = _get(session, "playlistItems", params)
        ids.extend(item["contentDetails"]["videoId"] for item in data.get("items", []))
        page_token = data.get("nextPageToken")
        if not page_token:
            return ids


def fetch_video_details(session: requests.Session, key: str, ids: list[str]) -> dict[str, dict]:
    details: dict[str, dict] = {}
    for start in range(0, len(ids), 50):
        batch = ids[start : start + 50]
        data = _get(
            session,
            "videos",
            {"part": "snippet,contentDetails", "id": ",".join(batch), "key": key},
        )
        for item in data.get("items", []):
            snippet = item["snippet"]
            duration_s = iso8601_duration_to_seconds(
                item.get("contentDetails", {}).get("duration")
            )
            details[item["id"]] = {
                "title": snippet.get("title", ""),
                "published_at": snippet.get("publishedAt"),
                "description_snippet": (snippet.get("description") or "")[
                    : config.DESCRIPTION_SNIPPET_CHARS
                ],
                "thumbnail": (
                    snippet.get("thumbnails", {}).get("medium", {}).get("url")
                    or models.thumbnail_url(item["id"])
                ),
                "duration_s": duration_s,
            }
    return details


def run(mode: str = "backfill") -> int:
    key = os.environ.get("YT_API_KEY")
    if not key:
        print(
            "ERROR: set the YT_API_KEY env var (free key from Google Cloud Console, "
            "YouTube Data API v3). Keyless alternative: python -m pipeline.backfill_ytdlp",
            file=sys.stderr,
        )
        return 1

    existing = catalog_mod.load() or catalog_mod.empty()
    known = {v["id"]: v for v in existing["videos"]}
    stamp = models.now_iso()

    with requests.Session() as session:
        upload_ids = fetch_upload_ids(session, key)
        details = fetch_video_details(session, key, upload_ids)
    print(f"[{mode}] uploads playlist: {len(upload_ids)} ids, details for {len(details)}.")

    videos = []
    for video_id, d in details.items():
        previous = known.get(video_id)
        videos.append(
            models.make_video(
                id=video_id,
                title=d["title"],
                published_at=d["published_at"],
                first_seen_at=previous["first_seen_at"] if previous else stamp,
                thumbnail=d["thumbnail"],
                description_snippet=d["description_snippet"],
                duration_s=d["duration_s"],
                source="api",
            )
        )

    # Anything we knew that the API no longer returns is deleted/private.
    fetched_ids = set(details)
    removed_count = 0
    for video_id, previous in known.items():
        if video_id not in fetched_ids:
            videos.append({**models.ordered(previous), "removed": True})
            removed_count += 1

    catalog_mod.save({**existing, "videos": videos})
    print(
        f"[{mode}] catalog saved: {len(videos)} videos "
        f"({len(fetched_ids - set(known))} new, {removed_count} flagged removed)."
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(run("backfill"))
