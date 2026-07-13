"""엑셀 카탈로그 + FE GA 이벤트 → dashboard/metrics_catalog.json
및 data/ga/{date}_events.json (심어 둔 GA 이벤트 연동 골격)
"""
from __future__ import annotations

import csv
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CSV_PATH = ROOT / "docs" / "sheets" / "모각작_데이터수집_관리.csv"
GA_FE_PATH = ROOT / "config" / "ga_fe_events.json"
OUT_CATALOG = Path(__file__).resolve().parent / "metrics_catalog.json"
GA_DIR = ROOT / "data" / "ga"

# 파이프라인 summary / 스냅샷에서 값을 읽는 바인딩
SUMMARY_BINDINGS = {
    "PIPE_DAILY_SUMMARY": None,  # special
    "KPI_DAILY_PERSONAL_FOCUS": "personal_focus_seconds",
    "KPI_DAILY_GROUP_FOCUS": "group_focus_seconds",
    "KPI_DAILY_SESSION_COUNT": "personal_session_count+group_session_count",
    "KPI_DAILY_MEMBERSHIP": "membership_count",
    "KPI_DAILY_GROUP_ENTRY": "session_entry_count",
    "E_TIMER_USAGE_TIME": "personal_focus_seconds",
    "UG_USER_GROUP_LIST": "membership_count",
    "UG_GROUP_COUNT_PER_USER": "membership_count",
    "PIPE_MEMBERSHIP_SNAPSHOT": "membership_count",
    "PIPE_SESSION_ENTRIES": "session_entry_count",
    "PIPE_INVITATIONS_CREATED": "invitations_created_count",
    "PIPE_INVITATIONS_RESPONDED": "invitations_responded_count",
    "PIPE_PERSONAL_SESSIONS": "personal_session_count",
    "PIPE_GROUP_SESSIONS": "group_session_count",
    "DB_FOCUS_SESSION": "personal_session_count",
    "DB_GROUP_FOCUS_SESSION": "group_session_count",
    "DB_USER_GROUP": "membership_count",
    "DB_INVITATION": "invitations_created_count",
    "INV_CREATE": "invitations_created_count",
    "INV_ACCEPT": "invitations_responded_count",
    "UG_SESSION_ENTER": "session_entry_count",
    "DB_UG_ENTERED_AT": "session_entry_count",
}

GA_BASIC_BINDINGS = {
    "GA_DAILY_METRICS": None,
    "TOOL_GA4": None,
}

# 여정(Journey) — 제품 사용 흐름 4단계
JOURNEY_BY_CATEGORY = {
    "인증·온보딩": "onboarding",
    "페이지·여정": "onboarding",
    "유입": "onboarding",
    "타이머": "core",
    "할일": "core",
    "집중리포트": "core",
    "마이페이지": "core",
    "라운지": "core",
    "그룹·멤버십": "social",
    "초대": "social",
    "소셜": "social",
    "채팅": "social",
    "알림": "social",
    "시스템": "system",
    "분석도구": "system",
    "대시보드후보": "system",
    "GA4심어둔이벤트": "system",
    "기타": "system",
}

# 관점(Lens) — PM/개발이 보는 질문 축
LENS_BY_CATEGORY = {
    "유입": "growth",
    "초대": "growth",
    "그룹·멤버십": "growth",
    "대시보드후보": "growth",
    "인증·온보딩": "ux",
    "페이지·여정": "ux",
    "타이머": "ux",
    "할일": "ux",
    "집중리포트": "ux",
    "마이페이지": "ux",
    "라운지": "ux",
    "소셜": "ux",
    "채팅": "ux",
    "알림": "ux",
    "시스템": "tech",
    "분석도구": "tech",
    "GA4심어둔이벤트": "tech",
    "기타": "tech",
}

