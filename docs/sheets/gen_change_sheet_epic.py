# -*- coding: utf-8 -*-
"""변경안 시트 — 에픽 묶음형 (영향 분석을 본 변경 바로 아래 배치)"""
import csv
from pathlib import Path

OUT = Path(r"c:\00_mogakjak\mogakjak_data_pipeline\docs\sheets")
OUT_PASTE = OUT / "모각작_정책변경안_에픽묶음형_붙여넣기.csv"
OUT_SLIM = OUT / "모각작_정책변경안_에픽묶음형.csv"

HDR = [
    "",
    "변경ID",
    "상위ID",
    "유형",
    "관련정책ID",
    "대분류",
    "중분류",
    "AS-IS(현재)",
    "TO-BE(변경안)",
    "설명",
    "구현(현재)",
    "구현(목표)",
    "출처/위치",
    "우선순위",
    "상태",
    "비고",
]


def row(cid, parent, kind, pids, major, minor, asis, tobe, desc, impl_now, impl_tgt, src, pri, status, note):
    return ["", cid, parent, kind, pids, major, minor, asis, tobe, desc, impl_now, impl_tgt, src, pri, status, note]


def blank():
    return ["", "", "", "", "", "", "", "", "", "", "", "", "", "", "", ""]


# 유형: 변경 | 영향·유지 | 영향·수정 | 참고(구현)
ROWS = [
    ["", "🍅 모각작 정책 변경안 — 에픽 묶음형", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
    ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
    [
        "",
        "■ 읽는 법",
        "",
        "",
        "",
        "",
        "상위ID가 같으면 한 덩어리(에픽). 유형=변경이 먼저, 그 아래 영향·유지/수정이 이어짐.",
        "",
        "영향·유지 = 로직 그대로 두면 됨 / 영향·수정 = 코드 손봐야 함",
        "",
        "",
        "",
        "",
        "",
        "",
    ],
    ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
    HDR,
    # ── 멤버카드 (독립 변경, 영향 분리 불필요) ──
    ["", "📋 멤버카드", "", "", "", "", "", "", "", "", "", "", "", "", ""],
    row(
        "CHG-001", "", "변경", "MC06,SD04", "그룹방_멤버카드", "하단-시간표시",
        "personalTimerSeconds(세션 경과) 표시",
        "todo.actualTimeInSeconds(작업 누적) = SD04와 동일",
        "내 시간·타인 시야·사이드바 누적 불일치 해소",
        "구현됨(FE+BE)", "구현됨(FE+BE)",
        "groupMemberState · useLiveTimer · MemberStatusDto",
        "높음", "검토중", "완료 시 gid=0 MC06 문구 갱신",
    ),
    row(
        "CHG-002", "", "변경", "MC05,ST02,ST03", "그룹방_멤버카드", "상태-rest/finish",
        "finish 후 RESTING → '쉬어갈래요'로 보임",
        "end/rest/누적 표시 규칙 재정의",
        "타이머 종료 후에도 참여 중처럼 보이는 UX",
        "구현됨(FE+BE)", "구현됨(FE+BE)",
        "syncGroupParticipation · groupMemberState",
        "중간", "검토중", "",
    ),
    row(
        "CHG-003", "", "변경", "MC09", "그룹방_멤버카드", "최근참여 표시",
        "enteredAt 기준 N일 전",
        "lastActiveAt / 마지막 타이머 종료 기준",
        "필드명·의미 불일치",
        "구현됨(BE)", "구현됨(FE+BE)",
        "daysSinceLastParticipation",
        "낮음", "검토중", "",
    ),
    blank(),
    # ── 에픽: 공통 타이머 제거 ──
    ["", "📦 에픽 — 공통 타이머 제거 (CHG-004)", "", "", "", "", "", "", "", "", "", "", "", "", ""],
    row(
        "CHG-004", "", "변경", "GT01~GT08,GX01,GS02,CH01", "그룹 타이머", "전체",
        "group_focus_session UI·API·WS·모달 운영",
        "전부 제거. 개인 타이머(TM01~02)만 유지",
        "UX 단순화",
        "구현됨(FE+BE)", "삭제",
        "groupTimer · GroupFocusSession* · alertModal",
        "높음", "기획검토", "아래 영향 행을 순서대로 검토",
    ),
    row(
        "CHG-004-01", "CHG-004", "영향·유지", "ST02,SD02,SD04,SD05,TM01,TM02", "개인타이머·사이드바", "—",
        "그룹방 개인 타이머·사이드바 연동 그대로",
        "변경 없음",
        "공통 타이머만 제거, 개인 축은 핵심 기능",
        "구현됨(FE+BE)", "구현됨(FE+BE)",
        "timerComponent · groupMySidebar",
        "높음", "검토중", "✓ 체크만 하면 됨",
    ),
    row(
        "CHG-004-02", "CHG-004", "영향·유지", "RP05,RP19", "집중리포트", "모각작 몰입",
        "focus_session 그룹 참여(개인타이머) 시간 합",
        "집계 유지. 라벨만 '개인 타이머' 의미 명확화",
        "모각작 몰입 ≠ 공통 타이머 (혼동 방지)",
        "구현됨(FE+BE)", "구현됨(FE+BE)",
        "RecordDashboardService · RP19",
        "중간", "검토중", "✓ 체크만",
    ),
    row(
        "CHG-004-03", "CHG-004", "영향·수정", "GX01,GT08,GS02", "그룹방_나가기", "퇴장 분기",
        "마지막 유저 퇴장 시 groupTimer finish",
        "개인 타이머 forceStop + GS02만",
        "GX01에서 공통 타이머 finish 호출 삭제",
        "구현됨(FE)", "구현됨(FE)",
        "groupPage · leaveGroupSession",
        "높음", "검토중", "⚠ 코드 수정",
    ),
    row(
        "CHG-004-04", "CHG-004", "영향·유지", "GH01,GH02", "홈·그룹방 UI", "몰입 배지",
        "PARTICIPATING 기준 몰입/휴식 배지",
        "변경 없음",
        "개인 타이머 기준이라 영향 없음",
        "구현됨(FE)", "구현됨(FE)",
        "groupRoom · StateButton",
        "낮음", "검토중", "✓ 체크만",
    ),
    row(
        "CHG-004-05", "CHG-004", "영향·유지", "MC05,CH02,PK03", "멤버카드·소통", "—",
        "상태·응원·콕 = 개인타이머/세션 기준",
        "변경 없음",
        "공통 타이머와 독립",
        "구현됨(FE+BE)", "구현됨(FE+BE)",
        "groupFriendField · forkPopup",
        "낮음", "검토중", "✓ 체크만",
    ),
    row(
        "CHG-004-06", "CHG-004", "영향·수정", "GT01~GT08", "BE·DB·WS", "group_focus_session",
        "테이블·API·WS 존재",
        "미사용/제거. 데이터 보존 여부 결정",
        "레거시 정리",
        "구현됨(BE)", "삭제",
        "GroupFocusSession*",
        "높음", "검토중", "⚠ 코드 수정",
    ),
    row(
        "CHG-004-07", "CHG-004", "영향·수정", "GT01,GT02", "FE", "alertModal",
        "groupTimerLimit 모달",
        "타입·호출 제거",
        "FE 잔여 코드",
        "구현됨(FE)", "삭제",
        "alertModal.tsx",
        "중간", "검토중", "⚠ 코드 수정",
    ),
    row(
        "CHG-004-08", "CHG-004", "영향·수정", "RP19", "데이터파이프라인", "지표",
        "group_focus_session 지표 가능",
        "deprecated 처리",
        "분석 스키마 정리",
        "구현됨(BE)", "삭제",
        "mogakjak_data_pipeline",
        "낮음", "검토중", "⚠ 코드 수정",
    ),
    blank(),
    # ── 에픽: 그룹 목표 제거 ──
    ["", "📦 에픽 — 그룹 목표·달성률 제거 (CHG-005)", "", "", "", "", "", "", "", "", "", "", "", "", ""],
    row(
        "CHG-005", "", "변경", "GM04,GM07,GR02", "그룹방_관리", "그룹 목표·달성률",
        "목표 설정 UI + accumulated/goal 달성률",
        "UI·API 제거",
        "공통 타이머 제거와 함께 accumulated 의존 소멸",
        "구현됨(FE+BE)", "삭제",
        "groupGoal · GroupDetailResponse",
        "높음", "기획검토", "",
    ),
    row(
        "CHG-005-01", "CHG-005", "영향·수정", "GM07,GM04,GR02", "GroupDetail API", "필드",
        "goalSeconds·progress·accumulatedDuration",
        "필드 제거 또는 deprecated",
        "API 계약 변경",
        "구현됨(FE+BE)", "삭제",
        "GroupDetailResponse",
        "높음", "검토중", "⚠ 코드 수정",
    ),
    row(
        "CHG-005-02", "CHG-005", "영향·수정", "OB01", "온보딩", "mock",
        "튜토리얼에 groupGoal 더미",
        "mock에서 제거",
        "튜토리얼 정리",
        "구현됨(FE)", "구현됨(FE)",
        "onboarding mock",
        "낮음", "검토중", "⚠ 코드 수정",
    ),
    row(
        "CHG-005-03", "CHG-005", "영향·수정", "CH01,GS02", "응원·누적", "리셋",
        "cheer 리셋 유지 + accumulated 갱신",
        "cheer(CH01) 유지, accumulated 코드 삭제",
        "CHG-004·005 공통 dead code",
        "구현됨(BE)", "구현됨(BE)",
        "resetAllCheerCounts",
        "중간", "검토중", "⚠ 코드 수정",
    ),
    blank(),
    # ── 집중체크 통일 (변경만, 영향이 곧 본문) ──
    ["", "📋 집중체크 통일", "", "", "", "", "", "", "", "", "", "", "", "", ""],
    row(
        "CHG-006", "", "변경", "GM02,LN08", "그룹방_관리", "집중체크 알림",
        "방장·1~23h·타이머 중만",
        "라운지형: 정각 + opt-in + presence",
        "일반/라운지 정책 통일",
        "구현됨(FE+BE)", "구현됨(FE+BE)",
        "groupNoti · OfficialLoungeFocusNotification",
        "높음", "기획검토", "",
    ),
    row(
        "CHG-007", "", "변경", "GM03,LN09", "그룹방_관리", "집중체크 수신자",
        "ActiveFocusSession(타이머 실행)만",
        "세션 입장 + opt-in (LN09 동일)",
        "타이머 없이도 알림 가능",
        "구현됨(BE)", "구현됨(FE+BE)",
        "FocusNotificationService",
        "높음", "기획검토", "",
    ),
    blank(),
    # ── 구현 참고 (정책 아님) ──
    ["", "🔧 구현 참고 (정책 범위 외)", "", "", "", "", "", "", "", "", "", "", "", "", ""],
    row(
        "CHG-008", "", "참고(구현)", "GT01~GT08,GM04,GM02", "그룹방", "상단 UI",
        "타이머+목표+집중체크 3칸",
        "2칸 이하 재배치 (라운지 LN07 참고)",
        "레이아웃만. 정책 시트 미기록",
        "구현됨(FE)", "구현 예정(FE)",
        "groupPage.tsx",
        "중간", "참고", "CHG-018과 동일 주제",
    ),
    row(
        "CHG-018", "CHG-008", "참고(구현)", "CHG-008", "그룹방", "상단 재배치",
        "3칸 그리드",
        "2칸 축소",
        "CHG-008 구현 메모",
        "", "구현 예정(FE)",
        "groupPage.tsx",
        "중간", "참고", "",
    ),
]


def main():
    # also overwrite the main change-sheet files with epic format
    out_main = OUT / "모각작_정책변경안_AS-IS_TO-BE.csv"
    out_paste = OUT / "모각작_정책변경안_AS-IS_TO-BE_붙여넣기.csv"

    with OUT_PASTE.open("w", encoding="utf-8-sig", newline="") as f:
        csv.writer(f).writerows(ROWS)
    with out_paste.open("w", encoding="utf-8-sig", newline="") as f:
        csv.writer(f).writerows(ROWS)

    slim_hdr = HDR[1:]
    slim = [slim_hdr]
    for r in ROWS:
        if len(r) >= 16 and (r[1] or "").startswith("CHG"):
            slim.append(r[1:16])
    with OUT_SLIM.open("w", encoding="utf-8-sig", newline="") as f:
        csv.writer(f).writerows(slim)
    with out_main.open("w", encoding="utf-8-sig", newline="") as f:
        csv.writer(f).writerows(slim)
    print("epic format:", len(slim) - 1, "rows")


if __name__ == "__main__":
    main()
