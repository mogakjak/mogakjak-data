# -*- coding: utf-8 -*-
"""의미 있는 정책 ID 부여 + gid=0 / 변경안 CSV 생성"""
import csv
from pathlib import Path

OUT = Path(r"c:\00_mogakjak\mogakjak_data_pipeline\docs\sheets")

# 컬럼: 정책ID, 정의/참조, 대분류, 중분류, 내용, 구현여부, 출처/위치, 노출위치, 비고
# 정의/참조: 정의=이 행이 정식 정의, 참조=다른 섹션에서 같은 ID 재등장(내용은 요약 가능)

def R(pid, kind, major, minor, content, impl, src="", places="", note=""):
    return [pid, kind, major, minor, content, impl, src, places, note]

HDR = ["정책ID", "정의/참조", "대분류", "중분류", "내용", "구현 여부", "출처/위치", "노출위치", "비고"]
SEC = lambda title: ["", "", title, "", "", "", "", "", ""]

rows = []
rows.append(SEC("📜 이용대상·약관·계정"))
rows += [
    R("AUTH-01", "정의", "이용대상", "가입/진입", "소셜 로그인(Kakao/Google) 후 회원가입 완료자가 이용", "구현됨(FE+BE)", "OAuth/User · auth/callback", "전역", ""),
    R("AUTH-02", "정의", "가입 약관", "필수 동의", "서비스 이용약관 + 개인정보 처리방침 모두 동의 필수", "구현됨(FE+BE)", "User.termsAgreed/privacyAgreed · AgreementGateFilter", "전역", ""),
    R("AUTH-03", "정의", "가입 약관", "선택 동의", "마케팅 정보 수신 동의", "구현됨(FE+BE)", "User.marketingAgreed", "전역", ""),
    R("AUTH-04", "정의", "서비스 해지", "자진 탈퇴", "회원 soft delete(isDeleted/deletedAt)", "구현됨(FE+BE)", "User 탈퇴 API · FE 탈퇴 UI", "마이페이지", "진행 중 그룹 조건 코드 없음"),
    R("AUTH-05", "정의", "인증", "비로그인 차단", "refresh 토큰 없으면 보호 경로 → /login", "구현됨(FE)", "middleware.ts", "전역(홈·할일·리포트·마이페이지 등)", ""),
]

rows.append(SEC("🫥 상태·용어"))
rows += [
    R("STATUS-01", "정의", "상태 및 용어", "활동 상태(접속)", "사이트 접속(로그인) 중이어야 콕 찌르기 대상. 미접속 시 n분 전 표시", "구현됨(FE)", "forkButton · mate active-status", "홈·마이페이지 메이트", "BE poke는 멤버십만 검사"),
    R("STATUS-02", "정의", "상태 및 용어", "몰입 상태", "개인 타이머 실행 중 = PARTICIPATING", "구현됨(FE+BE)", "GroupParticipationStatus.PARTICIPATING", "그룹방·홈 배지·멤버카드", ""),
    R("STATUS-03", "정의", "상태 및 용어", "휴식(세션 참여)", "그룹방 입장 후 타이머 미실행 = RESTING", "구현됨(FE+BE)", "UserGroup.enterGroup", "그룹방", ""),
    R("STATUS-04", "정의", "상태 및 용어", "미참여", "멤버이나 방 세션 미입장 = NOT_PARTICIPATING", "구현됨(FE+BE)", "UserGroup 기본값 · leaveGroupSession", "그룹방", ""),
]

rows.append(SEC("1. 사이드바·개인타이머"))
rows += [
    R("SIDE-H-01", "정의", "사이드바(홈)", "명언", "요청/새로고침마다 랜덤 명언", "구현됨(FE+BE)", "QuoteService · previewMain Quotes", "홈 Preview", ""),
    R("SIDE-G-01", "정의", "사이드바(그룹방)", "작업 공개여부 초기화", "그룹방 진입 시 공개 여부 UI는 매번 공개로 초기화", "구현됨(FE)", "previewMain useState(true) · FocusSession 기본 true", "그룹방 사이드바", ""),
    R("SIDE-C-01", "정의", "사이드바(공통)", "프로필 캐릭터", "보유 중 최고 레벨 캐릭터 노출", "구현됨(FE+BE)", "getHighestLevelCharacter", "홈·그룹방 사이드바·마이페이지", "CHAR-03과 동일 의미 → 본 ID를 캐릭터 노출 정본으로 사용"),
    R("SIDE-C-02", "정의", "사이드바(공통)", "작업 선택 유지", "선택한 작업은 홈↔그룹방 이동 시 유지(selectedTodoId)", "데이터만(DB)", "localStorage · GroupMySidebar", "홈·그룹방", ""),
    R("SIDE-C-03", "정의", "사이드바(공통)", "작업 달성률", "화면 달성률 최대 100%", "구현됨(FE+BE)", "Math.min(100, progress)", "홈·그룹방 사이드바·할일 카드", ""),
    R("SIDE-C-04", "정의", "사이드바(공통)", "작업 누적 시간", "할일(1일 단위) actualTimeInSeconds 누적 표시", "데이터만(DB)", "todo.actualTime · groupMySidebar", "홈·그룹방 사이드바", "멤버카드 TO-BE(CHG-001)와 동일 소스 목표"),
    R("SIDE-C-05", "정의", "사이드바(공통)", "개인 타이머 강제 종료", "타이머 실행/휴식 중 페이지 이동 시 강제 종료 유도", "구현됨(FE)", "NavigationBlocker · forceStopTimer", "홈·그룹방", "모든 SPA 이동 자동종료는 아님"),
    R("TIMER-01", "정의", "개인타이머", "시작 조건", "선택된 할 일로 개인 타이머 시작 · 삭제된 todo면 TODO_DELETED", "구현됨(FE+BE)", "timerComponent · FocusSessionServiceImpl", "홈·그룹방·라운지", ""),
    R("TIMER-02", "정의", "개인타이머", "누적 반영", "pause/finish/뽀모도로 완료 시 todo.actualTime 가산", "구현됨(BE)", "FocusSessionServiceImpl.addActualTime", "전역", ""),
]

