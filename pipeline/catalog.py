"""Load/save the versioned catalog at data/videos.json (+ data/latest.json)."""
import json
from pathlib import Path

from . import config, models


def empty() -> dict:
    return {
        "channel": {
            "id": config.CHANNEL_ID,
            "handle": config.CHANNEL_HANDLE,
            "title": config.CHANNEL_TITLE,
        },
        "generated_at": models.now_iso(),
        "count": 0,
        "videos": [],
    }


def load(path: Path = config.VIDEOS_JSON) -> dict | None:
    if not path.exists():
        return None
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def _sort_key(video: dict) -> str:
    # ISO strings sort chronologically; undated videos are treated as oldest.
    return video.get("published_at") or ""


def _write(payload: dict, path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w", encoding="utf-8", newline="\n") as f:
        json.dump(payload, f, indent=2, ensure_ascii=False)
        f.write("\n")


def save(catalog: dict) -> None:
    videos = sorted(
        (models.ordered(v) for v in catalog["videos"]),
        key=_sort_key,
        reverse=True,
    )
    payload = {
        "channel": catalog["channel"],
        "generated_at": models.now_iso(),
        "count": len(videos),
        "videos": videos,
    }
    _write(payload, config.VIDEOS_JSON)
    _write({**payload, "videos": videos[: config.LATEST_COUNT]}, config.LATEST_JSON)
