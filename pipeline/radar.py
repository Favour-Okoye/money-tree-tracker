"""Guest-appearance radar: find videos featuring Grace Ofure on OTHER channels.

Runs in two modes:
- API mode (YT_API_KEY set, used monthly in CI): search.list + videos.list
- yt-dlp mode (no key, local): ytsearch + per-video metadata

Candidates must mention her name in the title or description, must not be on
her own channels, and must not already be in her uploads catalog. Results are
merged into data/appearances.json; hand-added entries are always preserved.
"""
import json
import os
import re
import subprocess
import sys
from datetime import datetime, timezone

import requests

from . import catalog as catalog_mod
from . import config, models

DESC_PROBE_PER_QUERY = 15
QUERIES = [
    "Grace Ofure",
    "Grace Ofure interview",
    "Grace Ofure podcast",
    "Grace Ofure Ibhakhomu",
    "Grace Ofure Declassified",
    "Declassified Femi Lazarus podcast",
]
NAME_RE = re.compile(r"grace\s+ofure|ofure\s+ibhakhomu", re.I)
OWN_CHANNEL_IDS = {config.CHANNEL_ID}
APPEARANCES_JSON = config.DATA_DIR / "appearances.json"
API = "https://www.googleapis.com/youtube/v3"
ENTRY_KEYS = ["id", "title", "host_show", "channel_id", "url", "published_at", "duration_s", "source", "first_seen_at"]


def load_appearances() -> dict:
    if APPEARANCES_JSON.exists():
        with open(APPEARANCES_JSON, encoding="utf-8") as f:
            return json.load(f)
    return {"note": "", "appearances": []}


def save_appearances(payload: dict) -> None:
    entries = [{k: e.get(k) for k in ENTRY_KEYS} for e in payload["appearances"]]
    entries.sort(key=lambda e: e.get("published_at") or "", reverse=True)
    payload = {
        "note": "Guest appearances on other channels. Hand-add entries or run `python -m pipeline.radar`.",
        "generated_at": models.now_iso(),
        "count": len(entries),
        "appearances": entries,
    }
    with open(APPEARANCES_JSON, "w", encoding="utf-8", newline="\n") as f:
        json.dump(payload, f, indent=2, ensure_ascii=False)
        f.write("\n")


def is_candidate(vid: str, title: str, description: str, channel_id: str, channel_title: str, own_ids: set) -> bool:
    if vid in own_ids or channel_id in OWN_CHANNEL_IDS:
        return False
    if NAME_RE.search(channel_title or ""):  # her own / fan-clip channels named after her
        return False
    return bool(NAME_RE.search(title or "")) or bool(NAME_RE.search((description or "")[:600]))


def iso_duration_to_seconds(value: str) -> int | None:
    m = re.fullmatch(r"PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?", value or "")
    if not m:
        return None
    h, mi, s = (int(x) if x else 0 for x in m.groups())
    return h * 3600 + mi * 60 + s


# ---------------- API mode ----------------

def api_search(key: str, query: str, max_pages: int = 2) -> list[dict]:
    items, token = [], None
    for _ in range(max_pages):
        params = {"part": "snippet", "q": query, "type": "video", "maxResults": 50, "key": key}
        if token:
            params["pageToken"] = token
        resp = requests.get(f"{API}/search", params=params, timeout=30)
        resp.raise_for_status()
        data = resp.json()
        items.extend(data.get("items", []))
        token = data.get("nextPageToken")
        if not token:
            break
    return items


def api_details(key: str, ids: list[str]) -> dict[str, dict]:
    out = {}
    for i in range(0, len(ids), 50):
        batch = ids[i : i + 50]
        resp = requests.get(
            f"{API}/videos",
            params={"part": "snippet,contentDetails", "id": ",".join(batch), "key": key},
            timeout=30,
        )
        resp.raise_for_status()
        for item in resp.json().get("items", []):
            sn, cd = item["snippet"], item.get("contentDetails", {})
            out[item["id"]] = {
                "title": sn.get("title", ""),
                "description": sn.get("description", ""),
                "channel_id": sn.get("channelId", ""),
                "channel_title": sn.get("channelTitle", ""),
                "published_at": sn.get("publishedAt"),
                "duration_s": iso_duration_to_seconds(cd.get("duration", "")),
            }
    return out


