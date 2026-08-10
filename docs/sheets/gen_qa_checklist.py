# -*- coding: utf-8 -*-
"""
모각작 QA 체크리스트 자동 생성

입력(복수 가능):
  --chg CHG-004 CHG-001     변경안 ID → 본 변경 + 영향 행 + 연관 정책 확장
  --pol POL-042 POL-014     정책 ID → 해당 정책 + 연관 확장
  --area 그룹방,할일         대분류 키워드 → 해당 영역 전체
  --file groupPage.tsx      출처/위치 파일명 → 관련 정책 역추적
  --full                    전체 정책 (릴리스 전수 QA)

출력: 모각작_QA체크리스트_{날짜}.csv

사용 예:
  python gen_qa_checklist.py --chg CHG-004
  python gen_qa_checklist.py --pol POL-024 POL-065
  python gen_qa_checklist.py --file groupMySidebar --chg CHG-001
  python gen_qa_checklist.py --area 초대,타이머
"""
from __future__ import annotations

import argparse
import csv
import re
from dataclasses import dataclass, field
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parent

POLICY_CSV = ROOT / "모각작_서비스정책_ID부여_gid0_붙여넣기.csv"
CHANGE_CSV = ROOT / "모각작_정책변경안_에픽묶음형.csv"
AREA_CSVS = [
    ROOT / "모각작_홈_정책_통합.csv",
    ROOT / "모각작_할일_정책_통합.csv",
    ROOT / "모각작_그룹방_멤버카드_정책.csv",
    ROOT / "모각작_집중리포트_정책_통합.csv",
    ROOT / "모각작_마이페이지_정책_통합.csv",
    ROOT / "모각작_공식라운지_정책_보강.csv",
]

# 도메인 접두어 → 변경 시 함께 볼 연관 도메인 (2-hop)
DOMAIN_NEIGHBORS: dict[str, list[str]] = {
    "TM": ["ST", "SD", "MC", "GS", "GX", "RP", "CR", "TD", "CH"],
    "SD": ["TM", "MC", "SG", "SH", "RP", "CR", "TD"],
    "ST": ["TM", "MC", "GS", "GH", "CH", "PK"],
    "MC": ["ST", "TM", "SD", "CH", "PK", "SG"],
    "GS": ["ST", "GX", "CH", "GH", "GP"],
    "GJ": ["IV", "MT", "GS", "OB", "AU"],
    "IV": ["GJ", "MT", "OB", "AU", "GS"],
    "GT": ["GS", "GX", "CH", "GH", "GP", "TM"],
    "GM": ["GS", "LN", "ST"],
    "LN": ["GM", "ST", "MC", "MT"],
    "TD": ["TM", "SD", "RP", "CR"],
    "RP": ["TM", "TD", "CR", "MY"],
    "CR": ["TM", "TD", "RP", "MY"],
    "CH": ["ST", "GS", "MC", "TM"],
    "PK": ["ST", "MT", "GJ"],
    "OB": ["IV", "AU", "GJ"],
    "GH": ["ST", "GS", "GP"],
    "GX": ["TM", "GT", "GS"],
}

# POL-xxx ↔ MC06 등 단순 ID 매핑 (변경안 시트용)
SIMPLE_PREFIX_TO_POL: dict[str, str] = {}


def _norm_id(raw: str) -> str:
    s = raw.strip().upper()
    if re.match(r"^POL-\d+$", s):
        return s
    if re.match(r"^[A-Z]{2}\d{2}$", s):
        return s
    return s


def _parse_policy_ids(cell: str) -> list[str]:
    """관련정책ID 셀 파싱: MC06,SD04 / GT01~GT08 / POL-042"""
    if not cell or not cell.strip():
        return []
    out: list[str] = []
    for part in re.split(r"[,·/]", cell):
        part = part.strip()
        if not part:
            continue
        m = re.match(r"^([A-Z]{2})(\d{2})~([A-Z]{2})(\d{2})$", part)
        if m:
            p1, n1, p2, n2 = m.group(1), int(m.group(2)), m.group(3), int(m.group(4))
            if p1 == p2:
                for n in range(n1, n2 + 1):
                    out.append(f"{p1}{n:02d}")
            continue
        out.append(_norm_id(part))
    return out


def _read_csv_rows(path: Path) -> list[list[str]]:
    for enc in ("utf-8-sig", "utf-8", "cp949"):
        try:
            with path.open(encoding=enc, newline="") as f:
                return list(csv.reader(f))
        except UnicodeDecodeError:
            continue
    raise UnicodeDecodeError("unknown", b"", 0, 1, path.name)


