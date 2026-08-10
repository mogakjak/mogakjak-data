# -*- coding: utf-8 -*-
"""변경안 시트 gid=0 양식 통일 + 내용 보강"""
import csv
from pathlib import Path

OUT = Path(r"c:\00_mogakjak\mogakjak_data_pipeline\docs\sheets")
POLICY = OUT / "모각작_서비스정책_단순ID_gid0_붙여넣기.csv"
OUT_CSV = OUT / "모각작_정책변경안_AS-IS_TO-BE.csv"
OUT_PASTE = OUT / "모각작_정책변경안_AS-IS_TO-BE_붙여넣기.csv"


def load_policies():
    pmap = {}
    import io
    raw = POLICY.read_bytes().replace(b"\r\r\n", b"\n").decode("utf-8")
    for row in csv.reader(io.StringIO(raw)):
        if len(row) < 6:
            continue
        pid = (row[1] or "").strip()
        if not pid or len(pid) > 6 or not pid[:2].isalpha():
            continue
        if pid not in pmap:
            pmap[pid] = {
                "major": row[2].strip(),
                "minor": row[3].strip(),
                "content": row[4].strip(),
                "impl": row[5].strip() if len(row) > 5 else "",
                "src": row[6].strip() if len(row) > 6 else "",
                "note": row[7].strip() if len(row) > 7 else "",
            }
    return pmap


def impl_for(pmap, ids, default=""):
    parts = []
    for pid in ids.replace("~", ",").split(","):
        pid = pid.strip()
        if pid in pmap and pmap[pid]["impl"]:
            parts.append(f"{pid}:{pmap[pid]['impl']}")
    return " · ".join(parts) if parts else default


def src_for(pmap, ids):
    parts = []
    for pid in ids.split(","):
        pid = pid.strip()
        if pid in pmap and pmap[pid]["src"]:
            parts.append(pmap[pid]["src"])
    return " · ".join(dict.fromkeys(parts))


HDR = [
    "",
    "변경ID",
    "관련정책ID",
    "대분류",
    "중분류",
    "AS-IS(현재)",
    "TO-BE(변경안)",
    "변경 이유",
    "구현 여부(현재)",
    "구현 여부(목표)",
    "출처/위치",
    "우선순위",
    "상태",
    "비고",
]