rows.append(SEC("2. 홈 (중복 없는 홈 전용만 · 레이아웃 제외)"))
rows += [
    R("HOME-01", "정의", "홈", "모바일 리다이렉트", "모바일에서 / 접근 시 /landing", "구현됨(FE)", "middleware.ts", "홈", ""),
    R("HOME-02", "정의", "홈", "첫 진입 분석", "세션당 1회 first_entrance", "구현됨(FE)", "EntranceTracker", "홈", ""),
    R("HOME-03", "정의", "홈", "그룹 목록 API", "내 그룹 + 공식 라운지 항상 맨 위", "구현됨(FE+BE)", "GET /groups/my", "홈", "LOUNGE-05 참조"),
    R("HOME-04", "정의", "홈", "라운지 실시간", "홈 라운지 카드 3초 polling + WS presence", "구현됨(FE+BE)", "useOfficialLoungeSummary(3000)", "홈", "LOUNGE 정원/입퇴장과 연동"),
    R("HOME-05", "정의", "홈", "생성 CTA", "새 그룹 생성하기 → RoomModal", "구현됨(FE+BE)", "roomMain · roomModal", "홈", "GROUP-01과 동일 생성 API"),
    R("HOME-06", "정의", "홈", "생성 후 초대 팝업", "생성 직후 InviteModal · 방으로 이동 안 함", "구현됨(FE)", "roomMain.handleGroupCreateSuccess", "홈", "GROUP-02 기본값과 동일"),
    R("HOME-07", "정의", "홈", "GA 체류", "입장 시각 저장 → group_stay_duration", "구현됨(FE)", "sessionStorage group_enter_time", "홈→그룹방", ""),
    # 홈에서 참조만 (동일 ID)
    R("GROUP-H01", "참조", "홈-그룹목록", "몰입/휴식 배지", "PARTICIPATING≥1 → 몰입 중 else 휴식 중", "구현됨(FE)", "StateButton", "홈", "정의: GROUP-H01 (그룹방_홈UI)"),
    R("GROUP-H02", "참조", "홈-그룹목록", "인원 표시", "(PARTICIPATING)/(전체 멤버)", "구현됨(FE)", "groupRoom", "홈", "정의: GROUP-H02"),
    R("GROUP-H03", "참조", "홈-그룹목록", "프로필 5+n", "최대 5아이콘 · 초과 +n · hover", "구현됨(FE)", "members.tsx", "홈", "정의: GROUP-H03"),
    R("GROUP-S01", "참조", "홈-그룹목록", "일반 그룹 입장", "참여하기 → /group/{id}", "구현됨(FE+BE)", "groupRoom · getGroupDetail", "홈", "정의: GROUP-S01"),
    R("LOUNGE-03", "참조", "홈-그룹목록", "라운지 입장", "POST /lounge/enter → /lounge?entered=1 · 정원 초과 모달", "구현됨(FE+BE)", "useEnterOfficialLounge", "홈", "정의: LOUNGE-03"),
    R("GROUP-L01", "참조", "홈-그룹목록", "그룹 탈퇴(케밥)", "일반 그룹만 케밥 → DELETE members/me", "구현됨(FE+BE)", "LeavePopup · leaveGroup", "홈", "정의: GROUP-L01~L03"),
    R("GROUP-M01", "참조", "홈-그룹목록", "방장 뱃지", "본인 HOST면 왕관", "구현됨(FE)", "groupRoom", "홈", "정의: GROUP-M01"),
    R("MATE-01", "참조", "홈-메이트", "목록", "함께한 메이트 · pageSize 6", "구현됨(FE+BE)", "GET /groups/mates", "홈", "정의: MATE-01"),
    R("LOUNGE-12", "참조", "홈-메이트", "그룹 필터(라운지 제외)", "드롭다운에서 공식 라운지 제외", "구현됨(FE)", "friendMain", "홈", "정의: LOUNGE-12"),
    R("MATE-02", "참조", "홈-메이트", "검색", "닉네임 LIKE 검색", "구현됨(FE+BE)", "searchBar", "홈", "정의: MATE-02"),
    R("POKE-01", "참조", "홈-메이트", "콕 찌르기", "isActive일 때만 · 공통 그룹 선택", "구현됨(FE)", "forkButton", "홈", "정의: POKE-01"),
    R("SIDE-H-01", "참조", "홈-Preview", "명언", "홈에서만 명언 박스", "구현됨(FE+BE)", "Quotes", "홈", "정의: SIDE-H-01"),
    R("SIDE-C-02", "참조", "홈-Preview", "할일 유지", "selectedTodoId 유지", "데이터만(DB)", "GroupMySidebar", "홈", "정의: SIDE-C-02"),
    R("SIDE-C-05", "참조", "홈-Preview", "타이머 이탈 차단", "타이머 중 페이지 이탈 시 종료 유도", "구현됨(FE)", "useBlockPageNavigation", "홈", "정의: SIDE-C-05"),
    R("INVITE-02", "참조", "홈-초대모달", "내부 초대", "메이트 검색·초대", "구현됨(FE+BE)", "inviteModal", "홈", "정의: INVITE-02"),
    R("INVITE-01", "참조", "홈-초대모달", "링크 복사", "/invite/{groupId} (라운지는 LOUNGE-10)", "구현됨(FE)", "inviteModal", "홈", "정의: INVITE-01"),
    R("ONBOARD-01", "참조", "홈-온보딩", "첫 방문 분기", "첫 방문 → onboarding / 약관 등", "구현됨(FE)", "useOnboardingRedirect", "홈", "정의: ONBOARD-01"),
    R("AUTH-05", "참조", "홈-접근", "비로그인 차단", "refresh 없으면 /login", "구현됨(FE)", "middleware", "홈", "정의: AUTH-05"),
]

