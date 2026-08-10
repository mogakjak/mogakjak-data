# -*- coding: utf-8 -*-
import csv, io, re
from pathlib import Path

INP = Path(r"c:\00_mogakjak\mogakjak_data_pipeline\docs\sheets\_gid0_latest.csv")
OUT = Path(r"c:\00_mogakjak\mogakjak_data_pipeline\docs\sheets\모각작_정책ID_단순매핑.csv")
OUT_SHEET = Path(r"c:\00_mogakjak\mogakjak_data_pipeline\docs\sheets\모각작_서비스정책_단순ID_gid0_붙여넣기.csv")
OUT_CHG = Path(r"c:\00_mogakjak\mogakjak_data_pipeline\docs\sheets\모각작_정책변경안_AS-IS_TO-BE.csv")

OLD_TO_NEW = {
    "AUTH-01": "AU01", "AUTH-02": "AU02", "AUTH-03": "AU03", "AUTH-04": "AU04", "AUTH-05": "AU05",
    "STATUS-01": "ST01", "STATUS-02": "ST02", "STATUS-03": "ST03", "STATUS-04": "ST04",
    "SIDE-H-01": "SH01", "SIDE-G-01": "SG01",
    "SIDE-C-01": "SD01", "SIDE-C-02": "SD02", "SIDE-C-03": "SD03", "SIDE-C-04": "SD04", "SIDE-C-05": "SD05",
    "TIMER-01": "TM01", "TIMER-02": "TM02",
    "HOME-01": "HM01", "HOME-02": "HM02", "HOME-03": "HM03", "HOME-04": "HM04", "HOME-05": "HM05",
    "LOUNGE-01": "LN01", "LOUNGE-02": "LN02", "LOUNGE-03": "LN03", "LOUNGE-04": "LN04", "LOUNGE-05": "LN05",
    "LOUNGE-06": "LN06", "LOUNGE-07": "LN07", "LOUNGE-08": "LN08", "LOUNGE-09": "LN09", "LOUNGE-10": "LN10",
    "LOUNGE-11": "LN11", "LOUNGE-12": "LN12", "LOUNGE-13": "LN13", "LOUNGE-14": "LN14", "LOUNGE-15": "LN15",
    "LOUNGE-16": "LN16",
    "GROUP-01": "GR01", "GROUP-02": "GR02", "GROUP-03": "GR03",
    "GROUP-J01": "GJ01", "GROUP-J02": "GJ02", "GROUP-J03": "GJ03", "GROUP-J04": "GJ04",
    "GROUP-S01": "GS01", "GROUP-S02": "GS02", "GROUP-S03": "GS03",
    "GROUP-L01": "GL01", "GROUP-L02": "GL02", "GROUP-L03": "GL03", "GROUP-L04": "GL04",
    "GROUP-M01": "GM01", "GROUP-M02": "GM02", "GROUP-M03": "GM03", "GROUP-M04": "GM04", "GROUP-M05": "GM05",
    "GROUP-H01": "GH01", "GROUP-H02": "GH02", "GROUP-H03": "GH03",
    "GROUP-R01": "GP01", "GROUP-P01": "GP02", "GROUP-X01": "GX01",
    "MCARD-01": "MC01", "MCARD-02": "MC02", "MCARD-03": "MC03", "MCARD-04": "MC04", "MCARD-05": "MC05",
    "MCARD-06": "MC06", "MCARD-07": "MC07", "MCARD-08": "MC08", "MCARD-09": "MC09", "MCARD-10": "MC10",
    "GTIMER-01": "GT01", "GTIMER-02": "GT02", "GTIMER-03": "GT03", "GTIMER-04": "GT04",
    "GTIMER-05": "GT05", "GTIMER-06": "GT06", "GTIMER-07": "GT07", "GTIMER-08": "GT08",
    "POKE-01": "PK01", "POKE-02": "PK02", "POKE-03": "PK03", "POKE-04": "PK04", "POKE-05": "PK05",
    "CHEER-01": "CH01", "CHEER-02": "CH02",
    "INVITE-01": "IV01", "INVITE-02": "IV02",
    "MATE-01": "MT01", "MATE-02": "MT02", "ONBOARD-01": "OB01",
    "CHAR-01": "CR01", "CHAR-02": "CR02", "CHAR-03": "CR03", "CHAR-04": "CR04",
    "TODO-01": "TD01", "TODO-02": "TD02", "TODO-03": "TD03", "TODO-04": "TD04", "TODO-05": "TD05",
    "TODO-06": "TD06", "TODO-07": "TD07", "TODO-08": "TD08", "TODO-09": "TD09", "TODO-10": "TD10",
    "TODO-11": "TD11", "TODO-12": "TD12", "TODO-13": "TD13", "TODO-14": "TD14", "TODO-15": "TD15",
    "TODO-16": "TD16", "TODO-17": "TD17", "TODO-18": "TD18", "TODO-19": "TD19", "TODO-20": "TD20",
    "TODO-21": "TD21", "TODO-22": "TD22", "TODO-23": "TD23", "TODO-24": "TD24", "TODO-25": "TD25",
    "TODO-26": "TD26", "TODO-27": "TD27", "TODO-28": "TD28", "TODO-29": "TD29", "TODO-30": "TD30",
    "REPORT-01": "RP01", "REPORT-02": "RP02", "REPORT-03": "RP03", "REPORT-04": "RP04", "REPORT-05": "RP05",
    "REPORT-06": "RP06", "REPORT-07": "RP07", "REPORT-08": "RP08", "REPORT-09": "RP09", "REPORT-10": "RP10",
    "MYPAGE-01": "MY01", "MYPAGE-02": "MY02", "MYPAGE-03": "MY03",
    "MYPAGE-B01": "MY04", "MYPAGE-B02": "MY05", "MYPAGE-T01": "MY06", "MYPAGE-T02": "MY07", "MYPAGE-M06": "MY08",
}