@dataclass
class Policy:
    policy_id: str
    major: str
    minor: str
    content: str
    impl: str
    source: str
    note: str
    change_id: str = ""
    simple_ids: list[str] = field(default_factory=list)


@dataclass
class ChangeRow:
    change_id: str
    parent_id: str
    kind: str
    policy_ids: list[str]
    major: str
    minor: str
    as_is: str
    to_be: str
    desc: str
    source: str
    priority: str
    status: str
    note: str


@dataclass
class CheckItem:
    priority: str
    kind: str  # 직접 | 영향·유지 | 영향·수정 | 연관(도메인) | 연관(출처) | 연관(중복) | 회귀
    policy_id: str
    change_id: str
    area: str
    check_summary: str
    expected: str
    how_to: str
    reason: str
    source: str


def load_policies() -> dict[str, Policy]:
    rows = _read_csv_rows(POLICY_CSV)
    policies: dict[str, Policy] = {}
    simple_map: dict[str, str] = {}

    # 단순 ID 매핑 파일이 있으면 로드
    mapping_path = ROOT / "모각작_정책ID_단순매핑.csv"
    if mapping_path.exists():
        for row in _read_csv_rows(mapping_path):
            if len(row) >= 2 and re.match(r"^[A-Z]{2}\d{2}$", row[1].strip()):
                simple_map[row[0].strip()] = row[1].strip()

    for row in rows:
        if len(row) < 7:
            continue
        pid = row[1].strip() if len(row) > 1 else ""
        if not re.match(r"^POL-\d+$", pid):
            continue
        p = Policy(
            policy_id=pid,
            major=row[2].strip() if len(row) > 2 else "",
            minor=row[3].strip() if len(row) > 3 else "",
            content=row[4].strip() if len(row) > 4 else "",
            impl=row[5].strip() if len(row) > 5 else "",
            source=row[6].strip() if len(row) > 6 else "",
            note=row[7].strip() if len(row) > 7 else "",
            change_id=row[8].strip() if len(row) > 8 else "",
        )
        policies[pid] = p

    # POL 번호 ↔ 도메인 역매핑 (POL-042 ≈ MC05 등은 출처/비고에서 추출)
    global SIMPLE_PREFIX_TO_POL
    for pid, p in policies.items():
        for m in re.finditer(r"\b([A-Z]{2}\d{2})\b", p.note + " " + p.source + " " + p.change_id):
            SIMPLE_PREFIX_TO_POL.setdefault(m.group(1), pid)
        for m in re.finditer(r"CHG-\d+", p.change_id):
            pass

    # mapping file: MC06 -> used in change sheet
    for simple, _ in simple_map.items():
        if re.match(r"^[A-Z]{2}\d{2}$", simple):
            SIMPLE_PREFIX_TO_POL.setdefault(simple, simple)

    return policies


def load_changes() -> dict[str, ChangeRow]:
    rows = _read_csv_rows(CHANGE_CSV)
    changes: dict[str, ChangeRow] = {}
    header_idx = None
    for i, row in enumerate(rows):
        if row and "변경ID" in row[0]:
            header_idx = i
            break
    if header_idx is None:
        return changes

    for row in rows[header_idx + 1 :]:
        if len(row) < 10:
            continue
        cid = row[0].strip()
        if not re.match(r"^CHG-", cid):
            continue
        changes[cid] = ChangeRow(
            change_id=cid,
            parent_id=row[1].strip() if len(row) > 1 else "",
            kind=row[2].strip() if len(row) > 2 else "",
            policy_ids=_parse_policy_ids(row[3] if len(row) > 3 else ""),
            major=row[4].strip() if len(row) > 4 else "",
            minor=row[5].strip() if len(row) > 5 else "",
            as_is=row[6].strip() if len(row) > 6 else "",
            to_be=row[7].strip() if len(row) > 7 else "",
            desc=row[8].strip() if len(row) > 8 else "",
            source=row[11].strip() if len(row) > 11 else "",
            priority=row[12].strip() if len(row) > 12 else "",
            status=row[13].strip() if len(row) > 13 else "",
            note=row[14].strip() if len(row) > 14 else "",
        )
    return changes


def load_area_crossrefs() -> list[tuple[str, str, str, str, str]]:
    """(대분류, 중분류, 내용, 출처, 중복정책)"""
    refs: list[tuple[str, str, str, str, str]] = []
    for path in AREA_CSVS:
        if not path.exists():
            continue
        rows = _read_csv_rows(path)
        for row in rows[1:]:
            if len(row) < 6 or not row[0].strip():
                continue
            dup_idx = 6 if "일반 그룹" not in row[0] else 7
            dup = row[dup_idx].strip() if len(row) > dup_idx else ""
            refs.append((row[0], row[1], row[2], row[5] if len(row) > 5 else "", dup))
    return refs


