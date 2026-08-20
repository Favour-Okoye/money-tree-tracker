"""Static configuration for the MoneyTree data pipeline."""
from pathlib import Path

CHANNEL_ID = "UCZe6cjgY3eVvePd3DQR6uig"
# YouTube convention: the uploads playlist is the channel ID with UC -> UU.
UPLOADS_PLAYLIST_ID = "UU" + CHANNEL_ID[2:]
CHANNEL_TITLE = "Grace Ofure Zone"
CHANNEL_HANDLE = "@graceofure"
RSS_URL = f"https://www.youtube.com/feeds/videos.xml?channel_id={CHANNEL_ID}"

REPO_ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = REPO_ROOT / "data"
VIDEOS_JSON = DATA_DIR / "videos.json"
LATEST_JSON = DATA_DIR / "latest.json"
# Handoff file between poll (writer) and notify (reader) within one workflow run.
NEW_ITEMS_JSON = REPO_ROOT / "pipeline" / ".new_items.json"

LATEST_COUNT = 30
SHORT_MAX_SECONDS = 62
DESCRIPTION_SNIPPET_CHARS = 300
USER_AGENT = "MoneyTreeTracker/1.0 (personal mentor-tracker pipeline)"
APP_LIBRARY_URL = "https://favour-okoye.github.io/money-tree-tracker/#/library"
