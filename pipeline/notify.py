"""Email alert for new uploads, via Gmail SMTP with an app password.

Reads the handoff file written by poll.py. Secrets come from env vars
(MAIL_USERNAME, MAIL_APP_PASSWORD, MAIL_TO) - set as GitHub repo secrets.
"""
import json
import os
import smtplib
import sys
from email.message import EmailMessage

from . import config


def build_message(items: list[dict], sender: str, to: str) -> EmailMessage:
    if len(items) == 1:
        subject = f"New from Grace: {items[0]['title']}"
    else:
        subject = f"{len(items)} new videos from Grace \U0001F331"

    lines = []
    html_items = []
    for v in items:
        url = f"https://www.youtube.com/watch?v={v['id']}"
        published = v.get("published_at") or "recently"
        lines.append(f"- {v['title']}\n  {url}\n  published: {published}")
        html_items.append(
            f'<li style="margin-bottom:12px"><a href="{url}">{v["title"]}</a>'
            f'<br><small>published: {published}</small></li>'
        )

    text = (
        "Grace Ofure just posted:\n\n"
        + "\n\n".join(lines)
        + f"\n\nOpen your library: {config.APP_LIBRARY_URL}\n"
    )
    html = (
        '<div style="font-family:sans-serif">'
        "<h2>\U0001F331 Grace Ofure just posted</h2>"
        f"<ul>{''.join(html_items)}</ul>"
        f'<p><a href="{config.APP_LIBRARY_URL}">Open your MoneyTree library →</a></p>'
        "</div>"
    )

    msg = EmailMessage()
    msg["Subject"] = subject
    msg["From"] = sender
    msg["To"] = to
    msg.set_content(text)
    msg.add_alternative(html, subtype="html")
    return msg


def main() -> int:
    if not config.NEW_ITEMS_JSON.exists():
        print("No new-items handoff file; nothing to send.")
        return 0
    with open(config.NEW_ITEMS_JSON, encoding="utf-8") as f:
        items = json.load(f)
    if not items:
        print("Handoff file empty; nothing to send.")
        return 0

    username = os.environ.get("MAIL_USERNAME")
    password = os.environ.get("MAIL_APP_PASSWORD")
    to = os.environ.get("MAIL_TO") or username
    if not username or not password:
        print("ERROR: MAIL_USERNAME / MAIL_APP_PASSWORD env vars not set.", file=sys.stderr)
        return 1

    msg = build_message(items, sender=username, to=to)
    with smtplib.SMTP("smtp.gmail.com", 587, timeout=30) as smtp:
        smtp.starttls()
        smtp.login(username, password)
        smtp.send_message(msg)
    print(f"Sent alert for {len(items)} new video(s) to {to}.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