def resolve_simple_to_pol(simple: str, policies: dict[str, Policy]) -> str | None:
    if simple in policies:
        return simple
    if simple in SIMPLE_PREFIX_TO_POL:
        mapped = SIMPLE_PREFIX_TO_POL[simple]
        if mapped in policies:
            return mapped
    # 출처/비고에서 MC06 등 검색
    for pid, p in policies.items():
        blob = f"{p.source} {p.note} {p.content}"
        if simple in blob or simple.replace("MC", "MCARD") in blob:
            return pid
    # 대분류 키워드 매칭
    prefix = simple[:2]
    num = simple[2:]
    for pid, p in policies.items():
        if prefix == "MC" and "멤버카드" in p.major + p.minor:
            return pid
        if prefix == "SD" and "사이드바" in p.major:
            return pid
        if prefix == "TM" and "타이머" in p.major + p.minor:
            return pid
    return None


def expand_change(chg_id: str, changes: dict[str, ChangeRow]) -> list[tuple[ChangeRow, str]]:
    """본 변경 + 하위 영향 행 반환. (row, role) role=본변경|영향"""
    out: list[tuple[ChangeRow, str]] = []
    root = changes.get(chg_id)
    if not root:
        return out
    out.append((root, "본변경"))
    for cid, row in changes.items():
        if row.parent_id == chg_id or (cid.startswith(chg_id + "-") and row.parent_id == chg_id):
            out.append((row, "영향"))
    # parent 없이 CHG-004-01 형태
    for cid, row in sorted(changes.items()):
        if cid.startswith(chg_id + "-") and (row, "영향") not in out:
            if any(x[0].change_id == cid for x in out):
                continue
            if row.parent_id == chg_id or cid.startswith(chg_id + "-"):
                out.append((row, "영향"))
    return out


def domain_of_policy(policy_id: str, p: Policy | None) -> str | None:
    if p:
        blob = p.major + p.minor + p.source
        for prefix in DOMAIN_NEIGHBORS:
            if prefix in ("TM", "SD", "ST") and "타이머" in blob and prefix == "TM":
                return "TM"
            if "사이드바" in blob and prefix == "SD":
                return "SD"
            if "멤버카드" in blob or "방안UI" in blob:
                return "MC"
            if "초대" in blob:
                return "IV"
            if "라운지" in blob:
                return "LN"
            if "할일" in blob or "todo" in blob.lower():
                return "TD"
            if "리포트" in blob or "집중" in blob:
                return "RP"
    return None


def policies_by_source_fragment(fragment: str, policies: dict[str, Policy]) -> list[str]:
    frag = fragment.lower()
    return [
        pid
        for pid, p in policies.items()
        if frag in p.source.lower() or frag in p.note.lower()
    ]


def policies_by_area_keyword(keyword: str, policies: dict[str, Policy]) -> list[str]:
    kw = keyword.strip()
    return [
        pid
        for pid, p in policies.items()
        if kw in p.major or kw in p.minor or kw in p.content
    ]


def neighbor_policies(seed_simple_ids: list[str], policies: dict[str, Policy]) -> list[tuple[str, str]]:
    """도메인 이웃 정책 (simple prefix 기준)"""
    found: list[tuple[str, str]] = []
    prefixes: set[str] = set()
    for sid in seed_simple_ids:
        if re.match(r"^[A-Z]{2}\d{2}$", sid):
            prefixes.add(sid[:2])
    for prefix in prefixes:
        for neighbor in DOMAIN_NEIGHBORS.get(prefix, []):
            for pid, p in policies.items():
                blob = p.major + p.minor + p.source + p.content
                if neighbor == "TM" and "타이머" in blob:
                    found.append((pid, f"도메인 {prefix}→{neighbor}"))
                elif neighbor == "MC" and ("멤버카드" in blob or "방안UI" in blob):
                    found.append((pid, f"도메인 {prefix}→{neighbor}"))
                elif neighbor == "IV" and "초대" in blob:
                    found.append((pid, f"도메인 {prefix}→{neighbor}"))
                elif neighbor == "RP" and ("리포트" in blob or "집중 리포트" in blob):
                    found.append((pid, f"도메인 {prefix}→{neighbor}"))
                elif neighbor == "TD" and "할일" in blob:
                    found.append((pid, f"도메인 {prefix}→{neighbor}"))
                elif neighbor == "CH" and "응원" in blob:
                    found.append((pid, f"도메인 {prefix}→{neighbor}"))
                elif neighbor == "GS" and "세션" in blob:
                    found.append((pid, f"도메인 {prefix}→{neighbor}"))
                elif neighbor == "ST" and ("몰입" in blob or "휴식" in blob or "상태" in blob):
                    found.append((pid, f"도메인 {prefix}→{neighbor}"))
                elif neighbor == "SD" and "사이드바" in blob:
                    found.append((pid, f"도메인 {prefix}→{neighbor}"))
                elif neighbor == "LN" and "라운지" in blob:
                    found.append((pid, f"도메인 {prefix}→{neighbor}"))
    return found