# ---------------- yt-dlp mode ----------------

def ytdlp_json(args: list[str]) -> dict:
    result = subprocess.run(
        [sys.executable, "-m", "yt_dlp", "-J", *args],
        capture_output=True, text=True, encoding="utf-8", timeout=600, check=True,
    )
    return json.loads(result.stdout)


def ytdlp_search(query: str, n: int = 40) -> list[dict]:
    return ytdlp_json(["--flat-playlist", f"ytsearch{n}:{query}"]).get("entries") or []


def ytdlp_details(video_id: str) -> dict | None:
    try:
        d = ytdlp_json(["--no-playlist", f"https://www.youtube.com/watch?v={video_id}"])
    except (subprocess.CalledProcessError, subprocess.TimeoutExpired):
        return None
    up = d.get("upload_date")
    return {
        "title": d.get("title", ""),
        "description": d.get("description", ""),
        "channel_id": d.get("channel_id", ""),
        "channel_title": d.get("channel") or d.get("uploader") or "",
        "published_at": f"{up[:4]}-{up[4:6]}-{up[6:]}T00:00:00Z" if up else None,
        "duration_s": int(d["duration"]) if d.get("duration") else None,
    }


# ---------------- main ----------------

def run() -> int:
    key = os.environ.get("YT_API_KEY")
    payload = load_appearances()
    known = {a["id"]: a for a in payload["appearances"]}
    for a in known.values():
        a.setdefault("source", "manual")
    catalog = catalog_mod.load()
    own_ids = {v["id"] for v in catalog["videos"]} if catalog else set()
    stamp = models.now_iso()

    details: dict[str, dict] = {}
    if key:
        print("radar: API mode")
        hits: dict[str, dict] = {}
        for q in QUERIES:
            for item in api_search(key, q):
                vid = item["id"].get("videoId")
                if vid and vid not in known and vid not in own_ids:
                    hits.setdefault(vid, item["snippet"])
        details = api_details(key, list(hits))
    else:
        print("radar: yt-dlp mode (no YT_API_KEY)")
        # Flat search has no descriptions: probe every title match, plus the
        # first DESC_PROBE_PER_QUERY other results per query, so episodes that
        # only name her in the description (e.g. podcast numbering) are caught.
        probe: dict[str, str] = {}
        for q in QUERIES:
            others = 0
            for e in ytdlp_search(q):
                vid = e.get("id")
                title = e.get("title") or ""
                if not vid or vid in known or vid in own_ids or vid in probe:
                    continue
                if NAME_RE.search(title):
                    probe[vid] = title
                elif others < DESC_PROBE_PER_QUERY:
                    probe[vid] = title
                    others += 1
        print(f"  probing {len(probe)} videos for details...")
        for vid in probe:
            d = ytdlp_details(vid)
            if d:
                details[vid] = d

    added = []
    for vid, d in details.items():
        if not is_candidate(vid, d["title"], d["description"], d["channel_id"], d["channel_title"], own_ids):
            continue
        entry = {
            "id": vid,
            "title": d["title"].strip(),
            "host_show": d["channel_title"].strip(),
            "channel_id": d["channel_id"],
            "url": f"https://www.youtube.com/watch?v={vid}",
            "published_at": d["published_at"],
            "duration_s": d["duration_s"],
            "source": "radar",
            "first_seen_at": stamp,
        }
        known[vid] = entry
        added.append(entry)

    payload["appearances"] = list(known.values())
    save_appearances(payload)
    print(f"radar: +{len(added)} new appearance(s), {len(known)} total")
    for e in sorted(added, key=lambda x: x.get("published_at") or "", reverse=True):
        print(f"  {e['published_at'] or '????-??-??'}  {e['host_show'][:28]:<28}  {e['title'][:60]}")
    return 0


if __name__ == "__main__":
    raise SystemExit(run())