# rows without old id -> assign by (major, minor)
EXTRA = {
    ("그룹방_관리", "강퇴"): "GM06",
    ("그룹방_채팅", "채팅"): None,
    ("그룹방_목표표시", "달성률"): "GM07",
    ("그룹방_공개설정", "할일/시간 공개"): "GP03",
    ("할일-연동", "온보딩"): "OB02",
    ("할일-이슈", "카테고리수정권한"): "TD31",
    ("집중리포트-대시보드", "탭"): "RP11",
    ("집중리포트-대시보드", "기간-오늘"): "RP12",
    ("집중리포트-대시보드", "기간-이번주"): "RP13",
    ("집중리포트-대시보드", "기간-이번달"): "RP14",
    ("집중리포트-대시보드", "기간-전체"): "RP15",
    ("집중리포트-대시보드", "API"): "RP16",
    ("집중리포트-대시보드", "리페치"): "RP17",
    ("집중리포트-요약카드", "총 몰입시간"): "RP18",
    ("집중리포트-요약카드", "모각작 몰입"): "RP19",
    ("집중리포트-요약카드", "개인 몰입"): "RP20",
    ("집중리포트-요약카드", "완료한 작업"): "RP21",
    ("집중리포트-요약카드", "표시포맷"): "RP22",
    ("집중리포트-차트", "시간대별"): "RP23",
    ("집중리포트-차트", "시간대 phase"): "RP24",
    ("집중리포트-차트", "Y축 제한"): "RP25",
    ("집중리포트-차트", "카테고리 도넛"): "RP26",
    ("집중리포트-차트", "도넛 라벨"): "RP27",
    ("집중리포트-차트", "카테고리 달성"): "RP28",
    ("집중리포트-데이터", "세션 기준"): "RP29",
    ("집중리포트-데이터", "할일 기준"): "RP30",
    ("집중리포트-데이터", "미사용필드"): "RP31",
    ("집중리포트-데이터", "마이페이지와 차이"): "RP32",
    ("집중리포트-이슈", "그룹타이머"): "RP33",
    ("집중리포트-히트맵", "이슈-데이터잘림"): "RP34",
    ("마이페이지-탈퇴", "2단계"): "MY09",
    ("마이페이지-탈퇴", "API"): "MY10",
    ("마이페이지-탈퇴", "처리 방식"): "MY11",
    ("마이페이지-탈퇴", "재로그인"): "MY12",
    ("마이페이지-탈퇴", "그룹 조건"): "MY13",
    ("마이페이지-탈퇴", "1단계"): "MY14",
    ("마이페이지-바구니", "그리드"): "MY15",
    ("마이페이지-바구니", "보유 표시"): "MY16",
    ("마이페이지-바구니", "잠금 UI"): "MY17",
    ("마이페이지-바구니", "과일 도감"): "MY18",
    ("마이페이지-바구니", "도감 API"): "MY19",
    ("마이페이지-바구니", "해금 조건"): "MY20",
    ("마이페이지-바구니", "해금 시점"): "MY21",
    ("마이페이지-바구니", "대표 변경 API"): "MY22",
    ("마이페이지-바구니", "BE 명칭"): "MY23",
    ("마이페이지-누적시간", "캐릭터용"): "MY24",
    ("마이페이지-누적시간", "프로필용"): "MY25",
    ("마이페이지-누적시간", "집계 불일치"): "MY26",
    ("마이페이지-메이트", "목록 API"): "MT01",
    ("마이페이지-메이트", "그룹 필터"): "MY27",
    ("마이페이지-메이트", "검색"): "MT02",
    ("마이페이지-메이트", "실시간 상태"): "MY28",
    ("마이페이지-메이트", "콕 찌르기"): "PK01",
    ("마이페이지-메이트", "빈 목록"): "MY29",
    ("마이페이지-메이트", "라운지 제외"): "MY30",
    ("마이페이지-연동", "헤더 프로필"): "MY31",
    ("마이페이지-연동", "캐릭터 획득 모달"): "MY32",
    ("마이페이지-프로필", "닉네임 제한"): "MY33",
    ("마이페이지-프로필", "이메일 제한"): "MY34",
    ("마이페이지-프로필", "이미지 업로드"): "MY35",
    ("마이페이지-프로필", "로그아웃"): "MY37",
    ("마이페이지-프로필", "계정설정"): "MY36",
    ("마이페이지-프로필", "표시 항목"): "MY38",
    ("마이페이지-프로필", "대표 캐릭터"): "SD01",
    ("마이페이지-프로필", "프로필 수정"): "MY07",
    ("마이페이지-프로필", "완료 작업 수"): "MY04",
    ("마이페이지-프로필", "완료한 시간"): "MY05",
    ("마이페이지-프로필", "계정설정"): "MY36",
    ("마이페이지-접근", "메뉴 진입"): "MY01",
    ("마이페이지-접근", "로그인 필요"): "AU05",
    ("마이페이지-접근", "현재 페이지 표시"): "MY03",
    ("할일-접근", "로그인 필요"): "AU05",
    ("집중리포트-접근", "로그인 필요"): "AU05",
    ("캐릭터", "노출"): "SD01",
    ("홈-메이트", "목록"): "MT01",
    ("홈-메이트", "그룹 필터"): "LN15",
    ("홈-메이트", "검색"): "MT02",
    ("홈-메이트", "콕 찌르기"): "PK01",
    ("집중리포트-차트", "카테고리 리스트"): "",
    ("서비스 해지", "사용자 데이터 규정"): "",
}