rows.append(SEC("3. 공식라운지"))
rows += [
    R("LOUNGE-01", "정의", "공식라운지", "정체", "시스템 운영 단일 공간 · UserGroup 멤버십 없음(Redis presence)", "구현됨(BE)", "OfficialLoungeBootstrap", "홈·라운지", ""),
    R("LOUNGE-02", "정의", "공식라운지", "정원", "최대 20명 · 초과 시 입장 거부 모달", "구현됨(FE+BE)", "MAX=20 · officialLoungeFull", "홈·라운지", ""),
    R("LOUNGE-03", "정의", "공식라운지", "입장", "POST /lounge/enter → /lounge?entered=1", "구현됨(FE+BE)", "OfficialLoungeService", "홈", ""),
    R("LOUNGE-04", "정의", "공식라운지", "퇴장", "leave API + pagehide 자동 퇴실", "구현됨(FE+BE)", "lounge leave · pagehide", "라운지", ""),
    R("LOUNGE-05", "정의", "공식라운지", "홈 UI", "탈퇴·방장 뱃지 없음 · 전용 입장", "구현됨(FE)", "groupRoom official branch", "홈", ""),
    R("LOUNGE-06", "정의", "공식라운지", "참여상태 동기화", "개인타이머↔UserGroup participationStatus 동기화 안 함", "구현됨(BE)", "FocusSessionServiceImpl early return", "라운지", ""),
    R("LOUNGE-07", "정의", "공식라운지", "상단 기능", "오늘의 한마디 + 라운지 현황 + 집중체크 개인 토글", "구현됨(FE)", "loungePage", "라운지", "레이아웃 배치 자체는 정책 제외·기능만"),
    R("LOUNGE-08", "정의", "공식라운지", "집중체크", "매 시 정각 · 개인 opt-in(User.isOfficialLoungeFocusCheckEnabled)", "구현됨(FE+BE)", "OfficialLoungeFocusNotification", "라운지", "CHG-006 통일 목표"),
    R("LOUNGE-09", "정의", "공식라운지", "집중체크 수신", "presence 입실 + opt-in (타이머 불필요)", "구현됨(BE)", "OfficialLoungeFocusNotificationService", "라운지", ""),
    R("LOUNGE-10", "정의", "공식라운지", "초대 링크", "고정 /lounge?entered=1", "구현됨(FE)", "inviteModal OFFICIAL_LOUNGE", "라운지·홈", ""),
    R("LOUNGE-11", "정의", "공식라운지", "초대 권한", "라운지 입실 중만 초대·수락 시 enter()", "구현됨(BE)", "OfficialLounge invite", "라운지", ""),
    R("LOUNGE-12", "정의", "공식라운지", "메이트 필터 제외", "홈 메이트 드롭다운에서 라운지 제외", "구현됨(FE)", "friendMain", "홈", "마이페이지는 제외 로직 없음(MYPAGE-M06)"),
    R("LOUNGE-13", "정의", "공식라운지", "응원", "POST /lounge/cheer · Redis · 전원 퇴실 시 0", "구현됨(FE+BE)", "lounge cheer", "라운지", ""),
    R("LOUNGE-14", "정의", "공식라운지", "멤버카드 상태", "isHost false · presence+ActiveFocusSession 직접 계산", "구현됨(FE+BE)", "lounge member card", "라운지", ""),
    R("LOUNGE-15", "정의", "공식라운지", "멤버카드 lastActiveAt", "ISO lastActiveAt 직접 사용", "구현됨(FE+BE)", "lounge", "라운지", "일반 그룹(MCARD-09)과 다름"),
    R("LOUNGE-16", "정의", "공식라운지", "입장 거절 로그", "정원 초과 등 official_lounge_access_log", "구현됨(BE)", "access log", "라운지", ""),
]