# 코드 단위 오버라이드 (대분류만으로 애매한 경우)
JOURNEY_BY_ID = {
    "PAGE_FIRST_ENTRANCE": "onboarding",
    "GA_FE_FIRST_ENTRANCE": "onboarding",
    "GA_FE_LOGIN": "onboarding",
    "GA_FE_TIMER_START": "core",
    "GA_FE_TIMER_COMPLETE": "core",
    "GA_FE_TODO_COMPLETE_CLICK": "core",
    "GA_FE_CHEER_CLICK": "social",
    "GA_FE_POKE_RESPONSE": "social",
    "GA_FE_GROUP_STAY_DURATION": "social",
    "KPI_INVITE_FUNNEL": "social",
    "PIPE_DAILY_SUMMARY": "system",
}

LENS_BY_ID = {
    "PAGE_FIRST_ENTRANCE": "growth",
    "GA_FE_FIRST_ENTRANCE": "growth",
    "INV_CREATE": "growth",
    "INV_ACCEPT": "growth",
    "UG_SESSION_ENTER": "growth",
    "UG_USER_GROUP_LIST": "growth",
    "KPI_INVITE_FUNNEL": "growth",
    "KPI_DAILY_PERSONAL_FOCUS": "ux",
    "KPI_DAILY_GROUP_FOCUS": "ux",
    "E_TIMER_USAGE_TIME": "ux",
    "POKE_RESPOND": "ux",
    "GA_FE_POKE_RESPONSE": "ux",
    "PIPE_DAILY_SUMMARY": "tech",
    "PIPE_MEMBERSHIP_SNAPSHOT": "tech",
    "PIPE_SESSION_ENTRIES": "tech",
    "PIPE_INVITATIONS_CREATED": "tech",
    "PIPE_INVITATIONS_RESPONDED": "tech",
    "PIPE_PERSONAL_SESSIONS": "tech",
    "PIPE_GROUP_SESSIONS": "tech",
    "TOOL_GA4": "tech",
    "GA_DAILY_METRICS": "tech",
}


def _assign_taxonomy(code: str, category: str, source: str = "") -> dict:
    journey = JOURNEY_BY_ID.get(code) or JOURNEY_BY_CATEGORY.get(category) or "system"
    lens = LENS_BY_ID.get(code) or LENS_BY_CATEGORY.get(category)
    if not lens:
        src = source or ""
        if code.startswith("PIPE_") or code.startswith("DB_") or "파이프" in src:
            lens = "tech"
        elif "GA" in src or code.startswith("GA_"):
            lens = "tech"
        else:
            lens = "ux"
    return {"lens": lens, "journey": journey}


def _load_ga_fe() -> list[dict]:
    if not GA_FE_PATH.exists():
        return []
    return json.loads(GA_FE_PATH.read_text(encoding="utf-8"))


def _value_binding(code: str, ga4_event: str) -> dict:
    if code in SUMMARY_BINDINGS and SUMMARY_BINDINGS[code]:
        return {"type": "db_summary", "key": SUMMARY_BINDINGS[code]}
    if code.startswith("KPI_") and code in SUMMARY_BINDINGS:
        key = SUMMARY_BINDINGS[code]
        if key:
            return {"type": "db_summary", "key": key}
    if ga4_event and ga4_event not in ("-", "") and "미확인" not in ga4_event:
        # first event name if multiple
        name = ga4_event.split("/")[0].split("(")[0].strip()
        if name and name not in ("자동 pageview만", "pageview만"):
            return {"type": "ga_event", "event_name": name}
    if code.startswith("GA_") or code in ("PAGE_FIRST_ENTRANCE",):
        return {"type": "ga_basic_or_event", "code": code}
    return {"type": "none"}


