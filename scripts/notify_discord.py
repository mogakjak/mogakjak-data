"""Daily collection result → Discord webhook."""
from __future__ import annotations

import argparse
import json
import os
import sys
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
MANIFEST = ROOT / "dashboard" / "manifest.json"
GA_DIR = ROOT / "data" / "ga"
DASHBOARD_URL = "https://mogakjak.github.io/mogakjak-data/dashboard/"


def _fmt_duration(seconds: int | float | None) -> str:
    if not seconds:
        return "0분"
    total = int(seconds)
    hours, rem = divmod(total, 3600)
    minutes, _ = divmod(rem, 60)
    if hours:
        return f"{hours}시간 {minutes}분"
    return f"{minutes}분"


def _load_manifest() -> dict | None:
    if not MANIFEST.exists():
        return None
    try:
        return json.loads(MANIFEST.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return None


def _latest_db_summary(manifest: dict) -> dict:
    days = manifest.get("db_days") or []
    if not days:
        return {}
    return days[0].get("summary") or {}


def _latest_ga_metrics(date: str) -> dict:
    path = GA_DIR / f"{date}.json"
    if not path.exists():
        return {}
    try:
        payload = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return {}
    if payload.get("status") != "ok":
        return {}
    return payload.get("metrics") or {}


def build_payload(status: str, run_url: str | None, message: str | None) -> dict:
    manifest = _load_manifest()
    latest = (manifest or {}).get("latest_date") or "—"
    summary = _latest_db_summary(manifest or {})
    ga = _latest_ga_metrics(latest) if latest != "—" else {}

    if status == "success":
        title = f"모각작 일일 수집 완료 ({latest})"
        color = 0x57F287
        lines = [
            f"**수집일** {latest}",
            f"**그룹 멤버십** {summary.get('membership_count', '—')}건",
            f"**세션 입장** {summary.get('session_entry_count', '—')}건",
            f"**개인 집중** {_fmt_duration(summary.get('personal_focus_seconds'))}",
            f"**그룹 집중** {_fmt_duration(summary.get('group_focus_seconds'))}",
        ]
        if ga.get("active_users") is not None:
            lines.append(f"**GA 활성 사용자** {ga['active_users']}명")
        if ga.get("sessions") is not None:
            lines.append(f"**GA 세션** {ga['sessions']}회")
        description = "\n".join(lines)
    else:
        title = "모각작 일일 수집 실패"
        color = 0xED4245
        description = message or "GitHub Actions 로그를 확인하세요."

    fields = [{"name": "대시보드", "value": DASHBOARD_URL}]
    if run_url:
        fields.append({"name": "Actions 로그", "value": run_url})

    return {
        "embeds": [
            {
                "title": title,
                "description": description,
                "color": color,
                "fields": fields,
            }
        ]
    }


def post_webhook(url: str, payload: dict) -> None:
    data = json.dumps(payload, ensure_ascii=False).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=data,
        headers={"Content-Type": "application/json; charset=utf-8"},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=15) as resp:
        if resp.status >= 400:
            raise RuntimeError(f"Discord webhook HTTP {resp.status}")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--status", choices=("success", "failure"), required=True)
    parser.add_argument("--run-url", default=None)
    parser.add_argument("--message", default=None)
    args = parser.parse_args()

    url = os.getenv("DISCORD_WEBHOOK_URL", "").strip()
    if not url:
        print("DISCORD_WEBHOOK_URL 없음 — 알림 건너뜀", file=sys.stderr)
        return 0

    payload = build_payload(args.status, args.run_url, args.message)
    try:
        post_webhook(url, payload)
    except (urllib.error.URLError, RuntimeError) as exc:
        print(f"Discord 알림 실패: {exc}", file=sys.stderr)
        return 1

    print("Discord 알림 전송 완료")
    return 0


if __name__ == "__main__":
    sys.exit(main())