def build_checklist(
    chg_ids: list[str],
    pol_ids: list[str],
    areas: list[str],
    files: list[str],
    full: bool,
    policies: dict[str, Policy],
    changes: dict[str, ChangeRow],
    crossrefs: list[tuple[str, str, str, str, str]],
) -> list[CheckItem]:
    items: list[CheckItem] = []
    seen: set[str] = set()

    def add(item: CheckItem) -> None:
        key = f"{item.kind}|{item.policy_id}|{item.change_id}|{item.check_summary[:40]}"
        if key in seen:
            return
        seen.add(key)
        items.append(item)

    def policy_check(pid: str, kind: str, change_id: str, reason: str, priority: str = "P1") -> None:
        p = policies.get(pid)
        if not p:
            return
        expected = p.content
        if p.note:
            expected += f" ({p.note})"
        how = f"{p.major} > {p.minor} 화면에서 확인"
        if p.source:
            how += f" · 참고: {p.source}"
        add(
            CheckItem(
                priority=priority,
                kind=kind,
                policy_id=pid,
                change_id=change_id,
                area=p.major,
                check_summary=p.content[:120],
                expected=expected,
                how_to=how,
                reason=reason,
                source=p.source,
            )
        )

    def change_check(row: ChangeRow, role: str) -> None:
        pri = "P0" if row.priority in ("높음", "高") else "P1" if row.priority == "중간" else "P2"
        kind_map = {"본변경": "직접(본변경)", "영향": row.kind or "영향"}
        ck_kind = kind_map.get(role, role)
        if "유지" in row.kind:
            pri = "P1"
        if "수정" in row.kind:
            pri = "P0"

        summary = row.to_be or row.desc or row.as_is
        how = f"{row.major} > {row.minor}"
        if row.source:
            how += f" · {row.source}"
        if "유지" in row.kind:
            how += " · 기존 동작 회귀 없는지 확인(✓ 체크)"

        add(
            CheckItem(
                priority=pri,
                kind=ck_kind,
                policy_id=",".join(row.policy_ids),
                change_id=row.change_id,
                area=row.major,
                check_summary=f"[{row.change_id}] {summary[:100]}",
                expected=row.to_be or "기존 AS-IS 유지",
                how_to=how,
                reason=f"{row.change_id} {row.kind}: {row.desc}",
                source=row.source,
            )
        )

        for sid in row.policy_ids:
            resolved = resolve_simple_to_pol(sid, policies)
            if resolved:
                policy_check(resolved, f"연관(정책)", row.change_id, f"{row.change_id} 관련정책 {sid}", pri)

    # ── CHG 입력 ──
    seed_simple: list[str] = []
    for chg_id in chg_ids:
        for row, role in expand_change(chg_id, changes):
            change_check(row, role)
            seed_simple.extend(row.policy_ids)

    # ── POL 입력 ──
    for pid in pol_ids:
        pid = pid.upper()
        if pid in policies:
            policy_check(pid, "직접(정책)", "", "명시 지정")
            seed_simple.append(pid)

    # ── area ──
    for area in areas:
        for pid in policies_by_area_keyword(area, policies):
            policy_check(pid, "영역", "", f"--area {area}")

    # ── file ──
    for frag in files:
        for pid in policies_by_source_fragment(frag, policies):
            policy_check(pid, "연관(출처)", "", f"출처 파일 {frag}")

    # ── full ──
    if full:
        for pid in sorted(policies.keys(), key=lambda x: int(x.split("-")[1])):
            policy_check(pid, "전수", "", "릴리스 전수 QA")

    # ── 도메인 이웃 확장 (CHG/POL/file 입력 있을 때만) ──
    if seed_simple and not full:
        for pid, reason in neighbor_policies(seed_simple, policies):
            policy_check(pid, "연관(도메인)", "", reason, "P2")

    # ── 영역 시트 중복 정책 크로스레퍼 ──
    if seed_simple or pol_ids or chg_ids:
        touched_majors: set[str] = set()
        for item in items:
            if item.area:
                touched_majors.add(item.area)
        for major, minor, content, source, dup in crossrefs:
            if not dup:
                continue
            for item in items:
                if item.area and (major.startswith(item.area[:4]) or item.area in major):
                    add(
                        CheckItem(
                            priority="P2",
                            kind="연관(중복정책)",
                            policy_id="",
                            change_id=item.change_id,
                            area=major,
                            check_summary=content[:120],
                            expected=content,
                            how_to=f"{major} > {minor} · {source}",
                            reason=f"중복정책 참조: {dup}",
                            source=source,
                        )
                    )

    # ── 고정 회귀 (지난 QA 이슈) ──
    if chg_ids or pol_ids or files:
        regression = [
            ("P0", "회귀", "POL-024", "", "그룹 8명 초과 입장 시 UI(사이드바·4열 그리드) 깨짐 없음", "9번째 계정으로 입장 시도"),
            ("P0", "회귀", "POL-015", "", "타이머 실행 중 할 일 수정/삭제/DnD 차단", "타이머 ON → 할일 페이지에서 수정 시도"),
            ("P0", "회귀", "POL-065", "", "초대 목록에 이미 그룹 참여 중인 메이트 미표시 + 초대 성공", "2계정: A 참여 중 → B 초대 모달"),
        ]
        for pri, kind, pid, cid, summary, how in regression:
            p = policies.get(pid)
            add(
                CheckItem(
                    priority=pri,
                    kind=kind,
                    policy_id=pid,
                    change_id=cid,
                    area=p.major if p else "",
                    check_summary=summary,
                    expected=p.content if p else summary,
                    how_to=how,
                    reason="지난 QA에서 발견된 이슈 — 변경 시 항상 회귀",
                    source=p.source if p else "",
                )
            )

    # 정렬: P0 → P1 → P2, kind
    order = {"P0": 0, "P1": 1, "P2": 2}
    kind_order = {"직접(본변경)": 0, "영향·수정": 1, "직접(정책)": 2, "영향·유지": 3, "연관(정책)": 4, "회귀": 5}
    items.sort(key=lambda x: (order.get(x.priority, 9), kind_order.get(x.kind, 9), x.change_id, x.policy_id))
    return items


