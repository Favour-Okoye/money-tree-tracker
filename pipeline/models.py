"""Video record shape shared by every pipeline stage.

A video is a plain dict; ``ordered()`` pins the key order so the JSON on disk
diffs cleanly commit-to-commit.
"""
from datetime import datetime, timezone

KEY_ORDER = [
    "id",
    "title",
    "published_at",
    "first_seen_at",
    "thumbnail",
    "description_snippet",
    "duration_s",
    "is_short",
    "removed",
    "source",
]


def now_iso() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def thumbnail_url(video_id: str) -> str:
    return f"https://i.ytimg.com/vi/{video_id}/mqdefault.jpg"


def ordered(video: dict) -> dict:
    return {key: video.get(key) for key in KEY_ORDER}


def make_video(
    *,
    id: str,
    title: str,
    published_at: str | None,
    first_seen_at: str,
    source: str,
    thumbnail: str | None = None,
    description_snippet: str = "",
    duration_s: int | None = None,
    is_short: bool | None = None,
    removed: bool = False,
) -> dict:
    if is_short is None and duration_s is not None:
        from . import config

        is_short = duration_s <= config.SHORT_MAX_SECONDS
    return ordered(
        {
            "id": id,
            "title": title,
            "published_at": published_at,
            "first_seen_at": first_seen_at,
            "thumbnail": thumbnail or thumbnail_url(id),
            "description_snippet": description_snippet,
            "duration_s": duration_s,
            "is_short": is_short,
            "removed": removed,
            "source": source,
        }
    )