rows.append(SEC("4. 그룹방"))
rows += [
    R("GROUP-01", "정의", "그룹방_생성", "생성 필드", "name + imageUrl로 생성", "구현됨(FE+BE)", "CreateGroupRequest · roomModal", "홈", ""),
    R("GROUP-02", "정의", "그룹방_생성", "기본값", "생성 직후 초대팝업(메이트+링크)·방 미이동. 목표0·집중알림 ON·1시간 자동", "구현됨(FE+BE)", "roomMain · Group.java default", "홈", ""),
    R("GROUP-03", "정의", "그룹방_생성", "방장 부여", "생성자=HOST (hostAckState=1)", "구현됨(BE)", "UserGroup.create HOST", "그룹방", ""),
    R("GROUP-J01", "정의", "그룹방_가입", "링크 가입", "/invite/{groupId}로 즉시 MEMBER 가입", "구현됨(FE+BE)", "joinGroupViaLink", "초대", "INVITE-01과 연동"),
    R("GROUP-J02", "정의", "그룹방_가입", "내부 초대", "PENDING→수락 시 MEMBER · 거절 가능", "구현됨(FE+BE)", "inviteMate/accept/decline", "홈·그룹방", "INVITE-02와 동일"),
    R("GROUP-J03", "정의", "그룹방_가입", "정원 강제", "maxMemberCount=8은 표시만 · join 강제 없음", "데이터만(DB)", "Group.maxMemberCount", "그룹방", ""),
    R("GROUP-J04", "정의", "그룹방_가입", "초대 권한", "멤버면 누구나 초대/링크 가능", "구현됨(BE)", "ensureCanInvite", "그룹방", ""),
    R("GROUP-S01", "정의", "그룹방_세션", "입장", "GET 상세 시 NOT→RESTING+enteredAt", "구현됨(BE)", "getGroupDetail.enterGroup", "그룹방", ""),
    R("GROUP-S02", "정의", "그룹방_세션", "세션 퇴장", "멤버십 유지 · NOT_PARTICIPATING (DELETE session/me)", "구현됨(FE+BE)", "leaveGroupSession", "그룹방", ""),
    R("GROUP-S03", "정의", "그룹방_세션", "탭 종료", "pagehide keepalive로 session/me", "구현됨(FE)", "useGroupSessionExitGuard", "그룹방", ""),
    R("GROUP-L01", "정의", "그룹방_탈퇴", "일반 멤버", "UserGroup 삭제", "구현됨(FE+BE)", "leaveGroup", "홈", ""),
    R("GROUP-L02", "정의", "그룹방_탈퇴", "방장+다른멤버", "최장가입 멤버에 HOST 이양(hostAckState=0) 후 탈퇴", "구현됨(FE+BE)", "designateAsNewHost", "홈", ""),
    R("GROUP-L03", "정의", "그룹방_탈퇴", "방장 단독", "마지막 멤버 탈퇴 시 그룹 삭제", "구현됨(FE+BE)", "leaveGroup", "홈", ""),
    R("GROUP-L04", "정의", "그룹방_방장 이양", "확인", "새 방장 host-ack 모달", "구현됨(FE+BE)", "host-ack GET/PUT", "그룹방", ""),
    R("GROUP-M01", "정의", "그룹방_관리", "이름/이미지", "HOST만 수정", "구현됨(FE+BE)", "updateGroup", "그룹방", ""),
    R("GROUP-M02", "정의", "그룹방_관리", "집중체크 알림", "HOST만 · 기본 ON·1h · 주기 API 1~23", "구현됨(FE+BE)", "modifyFocusNotification", "그룹방", "CHG-006"),
    R("GROUP-M03", "정의", "그룹방_관리", "집중체크 수신자", "개인 타이머 ActiveFocusSession 있는 유저만", "구현됨(BE)", "FocusNotificationService", "그룹방", "CHG-007"),
    R("GROUP-M04", "정의", "그룹방_관리", "그룹 목표", "UI HOST만 · BE는 멤버도 setGroupGoal 가능", "구현됨(FE)", "groupGoal · setGroupGoal", "그룹방", "CHG-005"),
    R("GROUP-M05", "정의", "그룹방_관리", "그룹 삭제", "HOST만 API · FE UI 없음", "구현됨(BE)", "deleteGroupByHost", "그룹방", ""),
    R("GROUP-M06", "정의", "그룹방_관리", "강퇴", "HOST만 API · FE UI 없음", "구현됨(BE)", "ejectMemberFromGroup", "그룹방", "삭제 예정 표기 가능"),
    R("GROUP-H01", "정의", "그룹방_홈UI", "몰입/휴식 배지", "PARTICIPATING≥1 → 몰입 중 else 휴식 중", "구현됨(FE)", "StateButton", "홈", ""),
    R("GROUP-H02", "정의", "그룹방_홈UI", "인원 표시", "(PARTICIPATING)/(전체)", "구현됨(FE)", "groupRoom", "홈", ""),
    R("GROUP-H03", "정의", "그룹방_홈UI", "프로필 5+n", "최대 5 · +n · hover", "구현됨(FE)", "members.tsx", "홈", ""),
    R("GROUP-R01", "정의", "그룹방_방안UI", "인원 카운트", "(NOT 제외)/(전체)", "구현됨(FE)", "groupPage", "그룹방", ""),
    R("GROUP-P01", "정의", "그룹방_공개설정", "할일/시간 공개", "isTaskPublic/isTimerPublic · 비공개면 WS null", "구현됨(FE+BE)", "groupMySidebar · MemberStatusService", "그룹방", "SIDE-G-01과 초기화 연관"),
    R("GROUP-G01", "정의", "그룹방_목표표시", "달성률", "accumulatedDuration/goalSeconds*100 (goal0→0%)", "구현됨(FE+BE)", "GroupDetailResponse · groupGoal", "그룹방", "CHG-005"),
    R("GROUP-X01", "정의", "그룹방_나가기경고", "타이머 중 이탈", "개인/그룹 타이머 중 TimerEndModal → forceStop/finish·리뷰·session exit", "구현됨(FE)", "groupPage · TimerEndModal", "그룹방", "CHG-004/011"),
]

rows.append(SEC("4-1. 그룹방 멤버카드"))
rows += [
    R("MCARD-01", "정의", "멤버카드", "상단-프로필", "프로필·닉네임·(나)", "구현됨(FE)", "groupFriendField", "그룹방", ""),
    R("MCARD-02", "정의", "멤버카드", "상단-방장", "HOST면 왕관", "구현됨(FE)", "groupFriendField", "그룹방", ""),
    R("MCARD-03", "정의", "멤버카드", "상단-응원", "타인+세션참여 중일 때만 응원 버튼", "구현됨(FE)", "canShowCheer", "그룹방", "CHEER-02 참조"),
    R("MCARD-04", "정의", "멤버카드", "상단-캐릭터", "active/rest=일반 · end=잠자는", "구현됨(FE)", "sleeping SVG", "그룹방", ""),
    R("MCARD-05", "정의", "멤버카드", "하단-상태문구", "하는중/쉬어갈래요/참여안함 + 할일명", "구현됨(FE+BE)", "groupMemberState", "그룹방", "STATUS-02~04"),
    R("MCARD-06", "정의", "멤버카드", "하단-시간표시(AS-IS)", "현재 개인 타이머 세션 경과(personalTimerSeconds)", "구현됨(FE+BE)", "useLiveTimer", "그룹방", "CHG-001 → SIDE-C-04로 통일 예정"),
    R("MCARD-07", "정의", "멤버카드", "시간-비공개", "isTimerPublic false → 시간 숨김", "구현됨(FE+BE)", "MemberStatusService", "그룹방", "GROUP-P01"),
    R("MCARD-08", "정의", "멤버카드", "할일-비공개", "isTaskPublic false → '뭔가 하는 중'", "구현됨(FE+BE)", "MemberStatusService", "그룹방", "GROUP-P01"),
    R("MCARD-09", "정의", "멤버카드", "최근참여 표시", "end 시 N분/일 전 (enteredAt 일수 기준·이름 불일치)", "구현됨(BE)", "daysSinceLastParticipation", "그룹방", "CHG-003"),
    R("MCARD-10", "정의", "멤버카드", "동기화", "WS member-status + 10초 브로드캐스트", "구현됨(FE+BE)", "GroupMemberStatusScheduler", "그룹방", ""),
]