def build_catalog() -> dict:
    items: list[dict] = []
    if CSV_PATH.exists():
        with CSV_PATH.open(encoding="utf-8-sig", newline="") as f:
            reader = csv.DictReader(f)
            for row in reader:
                code = (row.get("데이터코드") or "").strip()
                if not code:
                    continue
                ga_ev = (row.get("GA4이벤트") or "").strip()
                category = row.get("대분류") or ""
                source = row.get("현재저장위치") or ""
                tax = _assign_taxonomy(code, category, source)
                items.append(
                    {
                        "id": code,
                        "name": row.get("데이터명") or code,
                        "category": category,
                        "subcategory": row.get("중분류") or "",
                        "lens": tax["lens"],
                        "journey": tax["journey"],
                        "type": row.get("지표유형") or "",
                        "source": source,
                        "ga4_event": ga_ev,
                        "pipeline": row.get("파이프라인") or "",
                        "collect_status": row.get("수집가능상태") or "",
                        "dashboard_candidate": row.get("대시보드후보") or "",
                        "related": row.get("함께보면좋은지표") or "",
                        "note": row.get("비고") or "",
                        "value_binding": _value_binding(code, ga_ev),
                        "composable": True,
                    }
                )

    # FE에 심어 둔 GA 이벤트 → 조립 가능한 지표로 추가 (엑셀에 없어도)
    existing_ga = {
        (i.get("ga4_event") or "").split("/")[0].strip()
        for i in items
    }
    for ev in _load_ga_fe():
        name = ev["event_name"]
        mid = f"GA_FE_{name.upper()}"
        if any(i["id"] == mid for i in items):
            continue
        tax = _assign_taxonomy(mid, "GA4심어둔이벤트", "GA4 (FE 전송)")
        items.append(
            {
                "id": mid,
                "name": f"[GA심음] {ev.get('label_ko') or name}",
                "category": "GA4심어둔이벤트",
                "subcategory": "FE sendGAEvent",
                "lens": tax["lens"],
                "journey": tax["journey"],
                "type": "원자지표",
                "source": "GA4 (FE 전송)",
                "ga4_event": name,
                "pipeline": "미수집(건수는 API 연동 후)",
                "collect_status": "부분수집(GA전송중·대시보드건수대기)",
                "dashboard_candidate": "후보",
                "related": "",
                "note": f"FE 계측됨 · {ev.get('file_hint', '')}",
                "value_binding": {"type": "ga_event", "event_name": name},
                "composable": True,
                "instrumented_in_fe": True,
                "params": ev.get("params") or [],
            }
        )
        existing_ga.add(name)

    return {
        "version": 2,
        "taxonomy": {
            "lens": [
                {"id": "growth", "label": "성장(Growth)"},
                {"id": "ux", "label": "퍼널(UX)"},
                {"id": "tech", "label": "개발(Tech)"},
            ],
            "journey": [
                {"id": "onboarding", "label": "온보딩"},
                {"id": "core", "label": "핵심기능"},
                {"id": "social", "label": "소셜"},
                {"id": "system", "label": "시스템"},
            ],
        },
        "item_count": len(items),
        "ga_fe_event_count": len(_load_ga_fe()),
        "items": items,
    }


def write_ga_events_for_dates(dates: list[str]) -> None:
    """심어 둔 GA 이벤트 목록을 날짜별 JSON으로 저장 (건수는 API 연동 후)."""
    GA_DIR.mkdir(parents=True, exist_ok=True)
    events = []
    for ev in _load_ga_fe():
        events.append(
            {
                "event_name": ev["event_name"],
                "label_ko": ev.get("label_ko"),
                "params": ev.get("params") or [],
                "instrumented": True,
                "count": None,
                "status": "awaiting_ga4_api",
                "note": "FE에서 GA로 전송 중. 건수는 GA4 Data API 연동 후 채워짐.",
            }
        )
    for date in dates:
        path = GA_DIR / f"{date}_events.json"
        payload = {
            "source": "ga4_fe_instrumentation",
            "target_date": date,
            "status": "events_linked_counts_pending",
            "event_count": len(events),
            "events": events,
        }
        path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")


def main() -> None:
    catalog = build_catalog()
    OUT_CATALOG.write_text(
        json.dumps(catalog, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )

    # DB 날짜 기준으로 events 파일 생성
    data_dir = ROOT / "data"
    dates: list[str] = []
    if data_dir.exists():
        for p in data_dir.iterdir():
            if p.is_dir() and p.name != "ga" and (p / "daily_snapshot.json").exists():
                dates.append(p.name)
    if not dates:
        from datetime import date, timedelta

        dates = [(date.today() - timedelta(days=1)).isoformat()]
    write_ga_events_for_dates(sorted(dates))

    print(
        f"catalog: {OUT_CATALOG} ({catalog['item_count']}지표, "
        f"GA FE {catalog['ga_fe_event_count']}개)"
    )


if __name__ == "__main__":
    main()
