"""Fetch and parse the channel's Atom feed (latest 15 uploads, no API key)."""
import feedparser
import requests

from . import config


def normalize_date(value: str | None) -> str | None:
    """'2026-08-19T09:00:00+00:00' -> '2026-08-19T09:00:00Z' (feed is always UTC)."""
    if not value:
        return None
    return value.replace("+00:00", "Z")


def fetch_feed(url: str = config.RSS_URL) -> list[dict]:
    resp = requests.get(url, headers={"User-Agent": config.USER_AGENT}, timeout=30)
    resp.raise_for_status()
    return parse_feed(resp.content)


def parse_feed(content: bytes | str) -> list[dict]:
    parsed = feedparser.parse(content)
    entries = []
    for entry in parsed.entries:
        video_id = entry.get("yt_videoid")
        if not video_id:
            continue
        thumbnails = entry.get("media_thumbnail") or []
        thumbnail = thumbnails[0].get("url") if thumbnails else None
        description = entry.get("summary") or entry.get("media_description") or ""
        entries.append(
            {
                "id": video_id,
                "title": (entry.get("title") or "").strip(),
                "published_at": normalize_date(entry.get("published")),
                "thumbnail": thumbnail,
                "description_snippet": description[: config.DESCRIPTION_SNIPPET_CHARS],
            }
        )
    return entries
