# -*- coding: utf-8 -*-
"""정책 변경안 2.0 — 사용자 시트 내용 보강 (에픽 묶음 + 대체 UI)"""
import csv
from pathlib import Path

OUT = Path(r"c:\00_mogakjak\mogakjak_data_pipeline\docs\sheets")
OUT_PASTE = OUT / "모각작_정책변경안_2.0_붙여넣기.csv"
OUT_SLIM = OUT / "모각작_정책변경안_2.0.csv"
OUT_MAIN = OUT / "모각작_정책변경안_AS-IS_TO-BE.csv"
OUT_MAIN_PASTE = OUT / "모각작_정책변경안_AS-IS_TO-BE_붙여넣기.csv"

# 컬럼: (빈) 변경ID 유형 관련정책ID 대분류 중분류 소분류 AS-IS TO-BE 설명 출처 우선순위 상태 비고 담당자
HDR = ["", "변경ID", "유형", "관련정책ID", "대분류", "중분류", "소분류",
       "AS-IS(현재)", "TO-BE(변경안)", "설명", "출처/위치", "우선순위", "상태", "비고", "담당자"]


def R(cid, kind, pids, major, mid, minor, asis, tobe, desc, src, pri, status, note="", owner=""):
    return ["", cid, kind, pids, major, mid, minor, asis, tobe, desc, src, pri, status, note, owner]


def SEC(title):
    return ["", title, "", "", "", "", "", "", "", "", "", "", "", "", ""]


def blank():
    return [""] * 15


