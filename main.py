"""
모각작 일일 데이터 수집 진입점.

매일 자정(KST) 기준 '어제' 하루치 데이터를 읽어 JSON으로 저장합니다.
"""
import json
import sys
from datetime import date, datetime, timedelta, timezone
from pathlib import Path

from collectors.group_participation import collect_group_participation
from collectors.timer_usage import collect_timer_usage
from config.settings import OUTPUT_DIR
from db.connection import get_readonly_engine

KST = timezone(timedelta(hours=9))


def get_target_date() -> date:
    """KST 기준 어제 날짜 (자정 스케줄 실행 시 전날 데이터 수집)."""
    now_kst = datetime.now(KST)
    return (now_kst - timedelta(days=1)).date()


def save_json(data: dict, output_path: Path) -> None:
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with output_path.open("w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2, default=str)
    print(f"저장 완료: {output_path}")


def _format_duration(seconds: int) -> str:
    hours, remainder = divmod(seconds, 3600)
    minutes, secs = divmod(remainder, 60)
    if hours:
        return f"{hours}시간 {minutes}분"
    if minutes:
        return f"{minutes}분 {secs}초"
    return f"{secs}초"


def save_summary_markdown(data: dict, output_path: Path) -> None:
    summary = data["summary"]
    lines = [
        "# 모각작 일일 데이터 요약",
        "",
        f"- **수집 대상 날짜**: {data['target_date']}",
        f"- **수집 시각 (KST)**: {data['collected_at']}",
        "",
        "## 핵심 지표",
        "",
        "| 항목 | 값 |",
        "|------|-----|",
        f"| 그룹 멤버십 (스냅샷) | {summary['membership_count']}건 |",
        f"| 세션 입장 | {summary['session_entry_count']}건 |",
        f"| 초대 생성 | {summary['invitations_created_count']}건 |",
        f"| 초대 응답 | {summary['invitations_responded_count']}건 |",
        f"| 개인 타이머 세션 | {summary['personal_session_count']}건 |",
        f"| 그룹 타이머 세션 | {summary['group_session_count']}건 |",
        f"| 개인 집중 시간 | {_format_duration(summary['personal_focus_seconds'])} |",
        f"| 그룹 집중 시간 | {_format_duration(summary['group_focus_seconds'])} |",
        "",
        "## 상세 데이터",
        "",
        f"전체 JSON: [`{data['target_date']}/daily_snapshot.json`](./{data['target_date']}/daily_snapshot.json)",
        "",
    ]
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text("\n".join(lines), encoding="utf-8")
    print(f"요약 저장 완료: {output_path}")


def _sum_focus_seconds(sessions: list[dict]) -> int:
    total = 0
    for session in sessions:
        duration = session.get("total_duration")
        if duration is not None:
            total += int(duration)
    return total


def main() -> int:
    target_date = get_target_date()
    print(f"수집 대상 날짜 (KST): {target_date}")

    engine = get_readonly_engine()

    group_data = collect_group_participation(engine, target_date)
    timer_data = collect_timer_usage(engine, target_date)

    personal_sessions = timer_data["personal_sessions"]
    group_sessions = timer_data["group_sessions"]

    payload = {
        "collected_at": datetime.now(KST).isoformat(),
        "target_date": target_date.isoformat(),
        "group_participation": group_data,
        "timer_usage": timer_data,
        "summary": {
            "membership_count": len(group_data["membership_snapshot"]),
            "session_entry_count": len(group_data["session_entries"]),
            "invitations_created_count": len(group_data["invitations_created"]),
            "invitations_responded_count": len(
                group_data["invitations_responded"]
            ),
            "personal_session_count": len(personal_sessions),
            "group_session_count": len(group_sessions),
            "personal_focus_seconds": _sum_focus_seconds(personal_sessions),
            "group_focus_seconds": _sum_focus_seconds(group_sessions),
        },
    }

    output_file = OUTPUT_DIR / target_date.isoformat() / "daily_snapshot.json"
    save_json(payload, output_file)
    save_summary_markdown(payload, OUTPUT_DIR / "latest_summary.md")

    try:
        from dashboard.build_manifest import main as build_dashboard_manifest

        build_dashboard_manifest()
    except Exception as exc:  # noqa: BLE001 - dashboard index is optional
        print(f"대시보드 manifest 갱신 건너뜀: {exc}")
    try:
        from dashboard.build_catalog import main as build_dashboard_catalog

        build_dashboard_catalog()
    except Exception as exc:  # noqa: BLE001
        print(f"대시보드 catalog 갱신 건너뜀: {exc}")

    return 0


if __name__ == "__main__":
    sys.exit(main())