rows.append(SEC("5. 그룹타이머"))
rows += [
    R("GTIMER-01", "정의", "그룹 타이머", "시작 인원", "세션 참여자 2명 미만이면 시작 불가(FE 모달)", "구현됨(FE)", "groupTimer · groupTimerLimit", "그룹방", "CHG-004"),
    R("GTIMER-02", "정의", "그룹 타이머", "모달 문구", "공통 타이머는 2명부터… / 개인타이머 유도", "구현됨(FE)", "alertModal groupTimerLimit", "그룹방", "CHG-004"),
    R("GTIMER-03", "정의", "그룹 타이머", "제어 권한", "멤버 누구나 start/pause/resume/finish", "구현됨(FE+BE)", "GroupFocusSessionServiceImpl", "그룹방", "CHG-004"),
    R("GTIMER-04", "정의", "그룹 타이머", "활성 세션", "그룹당 활성 1개", "구현됨(BE)", "ensureNoActiveSession", "그룹방", "CHG-004"),
    R("GTIMER-05", "정의", "그룹 타이머", "목표시간", "FE targetSeconds=3600 고정", "구현됨(FE)", "groupTimer start", "그룹방", "CHG-004"),
    R("GTIMER-06", "정의", "그룹 타이머", "자동 종료", "running 중 참여자≤1이면 FE finish (paused 미적용)", "구현됨(FE)", "groupTimer useEffect", "그룹방", "CHG-004"),
    R("GTIMER-07", "정의", "그룹 타이머", "퇴장 시 유지", "다른 참여자 있으면 유지·본인만 세션 종료", "구현됨(FE+BE)", "leaveGroupSession", "그룹방", "CHG-004"),
    R("GTIMER-08", "정의", "그룹 타이머", "마지막 유저 퇴장", "경고 후 그룹타이머 finish", "구현됨(FE)", "participatingMemberCount<=1", "그룹방", "CHG-004/011"),
]

rows.append(SEC("6. 소통·초대·온보딩"))
rows += [
    R("POKE-01", "정의", "콕 찌르기", "버튼 활성화", "상대 isActive일 때만 FE 활성", "구현됨(FE)", "forkButton", "홈·마이페이지", ""),
    R("POKE-02", "정의", "콕 찌르기", "대상 방 목록", "함께 속한 그룹방 목록에서 선택", "구현됨(FE)", "common-groups API", "홈·마이페이지", ""),
    R("POKE-03", "정의", "콕 찌르기", "몰입 중 초대 비활성", "대상 PARTICIPATING이면 그 방 CTA 비활성", "구현됨(FE)", "forkPopup", "홈·마이페이지", ""),
    R("POKE-04", "정의", "콕 찌르기", "송신 후 이동", "발송 후 송신자도 /group/{id} (+내부초대)", "구현됨(FE)", "usePoke · useInviteMate", "홈·마이페이지", ""),
    R("POKE-05", "정의", "콕 찌르기", "수신", "모달에서 참여하기 → 해당 방 이동", "구현됨(FE)", "poke 수신 모달", "전역", ""),
    R("CHEER-01", "정의", "응원하기", "리셋 조건", "전원 NOT_PARTICIPATING이면 cheerCount=0 (일일 리셋 아님)", "구현됨(BE)", "resetAllCheerCounts", "그룹방", "CHG-012"),
    R("CHEER-02", "정의", "응원하기", "전송 조건", "발신·수신 모두 세션 참여 중이어야 함", "구현됨(FE+BE)", "sendCheer", "그룹방", "MCARD-03"),
    R("INVITE-01", "정의", "초대", "외부 링크", "/invite/{groupId} · 7일 만료 없음", "구현됨(FE+BE)", "createInvitationUrl · joinGroupViaLink", "홈·초대", "라운지는 LOUNGE-10"),
    R("INVITE-02", "정의", "초대", "내부 초대", "친구 목록 PENDING 생성·수락/거절", "구현됨(FE+BE)", "Invitation", "홈·그룹방", "GROUP-J02와 동일"),
    R("MATE-01", "정의", "메이트", "목록", "함께한 메이트 페이지네이션", "구현됨(FE+BE)", "GET /groups/mates", "홈·마이페이지", ""),
    R("MATE-02", "정의", "메이트", "검색", "닉네임 부분일치", "구현됨(FE+BE)", "메이트 검색 UI", "홈·마이페이지", ""),
    R("ONBOARD-01", "정의", "온보딩·라우팅", "분기", "미로그인→login / 약관→onboarding / pending invite→/invite / 완료→홈", "구현됨(FE)", "auth/callback · middleware · InviteRedirectHandler", "전역", ""),
]

rows.append(SEC("7. 캐릭터"))
rows += [
    R("CHAR-01", "정의", "캐릭터", "성장 기준", "누적 집중 시간(초) · 출석 일수 미구현", "구현됨(FE+BE)", "unlockTimeInSeconds · total-study-time", "전역", ""),
    R("CHAR-02", "정의", "캐릭터", "단계", "12단계(1/5/10/20/50/100/150/200/300/400/500/600h)", "구현됨(FE)", "CHARACTER_BY_HOURS · BE ImageCharacter", "마이페이지", ""),
    R("SIDE-C-01", "참조", "캐릭터", "노출", "프로필/사이드바=최고 레벨 캐릭터", "구현됨(FE+BE)", "getHighestLevelCharacter", "사이드바·마이페이지", "정의: SIDE-C-01"),
    R("CHAR-03", "정의", "캐릭터", "비정상 종료", "정상 저장되지 않은 시간은 누적/보상 제외 원칙", "데이터만(DB)", "", "전역", ""),
    R("CHAR-04", "정의", "캐릭터", "해금 시점", "세션 리뷰 제출 후 check-award", "구현됨(FE)", "useReviewPopup", "그룹방 나가기", ""),
]