ROWS = [
    ["", "🍅 모각작 정책 변경안 (AS-IS → TO-BE)", "", "", "", "", "", "", "", "", "", "", "", ""],
    ["", "", "", "", "", "", "", "", "", "", "", "", "", ""],
    [
        "",
        "■ 시트 안내",
        "",
        "",
        "",
        "gid=0(현재 정책)과 동일한 대분류·중분류·구현여부 라벨 사용",
        "",
        "상태: 검토중 / 기획검토 / 개발중 / 완료 / 폐기 / 참고(정책제외)",
        "",
        "구현 여부 4라벨 = gid=0과 동일 (구현됨(FE+BE)·구현됨(FE)·구현됨(BE)·데이터만(DB))",
        "",
        "릴리스 후 gid=0 해당 행 갱신 → 본 시트 상태=완료",
        "",
        "",
    ],
    ["", "", "", "", "", "", "", "", "", "", "", "", "", ""],
    HDR,
    ["", "📋 멤버카드", "", "", "", "", "", "", "", "", "", "", "", ""],
    [
        "CHG-001",
        "MC06,SD04",
        "그룹방_멤버카드",
        "하단-시간표시",
        "카드 하단에 개인 타이머 세션 경과 시간(personalTimerSeconds) 표시. 타이머 실행 중에만 증가하는 '이번 세션' 시간.",
        "todo.actualTimeInSeconds(할일 누적 시간) 표시. 사이드바(SD04)·할일 카드와 동일 데이터 소스.",
        "내가 보는 시간·남이 보는 시간·사이드바 누적이 서로 달라 혼란. 작업 기준 누적으로 통일.",
        "구현됨(FE+BE)",
        "구현됨(FE+BE)",
        "groupMemberState.tsx · useLiveTimer · MemberStatusDto.personalTimerSeconds · groupMySidebar actualTime",
        "높음",
        "검토중",
        "gid=0 MC06 정책 문구·출처 동시 수정",
    ],
    [
        "CHG-002",
        "MC05,ST02,ST03",
        "그룹방_멤버카드",
        "상태-rest/finish",
        "개인 타이머 finish 후 participationStatus=RESTING 유지 → 카드에 '쉬어갈래요'(rest)로 보임. end(최근 참여)와 구분 모호.",
        "finish 직후 표시 규칙 재정의: end(최근 참여)·rest(세션만 참여)·누적시간 표시 조건을 명확히 분리.",
        "타이머 종료 후에도 참여 중처럼 보이는 UX. 상태 용어(ST02/ST03)와 카드 문구 불일치.",
        "구현됨(FE+BE)",
        "구현됨(FE+BE)",
        "syncGroupParticipation · groupMemberState.tsx · GroupParticipationStatus",
        "중간",
        "검토중",
        "",
    ],
    [
        "CHG-003",
        "MC09",
        "그룹방_멤버카드",
        "최근참여 표시",
        "end 상태에서 enteredAt 기준 'N일 전' 표시. 필드명·의미가 '최근 참여'와 어긋남.",
        "lastActiveAt 또는 마지막 타이머 종료 시점 기준으로 'N분/일 전' 표시. 라벨·필드 정합.",
        "MC09 정책명과 실제 집계 필드 불일치. 홈·라운지 멤버 표시(LN14)와도 정렬 필요.",
        "구현됨(BE)",
        "구현됨(FE+BE)",
        "daysSinceLastParticipation · MemberStatusDto · MC09",
        "낮음",
        "검토중",
        "LN15(메이트 필터)와 무관 — MC09 단독 이슈",
    ],
    ["", "", "", "", "", "", "", "", "", "", "", "", "", ""],
    ["", "📋 그룹 기능 제거", "", "", "", "", "", "", "", "", "", "", "", ""],
    [
        "CHG-004",
        "GT01~GT08,GX01,GS02,CH01",
        "그룹 타이머",
        "전체",
        "그룹 공통 타이머(group_focus_session): 2명 이상 세션 참여 시 시작·누구나 제어·finish 시 accumulated 반영·퇴장 분기(GT07~08·GX01).",
        "공통 타이머 UI·API·WS·모달 전부 제거. 그룹방에서는 개인 타이머(TM01~02)만 유지.",
        "UX 단순화. 개인 타이머와 공통 타이머 이중 구조 제거.",
        "구현됨(FE+BE)",
        "삭제",
        "groupTimer.tsx · GroupFocusSession* · alertModal groupTimerLimit · groupPage 나가기 분기",
        "높음",
        "기획검토",
        "CH01 응원 리셋은 유지·GT 연동만 제거",
    ],
    [
        "CHG-005",
        "GM04,GM07,GR02",
        "그룹방_관리",
        "그룹 목표·달성률",
        "방장 UI에서 목표 시간 설정·달성률(accumulatedDuration/goalSeconds) 표시. 생성 기본값 목표=0(GR02).",
        "목표·달성률 UI/API 제거. GroupDetail goal/progress/accumulated 필드 deprecated.",
        "공통 타이머 제거 시 accumulated 의존 소멸. 상단 UI 공간 확보.",
        "구현됨(FE+BE)",
        "삭제",
        "groupGoal.tsx · setGroupGoal · GroupDetailResponse · Group.java goalSeconds",
        "높음",
        "기획검토",
        "gid=0에 GM07(목표표시) 행 추가 권장",
    ],
    ["", "", "", "", "", "", "", "", "", "", "", "", "", ""],
    ["", "📋 집중체크 통일", "", "", "", "", "", "", "", "", "", "", "", ""],
    [
        "CHG-006",
        "GM02,LN08",
        "그룹방_관리",
        "집중체크 알림",
        "방장(HOST)만 설정·1~23시간 주기·개인 타이머 실행 중인 멤버 대상 알림. 기본 ON·1시간.",
        "라운지(LN08)와 동일: 매 시 정각·개인 opt-in 토글·presence 기반. 방장 전용 설정 제거 검토.",
        "일반 그룹방 vs 공식 라운지 집중체크 UX·정책 불일치 해소.",
        "구현됨(FE+BE)",
        "구현됨(FE+BE)",
        "groupNoti.tsx · modifyFocusNotification · FocusNotificationScheduler · OfficialLoungeFocusNotification",
        "높음",
        "기획검토",
        "FE 주기 UI 1~99 vs BE Max 23 불일치 별도 확인",
    ],
    [
        "CHG-007",
        "GM03,LN09",
        "그룹방_관리",
        "집중체크 수신자",
        "ActiveFocusSession(개인 타이머 실행) 있는 유저에게만 집중체크 알림 발송.",
        "라운지(LN09)와 동일: 세션 입장 + opt-in true면 수신. 타이머 미실행이어도 알림 가능.",
        "타이머 없이 방에만 있는 멤버도 집중체크 대상으로 포함할지 정책 통일.",
        "구현됨(BE)",
        "구현됨(FE+BE)",
        "FocusNotificationService · UserGroup participationStatus · LN09",
        "높음",
        "기획검토",
        "",
    ],
    ["", "", "", "", "", "", "", "", "", "", "", "", "", ""],
    ["", "📋 레이아웃 (정책 범위 외)", "", "", "", "", "", "", "", "", "", "", "", ""],
    [
        "CHG-008",
        "GT01~GT08,GM04,GM02",
        "그룹방",
        "상단 UI",
        "상단 3칸: 그룹 공통 타이머 + 그룹 목표 + 집중체크(방장).",
        "GT·목표 제거 후 2칸 이하 재배치. 라운지 상단(LN07) 레이아웃 참고.",
        "기능 제거에 따른 UI 재배치. 정책 시트에는 레이아웃 상세 미기록.",
        "구현됨(FE)",
        "구현 예정(FE)",
        "groupPage.tsx · loungePage.tsx",
        "중간",
        "참고(정책제외)",
        "구현 체크리스트용. CHG-018과 연계",
    ],
    ["", "", "", "", "", "", "", "", "", "", "", "", "", ""],
    ["", "📋 영향 분석", "", "", "", "", "", "", "", "", "", "", "", ""],
    [
        "CHG-009",
        "RP05,RP19,GT01",
        "집중리포트",
        "모각작 몰입",
        "리포트 '모각작 몰입' = focus_session 중 그룹 참여(개인 타이머) 시간 합. group_focus_session은 미포함(RP33).",
        "공통 타이머 제거와 무관. 집계 로직 유지. 라벨·도움말만 '그룹방 개인 타이머' 의미 명확화.",
        "CHG-004와 혼동 방지. 모각작 몰입 ≠ 공통 타이머.",
        "구현됨(FE+BE)",
        "구현됨(FE+BE)",
        "RecordDashboardService · RP19 · RP05",
        "중간",
        "검토중",
        "",
    ],
    [
        "CHG-010",
        "ST02,SD02,SD04,SD05,TM01,TM02",
        "개인타이머·사이드바",
        "유지",
        "그룹방 내 개인 타이머·사이드바 작업 선택·누적·강제종료 정책 그대로.",
        "변경 없음. CHG-004는 공통 타이머만 제거.",
        "공통 타이머 제거 시 개인 타이머 축은 핵심 기능으로 유지.",
        "구현됨(FE+BE)",
        "구현됨(FE+BE)",
        "timerComponent · groupMySidebar · FocusSessionServiceImpl",
        "높음",
        "검토중",
        "",
    ],
    [
        "CHG-011",
        "GX01,GT08,GS02",
        "그룹방_나가기",
        "퇴장·타이머 분기",
        "마지막 참여자 퇴장 시 그룹타이머 finish(GT08). 타이머 중 이탈 시 GX01 모달.",
        "공통 타이머 분기 제거. 개인 타이머 forceStop + 세션 퇴장(GS02)만.",
        "이탈 플로우 단순화. GX01에서 groupTimer finish 호출 삭제.",
        "구현됨(FE)",
        "구현됨(FE)",
        "groupPage.tsx · useBlockGroupTimerNavigation · leaveGroupSession",
        "높음",
        "검토중",
        "",
    ],
    [
        "CHG-012",
        "CH01,GS02,GM07",
        "응원·누적",
        "리셋 조건",
        "전원 NOT_PARTICIPATING 시 cheerCount=0(CH01). 목표 달성률은 accumulatedDuration 갱신(GM07).",
        "응원 리셋(CH01) 유지. accumulated·목표 연동 코드는 deprecated/삭제.",
        "목표·공통타이머 제거 후 dead code 정리.",
        "구현됨(BE)",
        "구현됨(BE)",
        "resetAllCheerCounts · leaveGroupSession · GroupDetail accumulated",
        "중간",
        "검토중",
        "",
    ],
    [
        "CHG-013",
        "GH01,GH02",
        "홈·그룹방 UI",
        "몰입 배지",
        "PARTICIPATING≥1이면 '몰입 중' 배지(GH01). 인원 (타이머 실행)/(전체)(GH02).",
        "변경 없음. 공통 타이머 제거와 무관(개인 타이머 기준 유지).",
        "영향 없음 확인용.",
        "구현됨(FE)",
        "구현됨(FE)",
        "groupRoom · home groupCard · StateButton",
        "낮음",
        "검토중",
        "",
    ],
    [
        "CHG-014",
        "MC05,CH02,PK03",
        "멤버카드·소통",
        "개인타이머 연동",
        "멤버카드 상태·응원(CH02)·콕(PK03) 모두 개인 타이머/세션 참여 상태 기준.",
        "변경 없음. 공통 타이머와 독립.",
        "제거 대상이 공통 타이머뿐임을 명시.",
        "구현됨(FE+BE)",
        "구현됨(FE+BE)",
        "groupFriendField · forkPopup · MC05",
        "낮음",
        "검토중",
        "",
    ],
    [
        "CHG-015",
        "GT01~GT08",
        "BE·DB·WS",
        "group_focus_session",
        "group_focus_session 테이블·API·WS 토픽·스케줄러 존재.",
        "미사용 처리 또는 제거. 기존 데이터 보존 여부 결정 필요.",
        "레거시 정리·운영 리스크 감소.",
        "구현됨(BE)",
        "삭제",
        "GroupFocusSession* · group_focus_session",
        "높음",
        "검토중",
        "데이터 마이그레이션 정책 별도",
    ],
    [
        "CHG-016",
        "GM07,GM04,GR02",
        "GroupDetail API",
        "goal/progress/accumulated",
        "GET 그룹 상세에 goalSeconds·progress·accumulatedDuration 포함.",
        "해당 필드 제거 또는 nullable deprecated. FE 타입 정리.",
        "CHG-005 연동 API 계약 변경.",
        "구현됨(FE+BE)",
        "삭제",
        "GroupDetailResponse · GroupController",
        "높음",
        "검토중",
        "",
    ],
    [
        "CHG-017",
        "OB01",
        "온보딩",
        "튜토리얼 mock",
        "온보딩 더미 데이터에 groupGoal 등 목표 필드 포함.",
        "mock에서 groupGoal 제거. OB01 분기 로직은 유지.",
        "CHG-005 연동 튜토리얼 정리.",
        "구현됨(FE)",
        "구현됨(FE)",
        "useOnboardingRedirect · onboarding mock",
        "낮음",
        "검토중",
        "",
    ],
    [
        "CHG-018",
        "CHG-008",
        "그룹방",
        "상단 재배치",
        "3칸 그리드(타이머·목표·집중체크).",
        "2칸 이하로 축소·라운지형 배치.",
        "CHG-008 구현 메모.",
        "",
        "구현 예정(FE)",
        "groupPage.tsx",
        "중간",
        "참고(정책제외)",
        "정책이 아닌 구현 태스크",
    ],
    [
        "CHG-019",
        "GT01,GT02",
        "FE alertModal",
        "groupTimerLimit",
        "2명 미만 시 groupTimerLimit 모달 타입·문구(GT01~02).",
        "타입·호출·문구 전부 제거.",
        "CHG-004 FE 잔여 코드 삭제.",
        "구현됨(FE)",
        "삭제",
        "alertModal.tsx · groupTimer.tsx",
        "중간",
        "검토중",
        "",
    ],
    [
        "CHG-020",
        "RP19,GT01",
        "데이터파이프라인",
        "공통타이머 지표",
        "분석 스키마에 group_focus_session 지표 존재 가능.",
        "지표 deprecated·집계 쿼리에서 제외.",
        "리포트·대시보드 혼선 방지.",
        "구현됨(BE)",
        "삭제",
        "mogakjak_data_pipeline · RP19",
        "낮음",
        "검토중",
        "",
    ],
]


def build():
    out = []
    for item in ROWS:
        r = list(item)
        if r and r[0].startswith("CHG"):
            r = [""] + r
        while len(r) < 14:
            r.append("")
        out.append(r[:14])
    return out


def write_csv(path, rows):
    with path.open("w", encoding="utf-8-sig", newline="") as f:
        csv.writer(f).writerows(rows)


if __name__ == "__main__":
    rows = build()
    slim_hdr = [
        "변경ID", "관련정책ID", "대분류", "중분류",
        "AS-IS(현재)", "TO-BE(변경안)", "변경 이유",
        "구현 여부(현재)", "구현 여부(목표)", "출처/위치",
        "우선순위", "상태", "비고",
    ]
    slim = [slim_hdr]
    for r in rows:
        if len(r) >= 14 and (r[1] or "").startswith("CHG"):
            slim.append(r[1:14])
    write_csv(OUT_CSV, slim)
    write_csv(OUT_PASTE, rows)
    print("paste rows", len(rows), "data", len(slim) - 1)
