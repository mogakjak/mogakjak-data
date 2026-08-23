"""GA4 Data API 일별 핵심 지표 + FE 이벤트 카탈로그 연동."""
from __future__ import annotations

import json
import os
from datetime import date, datetime, timedelta, timezone
from pathlib import Path

from config.settings import BASE_DIR, OUTPUT_DIR

KST = timezone(timedelta(hours=9))
GA_DIR = OUTPUT_DIR / "ga"
FE_EVENTS_PATH = BASE_DIR / "config" / "ga_fe_events.json"

CORE_METRICS_BATCHES = [
    [
        "activeUsers",
        "newUsers",
        "sessions",
        "engagedSessions",
        "averageSessionDuration",
    ],
    [
        "bounceRate",
        "engagementRate",
        "sessionsPerUser",
        "screenPageViews",
        "eventCount",
    ],
    ["userEngagementDuration"],
]

METRIC_KEY_MAP = {
    "activeUsers": "active_users",
    "newUsers": "new_users",
    "sessions": "sessions",
    "engagedSessions": "engaged_sessions",
    "averageSessionDuration": "average_engagement_time_sec",
    "bounceRate": "bounce_rate",
    "engagementRate": "engagement_rate",
    "sessionsPerUser": "sessions_per_user",
    "screenPageViews": "screen_page_views",
    "eventCount": "event_count_total",
    "userEngagementDuration": "user_engagement_duration_sec",
}


def ga_enabled() -> bool:
    return bool(
        os.getenv("GA4_PROPERTY_ID") and os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
    )


def _property_id() -> str:
    raw = (os.getenv("GA4_PROPERTY_ID") or "").strip()
    return raw.replace("properties/", "")


def _load_fe_catalog() -> list[dict]:
    if not FE_EVENTS_PATH.exists():
        return []
    return json.loads(FE_EVENTS_PATH.read_text(encoding="utf-8"))


def _save_json(path: Path, payload: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")


def _run_report(client, target_date: date, dimensions: list[str], metrics: list[str]):
    from google.analytics.data_v1beta.types import DateRange, Dimension, Metric, RunReportRequest

    request = RunReportRequest(
        property=f"properties/{_property_id()}",
        dimensions=[Dimension(name=d) for d in dimensions],
        metrics=[Metric(name=m) for m in metrics],
        date_ranges=[DateRange(start_date=target_date.isoformat(), end_date=target_date.isoformat())],
    )
    return client.run_report(request)


def _collect_core_metrics(client, target_date: date) -> dict:
    metrics: dict = {v: None for v in METRIC_KEY_MAP.values()}
    metrics["retention_d1"] = None
    metrics["retention_d7"] = None
    metrics["retention_d30"] = None

    for batch in CORE_METRICS_BATCHES:
        response = _run_report(client, target_date, [], batch)
        row = response.rows[0] if response.rows else None
        if not row:
            continue
        for idx, header in enumerate(response.metric_headers):
            key = METRIC_KEY_MAP.get(header.name)
            if not key:
                continue
            raw = row.metric_values[idx].value
            if raw in ("", "(not set)"):
                metrics[key] = None
            elif header.name in ("bounceRate", "engagementRate"):
                metrics[key] = float(raw)
            elif header.name in ("averageSessionDuration", "sessionsPerUser"):
                metrics[key] = float(raw)
            else:
                metrics[key] = int(float(raw))
    return metrics


def _collect_event_counts(client, target_date: date) -> dict[str, int]:
    response = _run_report(client, target_date, ["eventName"], ["eventCount"])
    counts: dict[str, int] = {}
    for row in response.rows:
        name = row.dimension_values[0].value
        count = int(float(row.metric_values[0].value))
        counts[name] = count
    return counts


def _build_events_payload(
    target_date: date,
    event_counts: dict[str, int],
    fe_catalog: list[dict],
) -> dict:
    fe_by_name = {item["event_name"]: item for item in fe_catalog}
    events: list[dict] = []

    for item in fe_catalog:
        name = item["event_name"]
        count = event_counts.get(name)
        events.append(
            {
                "event_name": name,
                "label_ko": item.get("label_ko") or name,
                "params": item.get("params") or [],
                "instrumented": True,
                "in_ga4": count is not None,
                "count": count,
                "status": "ok" if count is not None else "missing_in_ga4",
                "note": "GA4 Data API eventCount" if count is not None else "FE catalog only",
            }
        )

    for name, count in sorted(event_counts.items()):
        if name in fe_by_name:
            continue
        events.append(
            {
                "event_name": name,
                "label_ko": name,
                "params": [],
                "instrumented": False,
                "in_ga4": True,
                "count": count,
                "status": "ok",
                "note": "GA4 Data API eventCount",
            }
        )

    instrumented_in_ga = sum(1 for e in events if e["instrumented"] and e["in_ga4"])
    return {
        "source": "ga4_all_events",
        "target_date": target_date.isoformat(),
        "status": "events_linked_counts_ok",
        "event_count": len(events),
        "ga4_event_name_count": len(event_counts),
        "fe_catalog_count": len(fe_catalog),
        "events": events,
        "instrumented_in_ga_count": instrumented_in_ga,
    }


def collect_ga_metrics(target_date: date) -> dict:
    if not ga_enabled():
        return {
            "source": "ga4",
            "status": "disabled",
            "target_date": target_date.isoformat(),
            "property_id": None,
            "collected_at": datetime.now(KST).isoformat(),
            "metrics": {},
            "note": "GA 자격증명 없음",
        }

    from google.analytics.data_v1beta import BetaAnalyticsDataClient

    client = BetaAnalyticsDataClient()
    metrics = _collect_core_metrics(client, target_date)
    event_counts = _collect_event_counts(client, target_date)
    fe_catalog = _load_fe_catalog()

    core_payload = {
        "source": "ga4",
        "status": "ok",
        "target_date": target_date.isoformat(),
        "property_id": _property_id(),
        "collected_at": datetime.now(KST).isoformat(),
        "metrics": metrics,
        "checklist": [
            {"item": "GA4 Property ID / 측정 ID 확인", "done": True},
            {"item": "서비스 계정 + Data API 권한", "done": True},
            {"item": "파이프라인 ga collector 구현", "done": True},
            {"item": "Secrets에 GA 인증정보 등록", "done": False},
        ],
        "note": "GA4 Data API 수집. 리텐션(D1/D7/D30)은 추후 보강.",
    }
    events_payload = _build_events_payload(target_date, event_counts, fe_catalog)

    _save_json(GA_DIR / f"{target_date.isoformat()}.json", core_payload)
    _save_json(GA_DIR / f"{target_date.isoformat()}_events.json", events_payload)
    return core_payload