OLD_TO_NEW["GROUP-G01"] = "GM07"
OLD_TO_NEW["GROUP-S02"] = "GS02"
OLD_TO_NEW["GROUP-X01"] = "GX01"
OLD_TO_NEW["ONBOARD-01"] = "OB01"
OLD_TO_NEW["CHEER-01"] = "CH01"
OLD_TO_NEW["STATUS-02"] = "ST02"
OLD_TO_NEW["STATUS-03"] = "ST03"
OLD_TO_NEW["SIDE-C-02"] = "SD02"
OLD_TO_NEW["SIDE-C-04"] = "SD04"
OLD_TO_NEW["SIDE-C-05"] = "SD05"
OLD_TO_NEW["TIMER-01"] = "TM01"
OLD_TO_NEW["TIMER-02"] = "TM02"
OLD_TO_NEW["LOUNGE-08"] = "LN08"
OLD_TO_NEW["LOUNGE-09"] = "LN09"
OLD_TO_NEW["MCARD-09"] = "MC09"

REF_BY_CONTENT = [
    (r"refresh.*login|로그인 필요", "AU05"),
    (r"selectedTodo|사이드바 선택|작업과 연동", "SD02"),
    (r"달성률|actualTime/target", "SD03"),
    (r"actualTimeInSeconds HH|누적시간 표시", "SD04"),
    (r"누적시간 증가|actualTime 가산", "TM02"),
    (r"개인 타이머 시작|타이머 연동", "TM01"),
    (r"최고 레벨|프로필 캐릭터|대표 캐릭터", "SD01"),
    (r"자진 탈퇴|DELETE /api/users/withdrawal|탈퇴 사유", "AU04"),
    (r"PARTICIPATING.*몰입|몰입/휴식 배지", "GH01"),
    (r"타이머 실행.*/(전체|멤버)", "GH02"),
    (r"5아이콘|프로필 5", "GH03"),
    (r"/group/\{id\}|일반 그룹 입장|참여하기", "GS01"),
    (r"/lounge/enter|라운지 입장", "LN03"),
    (r"케밥|그룹 나가기|leaveGroup", "GL01"),
    (r"왕관|방장 뱃지|HOST", "GM01"),
    (r"메이트.*목록|GET /groups/mates", "MT01"),
    (r"닉네임.*검색|LIKE 검색|부분일치", "MT02"),
    (r"콕 찌르기|ForkButton|poke", "PK01"),
    (r"라운지 제외", "LN15"),
]