ROWS = [
    ["", "🍅 모각작 서비스 정책 수정 2.0 ver", "", "", "", "", "", "", "", "", "", "", "", "", ""],
    ["", "- 8인 멤버 활동까지의 범위를 1.xx ver\n- 2026.07 기준 = 2.00 ver", "", "", "", "", "", "", "", "", "", "", "", "", ""],
    blank(),
    ["", "■ 읽는 법", "", "", "",
     "유형=변경이 본문. 그 아래 영향·유지/영향·수정/대체(신규)가 이어짐.",
     "", "영향·유지=로직 유지(체크만) · 영향·수정=코드 수정 · 대체(신규)=제거 자리에 넣는 UI",
     "", "", "", "", "", "", ""],
    blank(),
    HDR,
    blank(),

    # ── 멤버카드 ──
    SEC("📝 그룹방_멤버카드 — 시간 수정"),
    R("CHG-001", "변경", "MC06,SD04",
      "그룹방, 공식라운지", "그룹방_멤버카드", "하단-시간표시",
      "personalTimerSeconds(세션 경과) 표시. 타이머 실행 중에만 증가하는 '이번 세션' 시간.",
      "todo.actualTimeInSeconds(작업 누적) 표시. 사이드바(SD04)·할일 카드와 동일 소스.",
      "타이머 변경/수정과 무관하게, (작업별) 내 몰입 시간을 최우선으로 제공하는 것이 서비스 목표·가치에 더 적합.",
      "groupMemberState · useLiveTimer · MemberStatusDto · groupMySidebar",
      "높음", "검토중", "완료 시 gid=0 MC06 문구·출처 갱신"),
    R("CHG-001-01", "영향·수정", "MC07",
      "그룹방, 공식라운지", "그룹방_멤버카드", "시간-비공개",
      "isTimerPublic=false → personalTimerSeconds null → '참여중/휴식중' 텍스트만",
      "비공개 시에도 표시 기준을 actualTime으로 맞출지, 또는 비공개면 시간 숨김 유지할지 확정 필요",
      "시간 소스 변경(CHG-001)과 공개 토글 정책의 정합",
      "updatePersonalTimerVisibility · MemberStatusDto",
      "중간", "검토중", "⚠ 정책 확정 후 코드"),
    R("CHG-002", "변경", "MC05,ST02,ST03",
      "그룹방, 공식라운지", "그룹방_멤버카드", "상태-rest/finish",
      "개인 타이머 finish 후 RESTING 유지 → 카드에 '쉬어갈래요'(rest). end(최근참여)와 구분 모호.",
      "finish 직후 표시 규칙 재정의: end(최근 참여) / rest(세션만 참여) / 누적시간 표시 조건 분리",
      "타이머 종료 후에도 참여 중처럼 보이는 UX 해소. CHG-001(누적시간)과 함께 보면 상태·시간 정보가 깔끔해짐.",
      "syncGroupParticipation · groupMemberState · GroupParticipationStatus",
      "중간", "검토중", ""),
    R("CHG-003", "변경", "MC09,LN14",
      "그룹방, 공식라운지", "그룹방_멤버카드", "최근참여 표시",
      "end 상태에서 enteredAt 기준 'N일 전' (필드명·의미 불일치)",
      "lastActiveAt 또는 마지막 타이머 종료 기준 'N분/일 전'. 라운지(LN14) lastActiveAt과 정렬",
      "최근 참여 라벨과 실제 집계 필드 정합",
      "daysSinceLastParticipation · MemberStatusDto",
      "낮음", "검토중", ""),
    blank(),

    # ── 그룹타이머 → 명언 ──
    SEC("⏰ 그룹방_그룹타이머 — 제거 → 오늘의 한마디(명언)으로 대체"),
    R("CHG-004", "변경", "GT01~GT08,GX01,GS02,CH01",
      "그룹방, 그룹타이머", "그룹 타이머", "전체",
      "group_focus_session UI·API·WS·모달 운영 (2명 제한·누구나 제어·퇴장 분기)",
      "공통 타이머 전부 제거. 개인 타이머(TM01~02)만 유지.",
      "UX 단순화. 상단 타이머 자리는 '오늘의 한마디'로 대체(CHG-004-A).",
      "groupTimer · GroupFocusSession* · alertModal groupTimerLimit",
      "높음", "기획검토", "아래 영향·대체 행을 순서대로 검토"),
    R("CHG-004-A", "대체(신규)", "SH01,LN07",
      "그룹방", "그룹방_상단", "오늘의 한마디",
      "상단 왼쪽(또는 타이머 칸)에 그룹 공통 타이머",
      "오늘의 한마디(랜덤 Quote). 홈 사이드바(SH01)·라운지 상단(LN07)과 동일 API.",
      "공통 타이머 제거 자리 대체. 라운지와 상단 구성 정렬.",
      "QuoteService/getRandomQuote · loungePage · previewMain Quotes",
      "높음", "기획검토", "요청/새로고침마다 랜덤(SH01) 정책 준수"),
    R("CHG-004-01", "영향·유지", "ST02,SD02,SD04,SD05,TM01,TM02",
      "그룹방", "개인타이머·사이드바", "유지",
      "그룹방 개인 타이머·사이드바 작업 선택·누적·강제종료 그대로",
      "변경 없음",
      "공통 타이머만 제거. 개인 타이머 축은 핵심 기능 유지.",
      "timerComponent · groupMySidebar · FocusSessionServiceImpl",
      "높음", "검토중", "✓ 체크만"),
    R("CHG-004-02", "영향·유지", "RP05,RP19",
      "집중 리포트", "집중리포트", "모각작 몰입 시간",
      "그룹 참여 세션(개인 타이머) 시간 합. group_focus_session 미포함.",
      "그룹 참여 세션 시간 합 유지 (집계 로직 변경 없음)",
      "모각작 몰입 시간 ≠ 공통 타이머. CHG-004와 혼동 방지.",
      "RecordDashboardService · RP19 · RP05",
      "중간", "검토중", "✓ 체크만"),
    R("CHG-004-03", "영향·수정", "GX01,GT08,GS02",
      "그룹방", "그룹방_나가기", "퇴장·타이머 분기",
      "마지막 참여자 퇴장 시 그룹타이머 finish(GT08). 타이머 중 이탈 시 GX01 모달에서 finish 호출.",
      "공통 타이머 finish 분기 제거. 개인 타이머 forceStop + 세션 퇴장(GS02)만.",
      "이탈 플로우 단순화",
      "groupPage · useBlockGroupTimerNavigation · leaveGroupSession",
      "높음", "검토중", "⚠ 코드 수정"),
    R("CHG-004-04", "영향·유지", "GH01",
      "홈, 그룹방", "홈·그룹방 UI", "몰입 배지",
      "PARTICIPATING≥1 → '몰입 중' 배지 (개인 타이머 기준)",
      "변경 없음",
      "공통 타이머와 무관",
      "groupRoom · StateButton",
      "낮음", "검토중", "✓ 체크만"),
    R("CHG-004-05", "영향·유지", "MC05,CH02,PK03",
      "그룹방", "멤버카드·소통", "개인타이머 연동",
      "멤버카드 상태·응원·콕 = 개인 타이머/세션 기준",
      "변경 없음",
      "공통 타이머와 독립",
      "groupFriendField · forkPopup · MC05",
      "낮음", "검토중", "✓ 체크만"),
    R("CHG-004-06", "영향·수정", "GT01~GT08",
      "BE·DB·WS", "group_focus_session", "레거시",
      "테이블·API·WS 토픽·스케줄러 존재",
      "미사용 처리 또는 제거. 기존 데이터 보존 여부 결정 필요",
      "레거시 정리",
      "GroupFocusSession* · group_focus_session",
      "높음", "검토중", "⚠ 코드 수정 · 마이그레이션 별도"),
    R("CHG-004-07", "영향·수정", "GT01,GT02",
      "FE", "alertModal", "groupTimerLimit",
      "2명 미만 시 groupTimerLimit 모달",
      "타입·호출·문구 전부 제거",
      "CHG-004 FE 잔여 코드",
      "alertModal.tsx · groupTimer.tsx",
      "중간", "검토중", "⚠ 코드 수정"),
    R("CHG-004-08", "영향·수정", "RP19",
      "데이터파이프라인", "지표", "공통타이머",
      "분석 스키마에 group_focus_session 지표 가능",
      "지표 deprecated · 집계 쿼리에서 제외",
      "리포트·대시보드 혼선 방지",
      "mogakjak_data_pipeline",
      "낮음", "검토중", "⚠ 코드 수정"),
    R("CHG-004-09", "영향·유지", "CH01",
      "그룹방", "응원하기", "리셋 조건",
      "전원 NOT_PARTICIPATING 시 cheerCount=0",
      "응원 리셋 로직 유지 (공통 타이머와 무관)",
      "CHG-004 제거 대상이 아님",
      "resetAllCheerCounts · leaveGroupSession",
      "중간", "검토중", "✓ 체크만"),
    blank(),

    # ── 목표 → 참여 현황 ──
    SEC("🏆 그룹방_목표·달성률 제거 → 라운지형 참여 현황"),
    R("CHG-005", "변경", "GM04,GM07,GR02",
      "그룹방", "그룹방_관리", "그룹 목표·달성률",
      "방장 UI 목표 설정 + accumulatedDuration/goalSeconds 달성률. 생성 기본 목표=0(GR02).",
      "목표·달성률 UI·API 제거.",
      "공통 타이머 제거와 함께 accumulated 의존 소멸. 자리는 참여 현황으로 대체(CHG-005-A).",
      "groupGoal · setGroupGoal · GroupDetailResponse · Group.java goalSeconds",
      "높음", "기획검토", ""),
    R("CHG-005-A", "대체(신규)", "LN07,GP01,GH02,GS01",
      "그룹방", "그룹방_상단", "참여 현황",
      "상단에 그룹 목표·달성률 표시",
      "{현재 세션 참여 유저 수}/{메이트(전체 멤버) 수}\n· 세션 참여 = NOT_PARTICIPATING 제외 (타이머 실행 여부 무관)\n· 라운지(LN07) 'N명' 현황을 참고하되, 일반 그룹은 분모가 메이트 수",
      "라운지 정책 참고 + 메이트가 있으므로 분수 형식. 홈 카드(GH02)는 타이머 실행 기준이라 방안 카운트(GP01)와 정의가 다름 — 방안 상단은 GP01(세션) 기준으로 통일.",
      "groupPage participatingMemberCount · loungePage 현황 · GP01",
      "높음", "기획검토", "AS-IS GP01=(세션)/(전체)와 정합. GH02(홈)=타이머 기준은 유지 가능"),
    R("CHG-005-01", "영향·수정", "GM07,GM04,GR02",
      "BE·FE", "GroupDetail API", "goal/progress/accumulated",
      "GET 그룹 상세에 goalSeconds·progress·accumulatedDuration 포함",
      "필드 제거 또는 nullable deprecated. FE 타입 정리",
      "CHG-005 API 계약 변경",
      "GroupDetailResponse · GroupController",
      "높음", "검토중", "⚠ 코드 수정"),
    R("CHG-005-02", "영향·수정", "OB01",
      "온보딩", "온보딩", "mock",
      "튜토리얼 더미에 groupGoal 포함",
      "mock에서 groupGoal 제거. OB01 분기 로직은 유지",
      "튜토리얼 정리",
      "onboarding mock · useOnboardingRedirect",
      "낮음", "검토중", "⚠ 코드 수정"),
    R("CHG-005-03", "영향·수정", "CH01,GS02",
      "그룹방", "응원·누적", "accumulated 연동",
      "leaveGroupSession 시 cheer 리셋 + accumulated 갱신 가능",
      "cheer 리셋(CH01) 유지. accumulated·목표 연동 코드 삭제",
      "CHG-004·005 공통 dead code",
      "resetAllCheerCounts · GroupDetail accumulated",
      "중간", "검토중", "⚠ 코드 수정"),
    blank(),

    # ── 집중체크 ──
    SEC("📋 집중체크 통일"),
    R("CHG-006", "변경", "GM02,LN08",
      "그룹방", "그룹방_관리", "집중체크 알림",
      "방장(HOST)만 on/off·1시간 단위(1~23h) 주기 설정. 기본 ON·1시간.",
      "방장이 on/off·1시간 단위 주기 설정은 유지. (라운지처럼 매시 정각으로 바꾸지 않음)",
      "라운지(LN08) 개인 opt-in·presence는 수신 쪽(CHG-007)에서 참고. 발송 주기·방장 설정 권한은 기존 그룹방 정책 유지.",
      "groupNoti · modifyFocusNotification · FocusNotificationScheduler",
      "높음", "기획검토", "FE 주기 UI 1~99 vs BE Max 23 불일치 별도 확인"),
    R("CHG-007", "변경", "GM03,LN09",
      "그룹방", "그룹방_관리", "집중체크 수신자",
      "방장이 on일 때 ActiveFocusSession(개인 타이머 실행) 중인 유저만 수신",
      "세션 입장(≠NOT_PARTICIPATING) + 유저별 opt-in on인 경우 수신. (LN09와 동일 방향)",
      "타이머 미실행이어도 방에만 있으면 알림 가능. 개인이 끌 수 있어야 함.",
      "FocusNotificationService · User.isOfficialLoungeFocusCheckEnabled 패턴 참고",
      "높음", "기획검토", "그룹방용 개인 opt-in 필드/UI 신규 필요할 수 있음"),
    R("CHG-007-01", "영향·수정", "GM03,LN09",
      "그룹방, BE", "집중체크", "opt-in 저장",
      "그룹방 집중체크는 방장 설정만 있고 멤버 개인 on/off 없음",
      "멤버별 opt-in 저장(User 또는 UserGroup 필드) + 그룹방 UI 토글",
      "CHG-007 전제. 라운지 isOfficialLoungeFocusCheckEnabled와 분리 여부 결정",
      "User · UserGroup · groupNoti / 사이드바",
      "높음", "검토중", "⚠ 스키마·API 설계 필요"),
    blank(),

    # ── 상단 재배치 ──
    SEC("🔧 그룹방 상단 재배치 (정책 범위 외 · 구현 메모)"),
    R("CHG-008", "참고(구현)", "LN07,CHG-004-A,CHG-005-A,GM02",
      "그룹방", "그룹방_상단", "3칸→재구성",
      "상단 3칸: 그룹 타이머 + 그룹 목표 + 집중체크(방장)",
      "오늘의 한마디(CHG-004-A) + 참여 현황(CHG-005-A) + 집중체크(방장설정·개인 opt-in). 라운지(LN07) 참고.",
      "레이아웃은 정책 시트 상세 미기록. CHG-004/005/006·007 완료 후 FE 배치.",
      "groupPage.tsx · loungePage.tsx",
      "중간", "참고", "정책제외 · 구현 체크리스트"),
]

def main():
    with OUT_PASTE.open("w", encoding="utf-8-sig", newline="") as f:
        csv.writer(f).writerows(ROWS)
    with OUT_MAIN_PASTE.open("w", encoding="utf-8-sig", newline="") as f:
        csv.writer(f).writerows(ROWS)

    slim_hdr = HDR[1:]
    slim = [slim_hdr]
    for r in ROWS:
        if len(r) >= 15 and (r[1] or "").startswith("CHG"):
            slim.append(r[1:15])
    with OUT_SLIM.open("w", encoding="utf-8-sig", newline="") as f:
        csv.writer(f).writerows(slim)
    with OUT_MAIN.open("w", encoding="utf-8-sig", newline="") as f:
        csv.writer(f).writerows(slim)
    print("2.0 rows:", len(slim) - 1)


if __name__ == "__main__":
    main()