rows.append(SEC("8. 할 일 메뉴"))
rows += [
    R("TODO-01", "정의", "할일-필터", "오늘/전체", "today | all 필터", "구현됨(FE)", "todo/page DayFilter", "할일", ""),
    R("TODO-02", "정의", "할일-필터", "오늘 목록", "GET /todos/today", "구현됨(FE+BE)", "TodoService", "할일", ""),
    R("TODO-03", "정의", "할일-필터", "전체 목록", "GET /todos/my", "구현됨(FE+BE)", "TodoService", "할일", ""),
    R("TODO-04", "정의", "할일-카테고리", "생성", "이름+색상 · Enter 저장", "구현됨(FE+BE)", "POST /categories", "할일", ""),
    R("TODO-05", "정의", "할일-카테고리", "이름 제한", "최대 20자", "구현됨(FE+BE)", "@Size(20)", "할일", ""),
    R("TODO-06", "정의", "할일-카테고리", "색상", "7색 RED~PURPLE", "구현됨(FE+BE)", "CategoryColor", "할일·리포트", ""),
    R("TODO-07", "정의", "할일-카테고리", "개수 제한", "상한 없음", "구현됨(BE)", "TodoServiceImpl", "할일", ""),
    R("TODO-08", "정의", "할일-카테고리", "수정/삭제/순서", "수정·삭제(하위 soft)·순서 PATCH 전체 ID 일치", "구현됨(FE+BE)", "categories API", "할일", ""),
    R("TODO-09", "정의", "할일-작업", "생성", "카테고리·제목·날짜·목표시간", "구현됨(FE+BE)", "POST /todos", "할일", ""),
    R("TODO-10", "정의", "할일-작업", "제목 제한", "최대 35자", "구현됨(FE+BE)", "@Size(35)", "할일", ""),
    R("TODO-11", "정의", "할일-작업", "목표시간", "60~86400초(1분~24h)", "구현됨(FE+BE)", "DurationField · @Range", "할일", ""),
    R("TODO-12", "정의", "할일-작업", "날짜", "과거·미래·오늘 허용", "구현됨(FE+BE)", "date @NotNull만", "할일", ""),
    R("TODO-13", "정의", "할일-작업", "완료 토글", "PATCH complete · actualTime 무관", "구현됨(FE+BE)", "toggleComplete", "할일", ""),
    R("SIDE-C-03", "참조", "할일-작업", "달성률", "actual/target % · 최대 100%", "구현됨(FE+BE)", "workItem", "할일", "정의: SIDE-C-03"),
    R("SIDE-C-04", "참조", "할일-작업", "누적시간 표시", "actualTime HH:MM:SS", "구현됨(FE+BE)", "workItem", "할일", "정의: SIDE-C-04"),
    R("TIMER-02", "참조", "할일-작업", "누적시간 증가", "타이머 pause/finish 시 가산", "구현됨(BE)", "FocusSessionServiceImpl", "할일", "정의: TIMER-02"),
    R("TODO-14", "정의", "할일-작업", "오늘하기", "과거 미완료 → 날짜를 오늘로", "구현됨(FE)", "onDoToday", "할일", ""),
    R("TODO-15", "정의", "할일-작업", "드래그이동", "미완료만 다른 카테고리로 DnD", "구현됨(FE)", "useTodoDragAndDrop", "할일", ""),
    R("TODO-16", "정의", "할일-작업", "과거날짜 추가제한", "과거에서 신규 추가 버튼 숨김", "구현됨(FE)", "addWorkForm", "할일", ""),
    R("SIDE-C-02", "참조", "할일-연동", "사이드바 선택", "홈/그룹방 선택 할일 연동", "구현됨(FE)", "selectedTodoId", "할일·홈·그룹", "정의: SIDE-C-02"),
    R("TIMER-01", "참조", "할일-연동", "타이머 연동", "선택 할일로 개인 타이머 시작", "구현됨(FE+BE)", "FocusSession", "할일", "정의: TIMER-01"),
    R("AUTH-05", "참조", "할일-접근", "로그인 필요", "refresh 없으면 /login", "구현됨(FE)", "middleware", "할일", "정의: AUTH-05"),
]

rows.append(SEC("9. 집중리포트"))
rows += [
    R("REPORT-01", "정의", "집중리포트-히트맵", "데이터 소스", "focus_interval 일별 초 · FOCUS+NORMAL", "구현됨(FE+BE)", "GET /records/daily", "리포트", ""),
    R("REPORT-02", "정의", "집중리포트-히트맵", "기간", "당해 연도만 · 연도선택 UI 없음", "구현됨(FE+BE)", "Year.now()", "리포트", ""),
    R("REPORT-03", "정의", "집중리포트-히트맵", "색상 레벨", "0~1 / 1~3 / 3~6 / 6~9 / 9h+", "구현됨(FE)", "secondsToLevel", "리포트", ""),
    R("REPORT-04", "정의", "집중리포트-대시보드", "기간 탭", "오늘·이번주·이번달·전체", "구현됨(FE+BE)", "DashboardRangeType", "리포트", ""),
    R("REPORT-05", "정의", "집중리포트-요약", "총/개인/모각작 몰입", "focus_session.total_duration · INDIVIDUAL/GROUP", "구현됨(FE+BE)", "FocusRecordServiceImpl", "리포트", "GROUP=그룹방 개인타이머(공통타이머 아님)"),
    R("REPORT-06", "정의", "집중리포트-요약", "완료한 작업", "todo.date·isCompleted 건수", "구현됨(FE+BE)", "TodoRepository", "리포트", "TODO-13"),
    R("REPORT-07", "정의", "집중리포트-차트", "시간대별", "0~23시 · phase 전부(히트맵과 다름)", "구현됨(FE+BE)", "splitIntervalByHour", "리포트", ""),
    R("REPORT-08", "정의", "집중리포트-차트", "카테고리", "도넛·달성개수 (focus_session + todo)", "구현됨(FE+BE)", "getRawCategoryStats", "리포트", "TODO-06 색상"),
    R("REPORT-09", "정의", "집중리포트-데이터", "마이페이지와 차이", "리포트=focus_session · 마이페이지=todo.actualTime", "구현됨(FE+BE)", "", "리포트·마이페이지", "MYPAGE-T01/T02"),
    R("REPORT-10", "정의", "집중리포트-이슈", "그룹타이머 미포함", "group_focus_session은 리포트 집계 별도 미포함", "구현됨(BE)", "", "리포트", "CHG-009"),
    R("AUTH-05", "참조", "집중리포트-접근", "로그인 필요", "refresh 없으면 /login", "구현됨(FE)", "middleware", "리포트", "정의: AUTH-05"),
]