def write_csv(items: list[CheckItem], out_path: Path) -> None:
    hdr = [
        "우선순위",
        "유형",
        "정책ID",
        "변경ID",
        "영역",
        "체크 항목",
        "기대 결과",
        "확인 방법",
        "포함 사유",
        "출처/위치",
        "결과",
        "메모",
    ]
    with out_path.open("w", encoding="utf-8-sig", newline="") as f:
        w = csv.writer(f)
        w.writerow(hdr)
        for it in items:
            w.writerow(
                [
                    it.priority,
                    it.kind,
                    it.policy_id,
                    it.change_id,
                    it.area,
                    it.check_summary,
                    it.expected,
                    it.how_to,
                    it.reason,
                    it.source,
                    "",
                    "",
                ]
            )


def main() -> None:
    parser = argparse.ArgumentParser(description="모각작 QA 체크리스트 생성")
    parser.add_argument("--chg", nargs="*", default=[], help="변경ID (예: CHG-004)")
    parser.add_argument("--pol", nargs="*", default=[], help="정책ID (예: POL-042)")
    parser.add_argument("--area", nargs="*", default=[], help="영역 키워드 (예: 그룹방,초대)")
    parser.add_argument("--file", nargs="*", default=[], help="출처 파일명 fragment")
    parser.add_argument("--full", action="store_true", help="전체 정책 전수 QA")
    parser.add_argument("-o", "--output", type=str, default="", help="출력 CSV 경로")
    args = parser.parse_args()

    policies = load_policies()
    changes = load_changes()
    crossrefs = load_area_crossrefs()

    if not any([args.chg, args.pol, args.area, args.file, args.full]):
        parser.print_help()
        print("\n예: python gen_qa_checklist.py --chg CHG-004")
        return

    items = build_checklist(
        args.chg, args.pol, args.area, args.file, args.full, policies, changes, crossrefs
    )

    out = Path(args.output) if args.output else ROOT / f"모각작_QA체크리스트_{date.today().isoformat()}.csv"
    write_csv(items, out)
    print(f"생성 완료: {out} ({len(items)}건)")
    p0 = sum(1 for i in items if i.priority == "P0")
    p1 = sum(1 for i in items if i.priority == "P1")
    p2 = sum(1 for i in items if i.priority == "P2")
    print(f"  P0={p0}  P1={p1}  P2={p2}")


if __name__ == "__main__":
    main()