def norm(s):
    return re.sub(r"\s+", " ", (s or "").strip())

def to_new(old_id, major, minor, content):
    key = (norm(major), norm(minor))
    if key in EXTRA:
        v = EXTRA[key]
        return v if v else ""
    if old_id:
        oid = norm(old_id).upper()
        if oid == "LOUNGE-12" and major.startswith("홈"):
            return "LN15"
        if oid in OLD_TO_NEW:
            return OLD_TO_NEW[oid]
    c = norm(content)
    for pat, nid in REF_BY_CONTENT:
        if re.search(pat, c, re.I):
            return nid
    return ""

raw = INP.read_bytes().replace(b"\r\r\n", b"\n").replace(b"\r\n", b"\n").replace(b"\r", b"\n")
rows = list(csv.reader(io.StringIO(raw.decode("utf-8"))))

out_rows = []
map_rows = [["구ID", "신ID", "대분류", "중분류", "비고"]]
assigned = {}

for r in rows:
    cells = list(r) + [""] * (8 - len(r))
    old_id = norm(cells[1])
    major = norm(cells[2])
    minor = norm(cells[3])
    content = norm(cells[4])

    is_section = old_id.startswith("📜") or old_id.startswith("🫥") or old_id.startswith("🏠") or old_id.startswith("🛋") or old_id.startswith("👥") or old_id.startswith("🃏") or old_id.startswith("⏱") or old_id.startswith("💬") or old_id.startswith("🍅") or old_id.startswith("✅") or old_id.startswith("📊") or old_id.startswith("👤")
    if is_section or old_id == "정책 ID" or (not minor and not content and not re.match(r"^[A-Z]{2,}-\d", old_id)):
        out_rows.append(cells[:8])
        continue

    new_id = to_new(old_id, major, minor, content)
    if new_id:
        assigned[new_id] = (major, minor)
        if old_id and old_id.upper() in OLD_TO_NEW:
            map_rows.append([old_id, new_id, major, minor, ""])
        elif old_id and old_id != new_id and re.match(r"^[A-Z]", old_id):
            map_rows.append([old_id, new_id, major, minor, "오매핑 수정"])
    cells[1] = new_id
    out_rows.append(cells[:8])

with OUT_SHEET.open("w", encoding="utf-8-sig", newline="") as f:
    csv.writer(f).writerows(out_rows)

with OUT.open("w", encoding="utf-8-sig", newline="") as f:
    csv.writer(f).writerows(map_rows)

def map_policy_id(p):
    p = p.strip()
    if not p:
        return p
    if p == "GTIMER-01~08" or p == "GTIMER-01~GT08":
        return "GT01~GT08"
    if p.endswith("*") and p.startswith("GTIMER"):
        return "GT01~GT08"
    if "~" in p:
        a, b = p.split("~", 1)
        a, b = a.strip(), b.strip()
        na = OLD_TO_NEW.get(a, a)
        if b.isdigit() and a.startswith("GTIMER-"):
            num = int(b)
            start = int(a.split("-")[1])
            return f"GT{start:02d}~GT{num:02d}"
        nb = OLD_TO_NEW.get(b, b)
        return f"{na}~{nb}"
    return OLD_TO_NEW.get(p, p)

# update change sheet ids
chg_in = OUT_CHG
if chg_in.exists():
    chg_rows = list(csv.reader(io.StringIO(chg_in.read_text(encoding="utf-8-sig"))))
    hdr = chg_rows[0]
    id_col = hdr.index("관련정책ID") if "관련정책ID" in hdr else 11
    for i, row in enumerate(chg_rows):
        if i == 0:
            continue
        while len(row) <= id_col:
            row.append("")
        cell = row[id_col]
        if not cell and len(row) > id_col - 1 and row[id_col - 1] and re.search(r"[A-Z]{2,}-\d", row[id_col - 1]):
            cell = row[id_col - 1]
            row[id_col - 1] = ""
        parts = [map_policy_id(part) for part in cell.split(",") if part.strip()]
        row[id_col] = ",".join(parts)
    with chg_in.open("w", encoding="utf-8-sig", newline="") as f:
        csv.writer(f).writerows(chg_rows)

print("mapped", len(map_rows)-1, "sheet rows", len(out_rows))