rows.append(SEC("10. 마이페이지"))
rows += [
    R("MYPAGE-01", "정의", "마이페이지-프로필", "표시 항목", "닉네임·이메일·이미지·완료작업·완료시간·수집캐릭터", "구현됨(FE+BE)", "character-basket", "마이페이지", ""),
    R("MYPAGE-02", "정의", "마이페이지-프로필", "프로필 수정", "이름·이메일·이미지 · 닉네임20·이메일형식·중복검사", "구현됨(FE+BE)", "PATCH /mypage/profile", "마이페이지", ""),
    R("MYPAGE-03", "정의", "마이페이지-프로필", "로그아웃", "POST /auth/logout → /login", "구현됨(FE+BE)", "accountSettings", "마이페이지", ""),
    R("AUTH-04", "참조", "마이페이지-탈퇴", "자진 탈퇴", "2단계 UI · 사유 미전송 · soft delete", "구현됨(FE+BE)", "DELETE /users/withdrawal", "마이페이지", "정의: AUTH-04"),
    R("MYPAGE-B01", "정의", "마이페이지-바구니", "보유/잠금", "N/12 · 미보유 시 N시간 후 만나요 (FE 상수)", "구현됨(FE)", "boardBasket · CHARACTER_BY_HOURS", "마이페이지", "CHAR-02"),
    R("MYPAGE-B02", "정의", "마이페이지-바구니", "해금", "total-study-time ≥ unlock · 리뷰 후 check-award", "구현됨(FE+BE)", "check-award", "마이페이지", "CHAR-01·04"),
    R("MYPAGE-T01", "정의", "마이페이지-누적시간", "캐릭터용", "todo actualTime 전체 합(완료 무관)", "구현됨(BE)", "sumActualTimeByUser", "마이페이지", "CHAR-01"),
    R("MYPAGE-T02", "정의", "마이페이지-누적시간", "프로필용", "완료 todo actualTime만", "구현됨(BE)", "sumCompletedWorksTimeByUser", "마이페이지", "REPORT-09"),
    R("MATE-01", "참조", "마이페이지-메이트", "목록", "GET /groups/mates", "구현됨(FE+BE)", "boardMate", "마이페이지", "정의: MATE-01"),
    R("MATE-02", "참조", "마이페이지-메이트", "검색", "닉네임 검색", "구현됨(FE)", "boardMate", "마이페이지", "정의: MATE-02"),
    R("POKE-01", "참조", "마이페이지-메이트", "콕 찌르기", "활성 메이트만", "구현됨(FE)", "forkButton", "마이페이지", "정의: POKE-01"),
    R("MYPAGE-M06", "정의", "마이페이지-메이트", "라운지 필터", "홈과 달리 라운지 제외 로직 없음", "구현됨(FE)", "boardMate", "마이페이지", "LOUNGE-12와 불일치"),
    R("SIDE-C-01", "참조", "마이페이지-연동", "대표 캐릭터", "최고 레벨", "구현됨(FE+BE)", "character-basket", "마이페이지", "정의: SIDE-C-01"),
    R("AUTH-05", "참조", "마이페이지-접근", "로그인 필요", "refresh 없으면 /login", "구현됨(FE)", "middleware", "마이페이지", "정의: AUTH-05"),
]

# write gid0 paste csv
path_gid0 = OUT / "모각작_서비스정책_의미ID_gid0_붙여넣기.csv"
with path_gid0.open("w", encoding="utf-8-sig", newline="") as f:
    w = csv.writer(f)
    w.writerow(["", "🍅 모각작 서비스 정책 관리 (의미 있는 정책ID)"])
    w.writerow([])
    w.writerow(["", "ID 규칙", "도메인접두어-번호. 같은 정책은 어디서든 같은 ID. 정의행=정식정의, 참조=다른 섹션 재등장"])
    w.writerow(["", "레이아웃", "3단구조·그리드·FAB·SEO·카드 배치 등 UI 레이아웃은 정책에서 제외"])
    w.writerow([])
    w.writerow([""] + HDR)
    for r in rows:
        w.writerow([""] + r)

# ID guide
guide = OUT / "모각작_정책ID_체계가이드.txt"
guide.write_text("""모각작 정책 ID 체계 가이드
========================

■ 원칙
1. 정책 1개 = ID 1개. 홈/사이드바/할일 등 어디에 적히든 동일 ID.
2. 섹션에 다시 적을 때는 "정의/참조" 컬럼으로 구분 (정의=정식, 참조=재등장).
3. 레이아웃(배치·그리드·FAB·SEO)은 정책 시트에서 제외. 기능·규칙만 기록.

■ ID 접두어
AUTH-xx     이용대상·약관·인증·탈퇴
STATUS-xx   상태·용어 정의
SIDE-H-xx   사이드바(홈 전용)
SIDE-G-xx   사이드바(그룹방 전용)
SIDE-C-xx   사이드바(공통) ← 홈·그룹·할일에서 재사용
TIMER-xx    개인 타이머
HOME-xx     홈 전용(중복 아닌 것만)
LOUNGE-xx   공식 라운지
GROUP-xx    그룹방 일반 (01~03 생성)
GROUP-Jxx   그룹방 가입
GROUP-Sxx   그룹방 세션 입퇴장
GROUP-Lxx   그룹방 멤버십 탈퇴·방장 이양
GROUP-Mxx   그룹방 관리
GROUP-Hxx   그룹방 홈 UI
GROUP-Rxx   그룹방 방안 UI(기능)
GROUP-Pxx   공개설정
GROUP-Gxx   그룹 목표 표시
GROUP-Xxx   나가기 경고
MCARD-xx    멤버카드
GTIMER-xx   그룹(공통) 타이머
POKE-xx     콕 찌르기
CHEER-xx    응원
INVITE-xx   초대
MATE-xx     메이트
ONBOARD-xx  온보딩·라우팅
CHAR-xx     캐릭터
TODO-xx     할 일
REPORT-xx   집중 리포트
MYPAGE-xx   마이페이지

■ 중복 예시
- 홈 Preview 할일 유지 = SIDE-C-02 (사이드바 공통과 동일)
- 할일 카드 달성률 = SIDE-C-03
- 할일/리포트/마이페이지 로그인 필요 = AUTH-05
- 홈 몰입 배지 = GROUP-H01 (그룹방_홈UI와 동일)
- 캐릭터 노출 = SIDE-C-01
- 홈 콕 = POKE-01

■ 변경안 시트
CHG-xxx의 "관련정책ID"에 위 ID를 기입.
""", encoding="utf-8")

# Change proposal with new IDs
chg_path = OUT / "모각작_정책변경안_AS-IS_TO-BE.csv"
chg_rows = [
    ["변경ID", "영역", "대분류", "중분류", "AS-IS(현재)", "TO-BE(변경안)", "변경 이유", "영향 범위", "우선순위", "상태", "관련 출처", "관련정책ID"],
    ["CHG-001", "멤버카드", "멤버카드", "하단-시간표시", "personalTimerSeconds(세션 경과)", "todo.actualTimeInSeconds(작업 누적)=SIDE-C-04와 동일", "내 시간·남이 보는 시간 통일", "MemberStatusDto · groupMemberState", "높음", "검토중", "groupMySidebar", "MCARD-06,SIDE-C-04"],
    ["CHG-002", "멤버카드", "멤버카드", "상태-rest/finish", "finish 후 RESTING→rest 유지", "finish 후 표시 재정의(end/rest/누적만)", "종료 후 참여중처럼 보이는 UX", "syncGroupParticipation", "중간", "검토중", "", "MCARD-05,STATUS-02,STATUS-03"],
    ["CHG-003", "멤버카드", "멤버카드", "최근참여", "enteredAt 일수", "lastActiveAt/마지막 타이머 종료 기준", "필드명·의미 불일치", "MCARD-09", "낮음", "검토중", "", "MCARD-09,LOUNGE-15"],
    ["CHG-004", "그룹기능제거", "그룹 타이머", "전체", "공통 타이머 2명·누구나 제어·finish→accumulated", "공통 타이머 UI/API/WS 제거·개인 타이머만", "UX 단순화", "groupTimer · GroupFocusSession*", "높음", "기획검토", "", "GTIMER-01,GTIMER-02,GTIMER-03,GTIMER-04,GTIMER-05,GTIMER-06,GTIMER-07,GTIMER-08,GROUP-X01,GROUP-S02,CHEER-01"],
    ["CHG-005", "그룹기능제거", "그룹 목표", "전체", "목표·달성률 UI/API", "목표 UI/API 제거", "accumulatedDuration 의존 소멸", "groupGoal · setGroupGoal", "높음", "기획검토", "", "GROUP-M04,GROUP-G01,GROUP-02"],
    ["CHG-006", "집중체크통일", "그룹방_관리", "집중체크 알림", "방장·1~23h·타이머 중만", "라운지형 정각+개인 opt-in+presence", "일반/라운지 통일", "groupNoti · LOUNGE-08", "높음", "기획검토", "", "GROUP-M02,LOUNGE-08"],
    ["CHG-007", "집중체크통일", "그룹방_관리", "집중체크 수신자", "ActiveFocusSession만", "세션 입장+opt-in", "타이머 없이도 알림", "FocusNotificationService", "높음", "기획검토", "", "GROUP-M03,LOUNGE-09"],
    ["CHG-008", "레이아웃", "그룹방", "상단 UI", "타이머+목표+집중체크 3칸", "기능 제거 후 재배치(라운지 참고)", "정책 범위 외(레이아웃) — 구현 체크리스트용", "groupPage", "중간", "참고(정책제외)", "레이아웃은 정책 시트 제외", "GTIMER-*,GROUP-M04,GROUP-M02"],
    ["CHG-009", "영향분석", "집중리포트", "모각작 몰입", "focus_session GROUP(개인타이머)", "공통타이머와 무관·집계 유지", "라벨 의미만 재검토", "REPORT-05", "중간", "검토중", "", "REPORT-05,REPORT-10,GTIMER-01"],
    ["CHG-010", "영향분석", "개인타이머·사이드바", "유지", "그룹방 개인 타이머 유지", "변경 없음", "공통타이머만 제거", "", "높음", "검토중", "", "STATUS-02,SIDE-C-02,SIDE-C-04,SIDE-C-05,TIMER-01,TIMER-02"],
    ["CHG-011", "영향분석", "그룹방 나가기", "finishGroupTimer 분기", "마지막 유저 퇴장 시 finish", "개인타이머 forceStop만", "이탈 단순화", "GROUP-X01", "높음", "검토중", "", "GROUP-X01,GTIMER-08,GROUP-S02"],
    ["CHG-012", "영향분석", "응원·누적리셋", "cheer+accumulated 리셋", "응원 리셋 유지·accumulated deprecated", "목표/타이머 제거 후 dead code", "", "중간", "검토중", "", "CHEER-01,GROUP-S02,GROUP-G01"],
    ["CHG-013", "영향분석", "홈 UI", "몰입 배지", "PARTICIPATING 기준", "영향 없음", "", "", "낮음", "검토중", "", "GROUP-H01,GROUP-H02"],
    ["CHG-014", "영향분석", "멤버카드·콕·응원", "개인타이머 축", "유지", "공통타이머와 독립", "", "", "낮음", "검토중", "", "MCARD-05,CHEER-02,POKE-03"],
    ["CHG-015", "영향분석", "BE·DB·WS", "group_focus_*", "제거/미사용·데이터 보존 여부", "레거시 정리", "", "높음", "검토중", "", "GTIMER-01~08"],
    ["CHG-016", "영향분석", "GroupDetail API", "goal/progress/accumulated", "필드 제거·타입 정리", "API 계약 변경", "", "높음", "검토중", "", "GROUP-G01,GROUP-M04,GROUP-02"],
    ["CHG-017", "영향분석", "온보딩", "dummy groupGoal", "mock 필드 제거", "튜토리얼 정리", "", "낮음", "검토중", "", "ONBOARD-01"],
    ["CHG-018", "영향분석", "상단 재배치", "3칸→2칸", "레이아웃 작업(정책 제외)", "구현 메모", "", "중간", "참고(정책제외)", "", "CHG-008"],
    ["CHG-019", "영향분석", "alertModal", "groupTimerLimit", "타입·호출 제거", "FE 검증 삭제", "", "중간", "검토중", "", "GTIMER-01,GTIMER-02"],
    ["CHG-020", "영향분석", "데이터파이프라인", "공통타이머 지표", "deprecated", "분석 스키마 갱신", "", "낮음", "검토중", "", "REPORT-10,GTIMER-01"],
]
with chg_path.open("w", encoding="utf-8-sig", newline="") as f:
    w = csv.writer(f)
    w.writerows(chg_rows)

# count unique defining IDs
ids = sorted({r[0] for r in rows if r[0] and r[1] == "정의"})
print("gid0 rows", len(rows), "defining IDs", len(ids))
print("wrote", path_gid0.name, chg_path.name, guide.name)
for i in ids:
    print(i)
