(() => {
  const $ = (id) => document.getElementById(id);
  const STORAGE_KEY = "mogakjak_compose_boards_v1";
  const PRODUCT_EVENTS_KEY = "mogakjak_product_events_v1";

  const PRODUCT_EVENT_TYPES = {
    fe_release: { label: "FE 배포", color: "#fa5332" },
    be_release: { label: "BE 배포", color: "#585d63" },
    ga_event: { label: "GA", color: "#3aa89a" },
    feature: { label: "기능", color: "#fb7055" },
    fix: { label: "수정", color: "#7e8389" },
    ops: { label: "운영", color: "#a8aeb2" },
    growth: { label: "성장", color: "#00770e" },
  };

  const PRODUCT_AFFECTS_OPTS = [
    { id: "timer", label: "타이머" },
    { id: "ga", label: "GA·이벤트" },
    { id: "funnel", label: "전환" },
    { id: "group", label: "그룹" },
    { id: "growth", label: "성장" },
    { id: "db", label: "DB" },
  ];

  const VIEW_META = {
    home: {
      eyebrow: "개요",
      title: "Overview",
      desc: "목표 · 운영 현황 · 핵심 추세",
    },
    db: {
      eyebrow: "분석",
      title: "데이터",
      desc: "몰입 · 그룹 · 초대 상세",
    },
    ga: {
      eyebrow: "분석",
      title: "이벤트",
      desc: "GA 지표와 행동 이벤트",
    },
    logs: {
      eyebrow: "분석",
      title: "로그",
      desc: "activity_logs 원장",
    },
    funnel: {
      eyebrow: "분석",
      title: "전환",
      desc: "유입에서 그룹까지",
    },
    compose: {
      eyebrow: "보드",
      title: "보드 편집",
      desc: "지표를 모아 나만의 뷰로",
    },
    board: {
      eyebrow: "보드",
      title: "저장된 보드",
      desc: "읽기 모드",
    },
    svc: {
      eyebrow: "서비스",
      title: "서비스",
      desc: "메뉴별 지표",
    },
    changes: {
      eyebrow: "운영",
      title: "변경 기록",
      desc: "배포·기능·GA 등 개발 이벤트",
    },
    journey: {
      eyebrow: "분석",
      title: "여정",
      desc: "유입에서 잔존까지 · 빈 구간은 로그 보강",
    },
    explore: {
      eyebrow: "분석",
      title: "실험·탐색",
      desc: "기간 비교 · 몰입 루프 · 이벤트 · activity_logs",
    },
    ops: {
      eyebrow: "운영",
      title: "변경 기록",
      desc: "배포·기능·GA 등 개발 이벤트",
    },
  };

  /** 실험·탐색 > 몰입 루프 (제품 질문 프레임) */
  const MOGAK_LOOP = [
    {
      id: "focus",
      step: 1,
      label: "집중",
      question: "혼자라도 타이머를 켜는가",
      tagline: "혼자 몰입의 시작",
      desc: "할 일 + 개인 타이머 · 몰입의 시작",
    },
    {
      id: "together",
      step: 2,
      label: "모각",
      question: "함께 있어서 더 버티는가",
      tagline: "함께 몰입 — 모각작의 본질",
      desc: "그룹방·라운지·메이트 · 모각작의 차별점",
    },
    {
      id: "habit",
      step: 3,
      label: "습관",
      question: "돌아와서 쌓이는가",
      tagline: "돌아와서 쌓이는가",
      desc: "리포트·캐릭터·재방문 · 습관화",
    },
  ];

  const LOOP_NOTES = {
    focus: [
      "1번 질문: 혼자라도 타이머를 켜는가. 할 일 없이 시작 실패가 많으면 ‘켜기’ UX부터 봅니다.",
      "홈 개인 타이머(DB) = 실제 몰입 · timer_start(GA) = 시작 버튼 횟수(전역).",
    ],
    together: [
      "2번 질문: 함께 있어서 더 버티는가. 포레스트·뽀모도로와 다른 축입니다.",
      "입장만 있고 타이머 없음 = 방 구경 · 타이머만 있음 = 혼자만 패턴.",
    ],
    habit: [
      "3번 질문: 돌아와서 쌓이는가. 리포트·온보딩·캐릭터가 이 단계입니다.",
      "집중·모각은 ‘오늘’ · 습관은 ‘다음 주에도’를 봅니다.",
    ],
  };

  const SERVICE_META = {
    home: {
      title: "홈",
      desc: "홈 화면 · 개인 타이머 · 그룹·메이트 허브",
      timerEvents: [
        "select_timer_mode",
        "timer_start",
        "timer_pause",
        "timer_stop",
      ],
      hubEvents: [
        "first_entrance",
        "app_page_view",
        "ui_bowl_vote_floating_click",
      ],
      events: [
        "select_timer_mode",
        "timer_start",
        "timer_pause",
        "timer_stop",
        "first_entrance",
        "app_page_view",
        "ui_bowl_vote_floating_click",
      ],
      notes: [
        "개인 타이머: 좌측 프리뷰에서 홈 전용으로 켠 타이머(DB)와 모드 선택(GA)입니다.",
        "홈 기능: 그룹 목록·메이트·첫 진입 등 허브 역할 지표입니다.",
        "timer_start(GA)는 홈·그룹 구분 없이 전역 집계라, 홈 몰입 시간(DB)과 함께 보되 같은 숫자로 읽지 마세요.",
      ],
    },
    group: {
      title: "그룹",
      desc: "그룹방 · 공식 라운지 · 입장 · 멤버·초대 원장",
      events: [
        "group_stay_duration",
        "cheer_click",
        "lounge_cheer_click",
        "visibility_toggle",
        "invite_link_copy",
        "app_page_view",
      ],
      notes: [
        "일반 그룹방과 공식 라운지를 한 메뉴에서 봅니다.",
        "입장 대비 타이머·체류·응원 반응이 약한지 확인합니다.",
        "아래 원장에서 그룹 이름·멤버·당일 입장을 확인합니다.",
      ],
    },
    todo: {
      title: "할 일",
      desc: "할 일 완료 · 타이머 시작/완료 · 날짜 이동",
      events: [
        "todo_complete_click",
        "timer_start",
        "timer_complete",
        "timer_start_failed",
        "date_picker_click",
        "past_todo_select_to_today",
        "add_work_form_select_duration",
      ],
      notes: [
        "할 일 완료 클릭과 타이머 완료율을 함께 봅니다.",
        "할 일 없이 시작 시도(timer_start_failed)가 많으면 UX를 의심합니다.",
      ],
    },
    record: {
      title: "집중 리포트",
      desc: "집중 리포트 조회와 회고성 행동",
      events: ["record_view", "app_page_view"],
      notes: [
        "리포트 조회(record_view) 빈도와 타이머 이용을 같이 봅니다.",
      ],
    },
    character: {
      title: "캐릭터",
      desc: "온보딩 캐릭터 선택 · 대표 캐릭터 · 보상",
      events: [
        "onboarding_step",
        "auth_agreement_submit",
        "login",
        "login_scroll_cta",
        "page_back_navigation",
      ],
      notes: [
        "온보딩 단계(onboarding_step)에서 캐릭터 선택까지 이어지는지 봅니다.",
        "대표 캐릭터·보상 지표는 DB 파이프라인 확장 후 연결 예정입니다.",
      ],
    },
    mate: {
      title: "메이트",
      desc: "메이트 초대 · 콕 찌르기 · 응답",
      events: ["poke_response", "poke_send", "invite_link_copy"],
      notes: [
        "콕 찌르기 발송→응답→입장 퍼널을 봅니다.",
        "초대 생성·응답률과 함께 메이트 루프 병목을 확인합니다.",
      ],
    },
  };

  const JOURNEY_LABEL = {
    onboarding: "온보딩",
    core: "핵심기능",
    social: "소셜",
    system: "시스템",
  };

  const LENS_LABEL = {
    growth: "성장",
    ux: "퍼널·UX",
    tech: "개발",
  };

  /** Phase 2/3 미리보기용 예시 수치 (실제 GA/로그 아님) */
  const PREVIEW = {
    ga: {
      new_users: 42,
      active_users: 128,
      sessions: 210,
      retention_d1: 0.31,
      retention_d7: 0.18,
      retention_d30: 0.09,
      event_counts: {
        first_entrance: 95,
        login: 60,
        timer_start: 180,
        timer_complete: 110,
        cheer_click: 45,
        poke_response: 22,
        group_stay_duration: 70,
        todo_complete_click: 88,
      },
    },
    phase3: {
      onboarding_steps: [100, 82, 71, 55, 48, 40, 36, 30, 28, 25, 22, 20],
      poke_funnel: { send: 80, respond: 35, enter: 18 },
      withdraw_reasons: { busy: 12, no_group: 8, other: 5 },
      page_views: { home: 400, todo: 320, group: 280, record: 90 },
    },
    summary: {
      personal_home_focus_seconds: 12600,
      personal_group_focus_seconds: 8400,
      group_focus_seconds: 6200,
      personal_focus_seconds: 21000,
      session_entry_count: 52,
      invitations_created_count: 18,
      invitations_responded_count: 11,
    },
  };

  const state = {
    manifest: null,
    catalog: null,
    snapshot: null,
    summary: {},
    prevSummary: {},
    currentDate: null,
    dateFrom: null,
    dateTo: null,
    gaEvents: null,
    gaMetrics: null,
    activityLogs: null,
    rangeDays: [],
    userRows: [],
    boardIds: [],
    charts: {},
    previewFull: false,
    catalogLens: "",
    cal: {
      open: false,
      viewYear: null,
      viewMonth: null,
      draftFrom: null,
      draftTo: null,
      /** 첫 클릭 후 끝날짜 대기 중 */
      pickingEnd: false,
    },
    /** 기간 카드: avg=일평균, sum=기간 합산 */
    rangeAgg: "avg",
    currentService: "home",
    exploreLoopStep: "focus",
    exploreTab: "compare",
    productEvents: [],
    editingEventId: null,
    changesFormOpen: false,
    changesCal: {
      viewYear: null,
      viewMonth: null,
      selectedDay: null,
    },
  };

  function todayKstIso() {
    const fmt = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Seoul",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    return fmt.format(new Date());
  }

  function addDaysIso(iso, delta) {
    const [y, m, d] = iso.split("-").map(Number);
    const dt = new Date(Date.UTC(y, m - 1, d + delta));
    return dt.toISOString().slice(0, 10);
  }

  function selectableMaxDate() {
    const yesterday = calendarYesterdayIso();
    const maxAvail =
      state.manifest?.max_date || latestDataDate() || state.manifest?.latest_date;
    if (!maxAvail) return yesterday;
    return maxAvail < yesterday ? maxAvail : yesterday;
  }

  function calendarYesterdayIso() {
    return addDaysIso(todayKstIso(), -1);
  }

  /** 캘린더 종료일 단축 — 선택 가능한 가장 최근 날 */
  function calendarEndShortcutDate() {
    return selectableMaxDate();
  }

  function calendarEndShortcutLabel(iso) {
    const end = iso || calendarEndShortcutDate();
    if (!end) return "최신일까지";
    if (end === todayKstIso()) return "오늘까지";
    if (end === calendarYesterdayIso()) return "어제까지";
    return `최신일까지 (${formatIsoDateShort(end)})`;
  }

  function focusCalendarOnDate(iso) {
    if (!iso) return;
    const [y, m] = iso.split("-").map(Number);
    state.cal.viewYear = y;
    state.cal.viewMonth = m - 1;
  }

  function applyCalEndShortcut() {
    const endIso = calendarEndShortcutDate();
    const startIso = state.cal.draftFrom;
    if (!endIso || !startIso) return;
    const from = startIso <= endIso ? startIso : endIso;
    const to = startIso <= endIso ? endIso : startIso;
    state.cal.draftFrom = from;
    state.cal.draftTo = to;
    state.cal.pickingEnd = false;
    focusCalendarOnDate(to);
    renderCalendar();
  }

  function latestDataDate() {
    return state.manifest?.latest_date || state.manifest?.max_date || null;
  }

  function isDataStale() {
    const latest = latestDataDate();
    if (!latest) return false;
    return latest < calendarYesterdayIso();
  }

  function dataStaleGapDays() {
    const latest = latestDataDate();
    if (!latest || !isDataStale()) return 0;
    let n = 0;
    let cur = addDaysIso(latest, 1);
    const end = calendarYesterdayIso();
    while (cur <= end) {
      n += 1;
      cur = addDaysIso(cur, 1);
    }
    return n;
  }

  function dataFreshnessNote() {
    if (!isDataStale()) return null;
    const latest = latestDataDate();
    return `수집 최신 ${formatIsoDateShort(latest)} · 어제(${formatIsoDateShort(
      calendarYesterdayIso()
    )})까지 ${dataStaleGapDays()}일 빠짐`;
  }

  function selectableMinDate() {
    if (state.manifest?.min_date) return state.manifest.min_date;
    const days = state.manifest?.db_days || state.manifest?.days || [];
    if (days.length) return days[days.length - 1].date;
    return state.manifest?.latest_date || selectableMaxDate();
  }

  function availableDateSet() {
    if (state.manifest?.available_dates?.length) {
      return new Set(state.manifest.available_dates);
    }
    const days = state.manifest?.db_days || state.manifest?.days || [];
    return new Set(days.map((d) => d.date));
  }

  function eachDateInclusive(from, to) {
    const out = [];
    if (!from || !to) return out;
    let cur = from <= to ? from : to;
    const end = from <= to ? to : from;
    while (cur <= end) {
      out.push(cur);
      cur = addDaysIso(cur, 1);
    }
    return out;
  }

  function selectionLabel(from, to) {
    if (!from) return "날짜 선택";
    if (!to || from === to) return from;
    return `${from} ~ ${to}`;
  }

  function formatIsoDateShort(iso) {
    if (!iso) return "";
    const [, m, d] = iso.split("-").map(Number);
    return `${m}/${d}`;
  }

  function homeMetaLabel() {
    const parts = [];
    const cmp = comparePeriodRange();
    const quick = detectQuickPeriod();
    const ctx = selectionAggContext();

    if (cmp) {
      const cmpFrom = formatIsoDateShort(cmp.from);
      const cmpTo = formatIsoDateShort(cmp.to);
      if (quick === "yesterday") {
        parts.push(`전일 ${cmpTo} 대비`);
      } else if (cmp.from === cmp.to) {
        parts.push(`직전 ${cmpTo} 대비`);
      } else {
        parts.push(`직전 ${cmpFrom}–${cmpTo} 대비`);
      }
    }

    if (ctx.range) {
      parts.push(
        ctx.periodSum
          ? "카드=기간 합 · 서비스 전체 · 1인 평균 아님"
          : `카드=일평균 · 매일 전체 합 ÷ ${ctx.dayCount}일 · 1인 평균 아님`
      );
    } else {
      parts.push("카드=그날 서비스 전체 합");
    }

    if (state.previewFull) parts.push("미리보기");
    const staleNote = dataFreshnessNote();
    if (staleNote) parts.unshift(staleNote);
    return parts.join(" · ");
  }

  function homeChartTrendLabel() {
    const n = homeTrendWindow().length;
    if (isRangeSelection()) return `${n}일 추세`;
    return `최근 ${n}일 추세`;
  }

  function clampSelectableRange(from, to) {
    const min = selectableMinDate();
    const max = selectableMaxDate();
    let a = from < min ? min : from;
    let b = to > max ? max : to;
    if (a > b) a = b;
    return [a, b];
  }

  /** 월~일 (월 시작) */
  function startOfWeekMonday(iso) {
    const [y, m, d] = iso.split("-").map(Number);
    const dt = new Date(Date.UTC(y, m - 1, d));
    const dow = dt.getUTCDay(); // 0=일
    const delta = dow === 0 ? -6 : 1 - dow;
    return addDaysIso(iso, delta);
  }

  function startOfMonthIso(iso) {
    return `${iso.slice(0, 7)}-01`;
  }

  function quickPeriodRange(period) {
    const end = selectableMaxDate();
    if (period === "yesterday") return clampSelectableRange(end, end);
    if (period === "week") {
      // 이번 주 (월~선택 가능 끝일)
      return clampSelectableRange(startOfWeekMonday(end), end);
    }
    if (period === "month") {
      return clampSelectableRange(startOfMonthIso(end), end);
    }
    return [state.dateFrom, state.dateTo];
  }

  function detectQuickPeriod() {
    const from = state.dateFrom;
    const to = state.dateTo;
    if (!from || !to) return null;
    for (const key of ["yesterday", "week", "month"]) {
      const [a, b] = quickPeriodRange(key);
      if (from === a && to === b) return key;
    }
    return null;
  }

  function syncPeriodChips() {
    const active = detectQuickPeriod();
    document
      .querySelectorAll(
        "#homePeriodChips .period-chip, #globalPeriodChips .period-chip"
      )
      .forEach((btn) => {
        btn.classList.toggle("active", btn.dataset.period === active);
      });
    document
      .querySelectorAll(
        '#homePeriodChips [data-period="yesterday"], #globalPeriodChips [data-period="yesterday"]'
      )
      .forEach((yesterdayBtn) => {
        const stale = isDataStale();
        yesterdayBtn.textContent = stale ? "최신일" : "어제";
        yesterdayBtn.title = stale
          ? `DB/GA 수집 최신 ${latestDataDate() || ""} · 이후 미수집`
          : "";
      });
  }

  function fmtDur(seconds) {
    const s = Math.max(0, Number(seconds) || 0);
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    if (h) return `${h}시간 ${m}분`;
    if (m) return `${m}분`;
    return `${s}초`;
  }

  function fmtNum(n) {
    if (n === null || n === undefined || Number.isNaN(n)) return null;
    return new Intl.NumberFormat("ko-KR").format(Number(n));
  }

  function fmtPct(n) {
    if (n == null) return null;
    return `${(Number(n) * 100).toFixed(1)}%`;
  }

  function getPrevSummary(date) {
    const days = [...(state.manifest?.db_days || [])].sort((a, b) =>
      a.date.localeCompare(b.date)
    );
    const idx = days.findIndex((d) => d.date === date);
    if (idx <= 0) return {};
    return days[idx - 1].summary || {};
  }

  function calcDelta(curr, prev) {
    if (curr == null || Number.isNaN(Number(curr))) return null;
    const c = Number(curr);
    const p = prev == null ? null : Number(prev);
    if (p == null || Number.isNaN(p)) return null;
    if (p === 0) {
      if (c === 0) return { text: "0%", tone: "flat" };
      return { text: "신규", tone: "up" };
    }
    const pct = ((c - p) / Math.abs(p)) * 100;
    const sign = pct > 0 ? "+" : "";
    return {
      text: `${sign}${pct.toFixed(1)}%`,
      tone: pct > 0 ? "up" : pct < 0 ? "down" : "flat",
    };
  }

  function deltaFromKeys(currSummary, prevSummary, keys) {
    const sumKeys = (s, ks) =>
      ks.reduce((a, k) => a + (Number(s?.[k]) || 0), 0);
    const keyList = Array.isArray(keys) ? keys : [keys];
    return calcDelta(sumKeys(currSummary, keyList), sumKeys(prevSummary, keyList));
  }

  function setStatus(msg, isError = false) {
    const el = $("status");
    if (!el) return;
    el.textContent = msg;
    el.style.color = isError ? "#a33a1b" : "";
    el.classList.toggle("hidden", !msg);
  }

  function destroyChart(key) {
    if (state.charts[key]) {
      state.charts[key].destroy();
      state.charts[key] = null;
    }
  }

  async function loadJson(path) {
    const res = await fetch(path, { cache: "no-store" });
    if (!res.ok) throw new Error(`로드 실패: ${path}`);
    return res.json();
  }

  function escapeHtml(t) {
    return String(t)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;");
  }

  function newProductEventId() {
    return `evt-${Date.now().toString(36)}`;
  }

  function normalizeProductEvent(raw) {
    const type = PRODUCT_EVENT_TYPES[raw?.type] ? raw.type : "feature";
    const repos = Array.isArray(raw?.repos)
      ? raw.repos.map(String)
      : String(raw?.repos || "")
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
    const affects = Array.isArray(raw?.affects)
      ? raw.affects.map(String)
      : [];
    return {
      id: String(raw?.id || newProductEventId()),
      date: String(raw?.date || "").slice(0, 10),
      type,
      title: String(raw?.title || "").trim(),
      note: String(raw?.note || "").trim(),
      repos,
      affects,
      url: String(raw?.url || "").trim(),
    };
  }

  function sortProductEvents(a, b) {
    return b.date.localeCompare(a.date) || a.title.localeCompare(b.title);
  }

  function bundledProductEvents() {
    return (state.manifest?.product_events || []).map(normalizeProductEvent);
  }

  function saveProductEventsLocal() {
    localStorage.setItem(
      PRODUCT_EVENTS_KEY,
      JSON.stringify({ schema_version: 1, events: state.productEvents })
    );
  }

  function syncBundledProductEvents(bundled) {
    const ids = new Set(state.productEvents.map((e) => e.id));
    for (const b of bundled) {
      if (!ids.has(b.id)) state.productEvents.push(b);
    }
    state.productEvents.sort(sortProductEvents);
  }

  function initProductEvents() {
    const bundled = bundledProductEvents();
    try {
      const raw = localStorage.getItem(PRODUCT_EVENTS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        state.productEvents = (parsed.events || []).map(normalizeProductEvent);
        syncBundledProductEvents(bundled);
      } else {
        state.productEvents = bundled.slice();
        saveProductEventsLocal();
      }
    } catch (_) {
      state.productEvents = bundled.slice();
    }
    state.productEvents.sort(sortProductEvents);
    registerProductEventChartPlugin();
    populateChangesFormOptions();
  }

  function eventsInRange(from, to) {
    if (!from || !to) return [];
    return state.productEvents.filter((e) => e.date >= from && e.date <= to);
  }

  function eventsForDates(dates) {
    const set = new Set(dates || []);
    return state.productEvents.filter((e) => set.has(e.date));
  }

  function productEventTypeLabel(type) {
    return PRODUCT_EVENT_TYPES[type]?.label || type;
  }

  function releaseDayTipText(events) {
    if (!events?.length) return "";
    return events
      .map((e) => `${productEventTypeLabel(e.type)} · ${e.title}`)
      .join(" / ");
  }

  function applyReleaseDayMarker(btn, events) {
    if (!events?.length) return;
    btn.classList.add("has-release");
    const tip = releaseDayTipText(events);
    btn.title = tip;
    const tipEl = document.createElement("span");
    tipEl.className = "cal-day-tip";
    tipEl.setAttribute("role", "tooltip");
    tipEl.textContent = tip;
    btn.appendChild(tipEl);
  }

  function productEventTypeColor(type) {
    return PRODUCT_EVENT_TYPES[type]?.color || "#fa5332";
  }

  function releaseChipHtml(ev, opts = {}) {
    const color = productEventTypeColor(ev.type);
    const showDate = opts.showDate !== false;
    const link = ev.url
      ? `<a href="${escapeHtml(ev.url)}" target="_blank" rel="noopener">${escapeHtml(
          ev.title
        )}</a>`
      : escapeHtml(ev.title);
    return `<li class="release-chip" title="${escapeHtml(
      [ev.note, ev.repos?.join(", ")].filter(Boolean).join(" · ")
    )}">
      <span class="release-chip__dot" style="background:${color}"></span>
      ${showDate ? `<span class="release-chip__date">${escapeHtml(ev.date.slice(5))}</span>` : ""}
      <span class="release-chip__type">${escapeHtml(productEventTypeLabel(ev.type))}</span>
      ${link}
    </li>`;
  }

  function renderHomeReleaseStrip() {
    const el = $("homeReleaseStrip");
    if (!el) return;
    const from = state.dateFrom;
    const to = state.dateTo || from;
    const items = eventsInRange(from, to);
    if (!items.length) {
      el.classList.add("hidden");
      el.innerHTML = "";
      return;
    }
    el.classList.remove("hidden");
    el.innerHTML = `<span class="release-strip__label">개발 변경 ${items.length}건</span>
      <ul class="release-strip__items">${items.map((e) => releaseChipHtml(e)).join("")}</ul>`;
  }

  function renderHomeChartReleaseNote(trendDates, markers) {
    const note = $("homeChartReleaseNote");
    if (!note) return;
    if (!markers.length) {
      note.classList.add("hidden");
      note.textContent = "";
      return;
    }
    note.classList.remove("hidden");
    note.textContent = `추세 차트 점선 = 해당일 개발 변경 (${markers.length}건)`;
  }

  let productEventChartPluginRegistered = false;
  function registerProductEventChartPlugin() {
    if (productEventChartPluginRegistered || typeof Chart === "undefined") return;
    productEventChartPluginRegistered = true;
    Chart.register({
      id: "productEventMarkers",
      afterDraw(chart, _args, opts) {
        const dates = opts?.dates || [];
        const events = opts?.events || [];
        if (!events.length || !chart.chartArea) return;
        const x = chart.scales?.x;
        if (!x) return;
        const { ctx, chartArea } = chart;
        ctx.save();
        events.forEach((ev) => {
          const idx = dates.indexOf(ev.date);
          if (idx < 0) return;
          const xPos = x.getPixelForValue(idx);
          ctx.strokeStyle = productEventTypeColor(ev.type);
          ctx.globalAlpha = 0.75;
          ctx.lineWidth = 1;
          ctx.setLineDash([4, 4]);
          ctx.beginPath();
          ctx.moveTo(xPos, chartArea.top);
          ctx.lineTo(xPos, chartArea.bottom);
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.globalAlpha = 1;
        });
        ctx.restore();
      },
    });
  }

  function populateChangesFormOptions() {
    const typeSel = $("changesType");
    if (typeSel && !typeSel.options.length) {
      typeSel.innerHTML = Object.entries(PRODUCT_EVENT_TYPES)
        .map(
          ([k, v]) =>
            `<option value="${escapeHtml(k)}">${escapeHtml(v.label)}</option>`
        )
        .join("");
    }
    const affectsEl = $("changesAffects");
    if (affectsEl && !affectsEl.innerHTML) {
      affectsEl.innerHTML = PRODUCT_AFFECTS_OPTS.map(
        (a) =>
          `<label><input type="checkbox" name="affects" value="${escapeHtml(
            a.id
          )}" /> ${escapeHtml(a.label)}</label>`
      ).join("");
    }
  }

  function resetChangesForm(closePanel = false) {
    state.editingEventId = null;
    const form = $("changesForm");
    form?.reset();
    if ($("changesEditId")) $("changesEditId").value = "";
    if ($("changesSubmitBtn")) $("changesSubmitBtn").textContent = "추가";
    $("changesCancelEditBtn")?.classList.add("hidden");
    if ($("changesDate") && !$("changesDate").value) {
      $("changesDate").value = state.dateTo || state.currentDate || "";
    }
    if (closePanel) setChangesFormOpen(false);
  }

  function readChangesForm() {
    const affects = [];
    document
      .querySelectorAll('#changesAffects input[name="affects"]:checked')
      .forEach((el) => affects.push(el.value));
    return normalizeProductEvent({
      id: $("changesEditId")?.value || newProductEventId(),
      date: $("changesDate")?.value,
      type: $("changesType")?.value,
      title: $("changesTitle")?.value,
      note: $("changesNote")?.value,
      repos: $("changesRepos")?.value,
      affects,
      url: $("changesUrl")?.value,
    });
  }

  function fillChangesForm(ev) {
    state.editingEventId = ev.id;
    setChangesFormOpen(true);
    if ($("changesEditId")) $("changesEditId").value = ev.id;
    if ($("changesDate")) $("changesDate").value = ev.date;
    if ($("changesType")) $("changesType").value = ev.type;
    if ($("changesTitle")) $("changesTitle").value = ev.title;
    if ($("changesNote")) $("changesNote").value = ev.note || "";
    if ($("changesRepos")) $("changesRepos").value = (ev.repos || []).join(", ");
    if ($("changesUrl")) $("changesUrl").value = ev.url || "";
    document
      .querySelectorAll('#changesAffects input[name="affects"]')
      .forEach((el) => {
        el.checked = (ev.affects || []).includes(el.value);
      });
    if ($("changesSubmitBtn")) $("changesSubmitBtn").textContent = "저장";
    $("changesCancelEditBtn")?.classList.remove("hidden");
  }

  function upsertProductEvent(ev) {
    const idx = state.productEvents.findIndex((e) => e.id === ev.id);
    if (idx >= 0) state.productEvents[idx] = ev;
    else state.productEvents.push(ev);
    state.productEvents.sort(sortProductEvents);
    saveProductEventsLocal();
  }

  function deleteProductEvent(id) {
    state.productEvents = state.productEvents.filter((e) => e.id !== id);
    saveProductEventsLocal();
  }

  function setChangesFormOpen(open) {
    state.changesFormOpen = !!open;
    const wrap = $("changesFormWrap");
    const btn = $("changesToggleForm");
    const label = $("changesToggleFormLabel");
    if (wrap) wrap.classList.toggle("hidden", !state.changesFormOpen);
    if (btn) btn.setAttribute("aria-expanded", state.changesFormOpen ? "true" : "false");
    if (label) {
      label.textContent = state.editingEventId
        ? "변경 수정"
        : state.changesFormOpen
          ? "새 변경 추가"
          : "새 변경 추가";
    }
  }

  function changeEventMetaLine(ev) {
    const affects = (ev.affects || [])
      .map((a) => PRODUCT_AFFECTS_OPTS.find((o) => o.id === a)?.label || a)
      .join(" · ");
    const repos = (ev.repos || []).join(", ");
    return [repos, affects].filter(Boolean).join(" · ");
  }

  function renderChangeItemHtml(ev, opts = {}) {
    const color = productEventTypeColor(ev.type);
    const meta = changeEventMetaLine(ev);
    const showActions = opts.actions !== false;
    const link = ev.url
      ? `<p class="change-item__meta"><a href="${escapeHtml(
          ev.url
        )}" target="_blank" rel="noopener">GitHub · PR/커밋</a></p>`
      : "";
    const actions = showActions
      ? `<div class="change-item__actions">
            <button type="button" data-change-edit="${escapeHtml(ev.id)}">수정</button>
            <button type="button" data-change-del="${escapeHtml(ev.id)}">삭제</button>
          </div>`
      : "";
    return `<li class="change-item${opts.highlight ? " is-visible" : ""}" data-id="${escapeHtml(
      ev.id
    )}" data-date="${escapeHtml(ev.date)}">
          <div class="change-item__main">
            <div class="change-item__head">
              <span class="change-type"><span class="change-type__dot" style="background:${color}"></span>${escapeHtml(
                productEventTypeLabel(ev.type)
              )}</span>
              <span class="change-item__meta">${escapeHtml(ev.date)}</span>
              <h3 class="change-item__title">${escapeHtml(ev.title)}</h3>
            </div>
            ${
              ev.note
                ? `<p class="change-item__note">${escapeHtml(ev.note)}</p>`
                : ""
            }
            ${meta ? `<p class="change-item__meta">${escapeHtml(meta)}</p>` : ""}
            ${link}
          </div>
          ${actions}
        </li>`;
  }

  function renderTimelineItemHtml(ev) {
    const color = productEventTypeColor(ev.type);
    const meta = changeEventMetaLine(ev);
    const link = ev.url
      ? `<a href="${escapeHtml(ev.url)}" target="_blank" rel="noopener">링크</a>`
      : "";
    const metaLine = [meta, link].filter(Boolean).join(" · ");
    return `<li class="change-timeline__item" style="--tl-dot:${color}">
      <div class="change-timeline__card">
        <div class="change-timeline__card-head">
          <span class="change-type"><span class="change-type__dot" style="background:${color}"></span>${escapeHtml(
            productEventTypeLabel(ev.type)
          )}</span>
          <span class="change-timeline__date">${escapeHtml(ev.date)}</span>
        </div>
        <h3 class="change-timeline__title">${escapeHtml(ev.title)}</h3>
        ${ev.note ? `<p class="change-timeline__note">${escapeHtml(ev.note)}</p>` : ""}
        ${metaLine ? `<p class="change-timeline__meta">${metaLine}</p>` : ""}
      </div>
    </li>`;
  }

  function groupEventsByMonth(events) {
    const groups = new Map();
    for (const ev of events) {
      const key = ev.date.slice(0, 7);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(ev);
    }
    return [...groups.entries()].sort((a, b) => b[0].localeCompare(a[0]));
  }

  function formatMonthKey(key) {
    const [y, m] = key.split("-").map(Number);
    return `${y}년 ${m}월`;
  }

  function initChangesCalView() {
    if (state.changesCal.viewYear != null) return;
    const ref =
      state.productEvents[0]?.date ||
      state.dateTo ||
      state.manifest?.latest_date ||
      todayKstIso();
    const [y, m] = ref.split("-").map(Number);
    state.changesCal.viewYear = y;
    state.changesCal.viewMonth = m - 1;
  }

  function eventsOnDate(iso) {
    return state.productEvents.filter((e) => e.date === iso);
  }

  function renderChangesTimeline() {
    const el = $("changesTimeline");
    if (!el) return;
    if (!state.productEvents.length) {
      el.innerHTML =
        '<p class="text-sm text-mg-500">등록된 변경이 없습니다. 「새 변경 추가」로 기록하세요.</p>';
      return;
    }
    el.innerHTML = groupEventsByMonth(state.productEvents)
      .map(
        ([key, items]) =>
          `<div class="change-timeline__month">
            <h3 class="change-timeline__month-title">${escapeHtml(formatMonthKey(key))}</h3>
            <ul class="change-timeline__list">${items.map(renderTimelineItemHtml).join("")}</ul>
          </div>`
      )
      .join("");
  }

  function renderChangesCalendar() {
    initChangesCalView();
    const grid = $("changesCalGrid");
    const title = $("changesCalTitle");
    const detail = $("changesCalDetail");
    if (!grid || !title) return;
    const y = state.changesCal.viewYear;
    const m = state.changesCal.viewMonth;
    title.textContent = `${y}년 ${m + 1}월`;

    const first = new Date(y, m, 1);
    const startPad = first.getDay();
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    grid.innerHTML = "";

    for (let i = 0; i < startPad; i++) {
      grid.appendChild(document.createElement("span"));
    }
    for (let day = 1; day <= daysInMonth; day++) {
      const iso = `${y}-${String(m + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = String(day);
      btn.dataset.date = iso;
      applyReleaseDayMarker(btn, eventsOnDate(iso));
      if (iso === state.changesCal.selectedDay) btn.classList.add("is-selected");
      btn.addEventListener("click", () => {
        state.changesCal.selectedDay = iso;
        renderChangesCalendar();
        renderChangesCalDetail(iso);
        highlightChangesList(iso);
      });
      grid.appendChild(btn);
    }

    if (detail && !state.changesCal.selectedDay) {
      detail.innerHTML =
        '<p class="text-sm text-mg-500">날짜를 클릭하면 해당일 변경을 봅니다.</p>';
    }
  }

  function renderChangesCalDetail(iso) {
    const detail = $("changesCalDetail");
    if (!detail) return;
    const items = eventsOnDate(iso);
    if (!items.length) {
      detail.innerHTML = `<p class="text-sm text-mg-500">${escapeHtml(
        iso
      )} — 등록된 변경 없음</p>`;
      return;
    }
    detail.innerHTML = `<p class="text-sm font-medium text-mg-black mb-2">${escapeHtml(
      iso
    )} · ${items.length}건</p>
      <ul class="change-list">${items.map((ev) => renderChangeItemHtml(ev, { actions: false })).join("")}</ul>`;
  }

  function highlightChangesList(iso) {
    const list = $("changesList");
    if (!list) return;
    list.classList.add("is-filtered");
    list.querySelectorAll(".change-item").forEach((li) => {
      li.classList.toggle("is-visible", li.dataset.date === iso);
    });
    const first = list.querySelector(`.change-item[data-date="${iso}"]`);
    first?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }

  function clearChangesListFilter() {
    const list = $("changesList");
    if (!list) return;
    list.classList.remove("is-filtered");
    list.querySelectorAll(".change-item").forEach((li) => {
      li.classList.remove("is-visible");
    });
  }

  function renderChanges() {
    populateChangesFormOptions();
    setChangesFormOpen(state.changesFormOpen || !!state.editingEventId);

    const meta = $("changesListMeta");
    if (meta) {
      meta.textContent = `총 ${state.productEvents.length}건 · 브라우저 저장`;
    }

    renderChangesTimeline();
    renderChangesCalendar();
    if (state.changesCal.selectedDay) {
      renderChangesCalDetail(state.changesCal.selectedDay);
      highlightChangesList(state.changesCal.selectedDay);
    } else {
      clearChangesListFilter();
    }

    const list = $("changesList");
    if (!list) return;
    if (!state.productEvents.length) {
      list.innerHTML =
        '<li class="change-item"><p class="change-item__meta">등록된 변경이 없습니다.</p></li>';
      return;
    }
    list.innerHTML = state.productEvents
      .map((ev) => renderChangeItemHtml(ev))
      .join("");

    renderOpsQuality();
    renderGroupLedger();
  }

  function refreshProductEventViews() {
    renderChanges();
    if (state.dateFrom && state.dateTo) {
      renderHome(selectionLabel(state.dateFrom, state.dateTo));
    }
    renderCalendar();
  }

  function exportProductEventsJson() {
    const payload = { schema_version: 1, events: state.productEvents };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "product_events.json";
    a.click();
    URL.revokeObjectURL(a.href);
    setStatus("변경 기록 JSON 내보냄");
  }

  function mergeImportedProductEvents(items) {
    const byId = new Map(state.productEvents.map((e) => [e.id, e]));
    for (const raw of items) {
      const ev = normalizeProductEvent(raw);
      if (!ev.date || !ev.title) continue;
      byId.set(ev.id, ev);
    }
    state.productEvents = [...byId.values()].sort(sortProductEvents);
    saveProductEventsLocal();
  }

  const FILTERABLE_VIEWS = new Set(["svc", "journey", "explore", "ops"]);

  function syncHeaderChrome(name) {
    const compact = name !== "home";
    document.body.classList.toggle("view-compact", compact);
    $("headerContext")?.classList.toggle(
      "hidden",
      !FILTERABLE_VIEWS.has(name)
    );
  }

  function updateViewContextMeta(name, svcMeta) {
    const el = $("viewContextMeta");
    if (!el || !FILTERABLE_VIEWS.has(name)) return;
    const parts = [];
    if (name === "svc" && svcMeta?.desc) parts.push(svcMeta.desc);
    if (name === "journey") parts.push("유입→잔존 · 빈 구간은 로그 보강 필요");
    if (name === "ops") parts.push("배포·기능 이벤트 · JSON 공유 · 수집 품질");
    parts.push(homeMetaLabel());
    el.textContent = parts.filter(Boolean).join(" · ");
  }

  function switchView(name, opts = {}) {
    const svc =
      name === "svc" ? opts.service || state.currentService || "home" : null;
    if (svc) state.currentService = svc;
    const svcMeta = svc ? SERVICE_META[svc] : null;
    const meta = VIEW_META[name] || VIEW_META.home;
    document.querySelectorAll(".side-link[data-view]").forEach((b) => {
      if (name === "svc") {
        b.classList.toggle(
          "active",
          b.dataset.view === "svc" && b.dataset.service === svc
        );
      } else {
        b.classList.toggle(
          "active",
          name !== "board" && b.dataset.view === name
        );
      }
    });
    document.querySelectorAll(".side-link.board-link").forEach((b) => {
      b.classList.toggle(
        "active",
        name === "board" && b.dataset.boardId === opts.boardId
      );
    });
    document.querySelectorAll(".view").forEach((v) => {
      const viewKey = name === "ops" ? "changes" : name;
      v.classList.toggle("active", v.id === `view-${viewKey}`);
    });
    if ($("viewEyebrow")) {
      $("viewEyebrow").textContent = svcMeta ? "서비스" : meta.eyebrow;
    }
    if ($("viewTitle")) {
      $("viewTitle").textContent =
        name === "board" && opts.title
          ? opts.title
          : svcMeta
            ? svcMeta.title
            : meta.title;
    }
    if ($("viewDesc")) {
      $("viewDesc").textContent = svcMeta ? svcMeta.desc : meta.desc;
    }
    syncHeaderChrome(name);
    updateViewContextMeta(name, svcMeta);
    syncPeriodChips();
    syncRangeAggUI();
    if (name === "svc") renderService(svc);
    if (name === "journey") renderFunnel();
    if (name === "explore") setExploreTab(state.exploreTab || "compare");
    if (name === "changes" || name === "ops") {
      populateChangesFormOptions();
      if (!$("changesEditId")?.value && $("changesDate")) {
        $("changesDate").value = state.dateTo || state.currentDate || "";
      }
      renderChanges();
    }
    closeMobileSidebar();
  }

  function closeMobileSidebar() {
    document.body.classList.remove("sidebar-open");
    const bd = $("drawerBackdrop");
    if (bd) bd.hidden = true;
  }

  function openMobileSidebar() {
    document.body.classList.add("sidebar-open");
    const bd = $("drawerBackdrop");
    if (bd) bd.hidden = false;
  }

  function loadAllBoards() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    } catch (_) {
      return {};
    }
  }

  function persistAllBoards(all) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  }

  function listSavedBoardEntries() {
    const all = loadAllBoards();
    return Object.entries(all)
      .filter(([k, v]) => k !== "current" && v && Array.isArray(v.ids))
      .map(([id, v]) => ({ id, ...v }))
      .sort((a, b) =>
        String(b.saved_at || "").localeCompare(String(a.saved_at || ""))
      );
  }

  function renderSavedBoardsNav() {
    const el = $("savedBoardsList");
    if (!el) return;
    const boards = listSavedBoardEntries();
    if (!boards.length) {
      el.innerHTML =
        '<p class="muted small" style="padding:4px 10px">저장된 보드 없음</p>';
      return;
    }
    el.innerHTML = boards
      .map(
        (b) =>
          `<button type="button" class="side-link board-link" data-board-id="${escapeHtml(
            b.id
          )}"><span class="board-name">${escapeHtml(
            b.title || b.id
          )}</span><span class="hint">${(b.ids || []).length}</span></button>`
      )
      .join("");
    el.querySelectorAll(".board-link").forEach((btn) => {
      btn.addEventListener("click", () => openSavedBoard(btn.dataset.boardId));
    });
  }

  function openSavedBoard(boardId) {
    const all = loadAllBoards();
    const board = all[boardId];
    if (!board) return;
    state.boardIds = [...(board.ids || [])];
    state.activeBoardId = boardId;
    if ($("boardTitle")) $("boardTitle").value = board.title || boardId;
    applyComposeFilters(board.lens || "", board.journey || "");
    renderBoard();
    renderBoardViewOnly();
    if ($("boardViewTitle")) {
      $("boardViewTitle").textContent = board.title || boardId;
    }
    switchView("board", { boardId, title: board.title || boardId });
  }

  function renderBoardViewOnly() {
    const grid = $("boardViewGrid");
    if (!grid) return;
    const byId = new Map(catalogItems().map((i) => [i.id, i]));
    if (!state.boardIds.length) {
      grid.innerHTML = '<p class="empty">비어 있음</p>';
      return;
    }
    grid.innerHTML = state.boardIds
      .map((id) => {
        const item = byId.get(id);
        if (!item) return "";
        const v = resolveValue(item);
        const tip = metricHelp(item.name, item);
        return `<article class="metric-card board-card" data-tip="${escapeHtml(
          tip
        )}" title="${escapeHtml(tip)}">
          <div class="metric-card__label">${escapeHtml(item.name)}</div>
          <div class="metric-card__value ${
          v.status === "ok" ? "" : "is-muted"
        }">${escapeHtml(v.display)}</div>
          <div class="metric-card__footer">
            <span class="metric-card__chip ${
          v.status === "ok" ? "db" : "phase2"
        }">${escapeHtml(v.chip)}</span>
            ${
              v.delta
                ? `<span class="metric-card__delta ${v.deltaTone || "flat"}">${escapeHtml(
                    v.delta
                  )}</span>`
                : ""
            }
            <span class="metric-card__aux">${escapeHtml(
              JOURNEY_LABEL[item.journey] || item.category || ""
            )}</span>
          </div>
        </article>`;
      })
      .join("");
  }

  function updateBoardMeta() {
    const meta = $("boardMeta");
    if (!meta) return;
    meta.textContent = `지표 ${(state.boardIds || []).length}개 · schema v2 · JSON으로 팀 공유`;
  }

  function slugifyBoardId(title) {
    const base = (title || "board")
      .trim()
      .replace(/\s+/g, "-")
      .slice(0, 40);
    return `${base}-${Date.now().toString(36)}`;
  }

  function gaReady() {
    if (state.previewFull) return true;
    const m = state.gaMetrics?.metrics || {};
    const st = state.gaMetrics?.status;
    const ok = st === "ok" || st === "manual_ok";
    return ok && (m.new_users != null || m.active_users != null || m.sessions != null);
  }

  function gaMetricsView() {
    if (state.previewFull) return { ...PREVIEW.ga, _preview: true };
    const m = state.gaMetrics?.metrics || {};
    return {
      new_users: m.new_users,
      active_users: m.active_users,
      sessions: m.sessions,
      engaged_sessions: m.engaged_sessions,
      average_engagement_time_sec: m.average_engagement_time_sec,
      bounce_rate: m.bounce_rate,
      engagement_rate: m.engagement_rate,
      sessions_per_user: m.sessions_per_user,
      screen_page_views: m.screen_page_views,
      event_count_total: m.event_count_total,
      user_engagement_duration_sec: m.user_engagement_duration_sec,
      retention_d1: m.retention_d1,
      retention_d7: m.retention_d7,
      retention_d30: m.retention_d30,
      _preview: false,
      _manual: state.gaMetrics?.source === "ga4_manual",
    };
  }

  function eventCount(name) {
    if (state.previewFull) return PREVIEW.ga.event_counts[name] ?? null;
    const ev = (state.gaEvents?.events || []).find((e) => e.event_name === name);
    return ev?.count ?? null;
  }

  function summaryView() {
    const base = state.summary || {};
    if (!state.previewFull) return base;
    return { ...base, ...PREVIEW.summary };
  }

  function inviteAcceptRate(summary) {
    const created = Number(summary.invitations_created_count) || 0;
    const responded = Number(summary.invitations_responded_count) || 0;
    if (!created && !responded) return null;
    // 응답/생성 (수락만 분리 전)
    if (!created) return responded ? 1 : 0;
    return responded / created;
  }

  function groupFocusShare(summary) {
    const personal = Number(summary.personal_focus_seconds) || 0;
    const group = Number(summary.group_focus_seconds) || 0;
    const total = personal + group;
    if (!total) return null;
    return group / total;
  }

  /** 그룹방 체류(초) — DB 퇴장 이력 없으면 null. GA는 이벤트 건수만 있어 시간 대용 불가. */
  function groupStaySecondsAvailable() {
    return null;
  }

  function timerCompleteRate() {
    const starts = eventCount("timer_start");
    const completes = eventCount("timer_complete");
    if (starts == null && completes == null) return null;
    if (!starts) return completes ? 1 : null;
    return completes / starts;
  }

  function focusPerEntryMin(summary) {
    const focus =
      (Number(summary.personal_focus_seconds) || 0) +
      (Number(summary.group_focus_seconds) || 0);
    const entries = Number(summary.session_entry_count) || 0;
    if (!entries || !focus) return null;
    return focus / 60 / entries;
  }

  function isRangeSelection() {
    return (state.rangeDays?.length || 1) > 1;
  }

  function selectionDayCount() {
    return Math.max(1, state.rangeDays?.length || 1);
  }

  function usePeriodSum() {
    return isRangeSelection() && state.rangeAgg === "sum";
  }

  function selectionAggContext() {
    const dayCount = selectionDayCount();
    return {
      dayCount,
      range: dayCount > 1,
      periodSum: usePeriodSum(),
    };
  }

  function scaleCount(n) {
    const { range, periodSum, dayCount } = selectionAggContext();
    const num = Number(n) || 0;
    return range && !periodSum ? num / dayCount : num;
  }

  function fmtScaledNum(n) {
    if (n == null || Number.isNaN(Number(n))) return "—";
    const { range, periodSum, dayCount } = selectionAggContext();
    const v = range && !periodSum ? Number(n) / dayCount : Number(n);
    return range && !periodSum
      ? String(Math.round(v))
      : fmtNum(Math.round(v)) || "0";
  }

  /** KPI 집계 방식 — 카드 짧은 라벨 + 호버(집계 설명) */
  const AGG_KIND = {
    db_duration_sum: {
      short: (ctx) =>
        ctx.range ? (ctx.periodSum ? "기간 합" : "일평균") : "전체 합",
      tip: (ctx) => {
        if (!ctx.range) {
          return "집계: 그날 모든 세션 시간의 서비스 전체 합 · 1인당 평균 아님";
        }
        if (ctx.periodSum) {
          return "집계: 선택 기간 모든 세션 시간 합 · 1인당 평균 아님";
        }
        return `집계: 매일 서비스 전체 합 ÷ ${ctx.dayCount}일 · 1인당 평균 아님`;
      },
    },
    ga_users: {
      short: (ctx) =>
        ctx.range ? (ctx.periodSum ? "기간 합" : "일평균") : "사용자 수",
      tip: (ctx) => {
        if (!ctx.range) {
          return "집계: 그날 방문·신규 사용자 수(DAU 등) · 1인당 평균 아님";
        }
        if (ctx.periodSum) {
          return "집계: 일별 사용자 수 합 · 중복 포함 · 1인당 평균 아님";
        }
        return `집계: 일별 사용자 수 ÷ ${ctx.dayCount}일 · 1인당 평균 아님`;
      },
    },
    ga_event_ratio: {
      short: () => "이벤트 비율",
      tip: () =>
        "집계: GA 이벤트 건수 비율 (complete ÷ start) · 1인당 평균 아님",
    },
    db_count_sum: {
      short: (ctx) =>
        ctx.range ? (ctx.periodSum ? "기간 합" : "일평균") : "건수 합",
      tip: (ctx) => {
        if (!ctx.range) {
          return "집계: 그날 발생 건수의 서비스 전체 합 · 1인당 평균 아님";
        }
        if (ctx.periodSum) {
          return "집계: 선택 기간 건수 합 · 1인당 평균 아님";
        }
        return `집계: 매일 건수 합 ÷ ${ctx.dayCount}일 · 1인당 평균 아님`;
      },
    },
    share_ratio: {
      short: () => "구성 비율",
      tip: () => "집계: 선택 값 ÷ 기준 값 (비율)\n평균값 아님",
    },
  };

  const METRIC_AGG_BY_LABEL = {
    타이머: "db_duration_sum",
    "홈에서 시작": "db_duration_sum",
    "그룹에서 시작": "db_duration_sum",
    "그룹 공유": "db_duration_sum",
    "개인 집중": "db_duration_sum",
    "그룹 타이머": "db_duration_sum",
    "그룹 집중": "db_duration_sum",
    "총 집중": "db_duration_sum",
    활성: "ga_users",
    신규: "ga_users",
    "신규 사용자": "ga_users",
    "타이머 완료율": "ga_event_ratio",
    완료율: "ga_event_ratio",
    입장: "db_count_sum",
    "그룹 입장": "db_count_sum",
    생성: "db_count_sum",
    응답: "db_count_sum",
    "개인 세션": "db_count_sum",
    "그룹시작 비중": "share_ratio",
    "그룹 타이머 비중": "share_ratio",
    "응답률": "share_ratio",
    "초대 응답률": "share_ratio",
    "활성(DAU)": "ga_users",
    "참여 세션": "db_count_sum",
    "페이지뷰": "db_count_sum",
    "이벤트 총수": "db_count_sum",
    "참여율": "share_ratio",
    "이탈률": "share_ratio",
    "그룹 세션(체류)": "db_duration_sum",
    세션: "db_count_sum",
  };

  function metricDetail(label, item) {
    if (item?.help) return String(item.help);
    if (item?.id && HELP_BY_ID[item.id]) return HELP_BY_ID[item.id];
    if (label && METRIC_HELP[label]) return METRIC_HELP[label];
    if (item?.subcategory) {
      const t = `${item.category || ""} ${item.subcategory}`.trim();
      return t.length > 20 ? t.slice(0, 20) : t;
    }
    return "";
  }

  function buildMetricTip(item) {
    const label = item?.label || item?.name || "";
    const aggKind = item?.aggKind || METRIC_AGG_BY_LABEL[label];
    const ctx = selectionAggContext();
    const parts = [];
    if (aggKind && AGG_KIND[aggKind]) {
      parts.push(AGG_KIND[aggKind].tip(ctx));
    }
    const detail = metricDetail(label, item);
    if (detail) {
      const aggLine = parts[0] || "";
      if (!aggLine || !aggLine.includes(detail.slice(0, 12))) {
        parts.push(detail);
      }
    }
    if (!parts.length) return "기준일 수집 지표";
    return parts.join(" · ");
  }

  function metricHowLabel(item) {
    if (item?.how) return item.how;
    const kind = item?.aggKind || METRIC_AGG_BY_LABEL[item?.label || item?.name || ""];
    if (!kind || !AGG_KIND[kind]) return "";
    return AGG_KIND[kind].short(selectionAggContext());
  }

  function syncRangeAggUI() {
    const appliedMulti = !!(
      state.dateFrom &&
      state.dateTo &&
      state.dateFrom !== state.dateTo
    );
    for (const wrapId of ["homeAggChipsWrap", "globalAggChipsWrap"]) {
      const wrap = $(wrapId);
      if (wrap) wrap.classList.toggle("hidden", !appliedMulti);
    }
    for (const segId of ["homeAggChips", "globalAggChips"]) {
      const seg = $(segId);
      if (seg) {
        seg.querySelectorAll("[data-agg]").forEach((btn) => {
          btn.classList.toggle("active", btn.dataset.agg === state.rangeAgg);
        });
      }
    }
  }

  /** 추세용: 기간 선택이면 그 구간, 하루면 끝일 기준 최근 14일 */
  function homeTrendWindow() {
    const dbByDate = new Map(
      (state.manifest?.db_days || []).map((d) => [d.date, d])
    );
    const gaByDate = new Map(
      (state.manifest?.ga_days || []).map((d) => [d.date, d])
    );
    let dates;
    if (isRangeSelection()) {
      dates = [...(state.rangeDays || [])];
    } else {
      const end = state.dateTo || state.currentDate;
      const all = [...(state.manifest?.available_dates || [])]
        .filter((d) => d <= end)
        .sort();
      dates = all.slice(-7);
    }
    return dates.map((date) => {
      const db = dbByDate.get(date);
      const ga = gaByDate.get(date);
      const s = db?.summary || {};
      return {
        date,
        personal: Number(s.personal_focus_seconds) || 0,
        home: Number(s.personal_home_focus_seconds) || 0,
        roomPersonal: Number(s.personal_group_focus_seconds) || 0,
        group: Number(s.group_focus_seconds) || 0,
        totalMin:
          ((Number(s.personal_focus_seconds) || 0) +
            (Number(s.group_focus_seconds) || 0)) /
          60,
        homeMin: (Number(s.personal_home_focus_seconds) || 0) / 60,
        roomMin: (Number(s.personal_group_focus_seconds) || 0) / 60,
        groupMin: (Number(s.group_focus_seconds) || 0) / 60,
        entries: Number(s.session_entry_count) || 0,
        invitesCreated: Number(s.invitations_created_count) || 0,
        invitesResponded: Number(s.invitations_responded_count) || 0,
        newUsers: ga?.metrics?.new_users ?? null,
        activeUsers: ga?.metrics?.active_users ?? null,
      };
    });
  }

  function totalFocusSeconds(summary) {
    const home = Number(summary.personal_home_focus_seconds) || 0;
    const room = Number(summary.personal_group_focus_seconds) || 0;
    const group = Number(summary.group_focus_seconds) || 0;
    return (Number(summary.personal_focus_seconds) || home + room) + group;
  }

  /** 선택 기간과 같은 길이의 직전 구간 */
  function comparePeriodRange() {
    const from = state.dateFrom;
    const to = state.dateTo;
    if (!from || !to) return null;
    const days = eachDateInclusive(from, to);
    const n = days.length;
    const prevTo = addDaysIso(from, -1);
    const prevFrom = addDaysIso(prevTo, -(n - 1));
    return { from: prevFrom, to: prevTo, dayCount: n };
  }

  function comparePeriodLabel() {
    const quick = detectQuickPeriod();
    if (quick === "yesterday") return "전일 대비";
    if (quick === "week") return "직전 주 대비";
    if (quick === "month") return "직전 동일 기간 대비";
    const n = selectionDayCount();
    return n > 1 ? `직전 ${n}일 대비` : "전일 대비";
  }

  function summaryFromManifestRange(from, to) {
    const byDate = new Map(
      (state.manifest?.db_days || []).map((d) => [d.date, d.summary || {}])
    );
    const list = eachDateInclusive(from, to).map((d) => byDate.get(d) || {});
    return sumSummaries(list);
  }

  function gaMetricsFromManifestRange(from, to) {
    const byDate = new Map(
      (state.manifest?.ga_days || []).map((d) => [d.date, d])
    );
    const metrics = [];
    for (const d of eachDateInclusive(from, to)) {
      const row = byDate.get(d);
      if (row?.metrics) metrics.push(row.metrics);
    }
    return aggregateGaMetrics(metrics);
  }

  /** 현황 요약 + 확인할 것 (최대 3) */
  function buildHomeStatus(summary) {
    const dayCount = selectionDayCount();
    const range = dayCount > 1;
    const focus = totalFocusSeconds(summary);
    const entries = Number(summary.session_entry_count) || 0;
    const rate = inviteAcceptRate(summary);
    const timerRate = timerCompleteRate();
    const issues = [];

    if (focus === 0 && entries === 0) {
      issues.push({
        warn: true,
        text: range
          ? "선택 기간에 타이머·입장이 거의 없습니다."
          : "타이머·입장이 없습니다. 쉬는 날이거나 수집을 확인하세요.",
        view: "db",
        anchor: "homeIssues",
      });
    } else if (entries > 0 && focus === 0) {
      issues.push({
        warn: true,
        text: "입장은 있는데 타이머가 없습니다. 방문→몰입 전환을 확인하세요.",
        view: "funnel",
      });
    } else if (entries === 0 && focus > 0) {
      issues.push({
        warn: true,
        text: "타이머는 있는데 그룹 입장이 없습니다. 혼자 사용 비중이 높을 수 있습니다.",
        view: "db",
      });
    }

    if (timerRate != null && timerRate < 0.35 && (eventCount("timer_start") || 0) >= 5) {
      issues.push({
        warn: true,
        text: `타이머 완료율이 낮습니다 (${fmtPct(timerRate)}).`,
        view: "ga",
      });
    }

    if (rate != null && rate < 0.15 && (summary.invitations_created_count || 0) >= 3) {
      issues.push({
        warn: true,
        text: `초대 응답률이 낮습니다 (${fmtPct(rate)}).`,
        view: "db",
      });
    }

    if (!gaReady()) {
      issues.push({
        warn: false,
        text: "GA 숫자가 없어 신규·활성을 확인할 수 없습니다.",
        view: "ga",
      });
    }

    const trimmed = issues.slice(0, 3);
    const warn = trimmed.some((i) => i.warn);
    const primary = trimmed[0];
    const text = primary
      ? primary.text
      : "특이사항 없음";

    return {
      label: warn ? "주의" : primary ? "참고" : "정상",
      text,
      warn,
      view: primary?.view || null,
      anchor: primary?.anchor || (trimmed.length ? "homeIssues" : null),
      issues: trimmed,
    };
  }

  const METRIC_HELP = {
    "총 집중":
      "DB focus_session·group_focus_session의 total_duration을 모두 더한 값. 사용자 1인 평균이 아닙니다.",
    "일평균 집중":
      "기간 내 total_duration 합 ÷ 일수. 사용자 평균이 아닌 ‘하루당 서비스 전체 합’입니다.",
    "기간 총 집중": "기간 내 total_duration 합. 사용자 평균 아님",
    타이머:
      "DB total_duration 합(개인+그룹 공유). 해당일 KST started_at 기준. 사용자 평균 아님",
    "개인 집중": "개인 타이머(focus_session) 시간",
    "그룹 집중":
      "그룹 공유 타이머(group_focus_session) 시간 — 그룹방 체류가 아님",
    "그룹 타이머":
      "그룹 공유 타이머(group_focus_session) 시간 — 그룹방 체류가 아님",
    "그룹 타이머 비중":
      "그룹 타이머 ÷ (개인+그룹 타이머). ‘함께 타이머’ 비율",
    "그룹 집중 비중":
      "그룹 타이머 ÷ (개인+그룹 타이머). 그룹방 체류 비중 아님(퇴장·stay_sec 미수집)",
    "그룹방 체류":
      "입장~퇴장 체류 초. DB에 퇴장 이력이 없어 아직 집계 불가",
    "그룹 입장": "그날 entered_at 기준 그룹방 입장 횟수",
    "일평균 입장": "기간 입장 합 ÷ 일수",
    "초대 응답률": "초대 응답 수 ÷ 초대 생성 수",
    "타이머 완료율":
      "GA timer_complete ÷ timer_start. 이벤트 건수 비율(사용자별 평균 아님). 할 일 완료와 다름",
    완료율:
      "GA timer_complete ÷ timer_start (이벤트 건수 비율)",
    멤버십: "지금 그룹방에 속한 연결 수",
    "그룹 소속": "지금 그룹방에 속한 연결 수",
    "신규 사용자": "GA 기준 그날 처음 방문한 사용자 수",
    신규: "GA 기준 그날(또는 기간 합) 처음 방문한 사용자 수",
    활성: "GA 기준 그날 앱을 켠 사람 수 (DAU)",
    "D1 리텐션": "어제 활성 사용자가 오늘도 활성인 비율",
    "개인 세션": "혼자 타이머 켠 횟수",
    "그룹 세션": "그룹방 입장~퇴장 체류(미수집). 예전 ‘그룹 세션 수’와 다름",
    "개인 세션(홈)": "홈에서 시작한 개인 타이머(focus_session, group_id 없음)",
    "개인 타이머(방)":
      "그룹·라운지에서 시작한 개인 타이머(focus_session + group_id)",
    "홈에서 시작": "DB focus_session · group_id 없음 · total_duration",
    "그룹에서 시작":
      "DB focus_session · group_id 있음 · total_duration 합",
    "그룹 공유": "DB group_focus_session · total_duration 합",
    "일평균 홈 타이머": "홈에서 시작한 개인 타이머 기간 합 ÷ 일수",
    "일평균 방 타이머": "그룹에서 시작한 개인 타이머 기간 합 ÷ 일수",
    "일평균 그룹 타이머": "그룹 공유 타이머 기간 합 ÷ 일수",
    생성: "그날 보낸 초대 수",
    응답: "그날 초대에 답한 수",
    "응답/생성": "보낸 초대 중 답한 비율",
    세션: "그날 앱을 켠 횟수",
    D1: "어제 온 사람이 오늘도 왔는지",
    D7: "가입 7일 뒤에도 왔는지",
    D30: "가입 30일 뒤에도 왔는지",
  };

  const HELP_BY_ID = {
    UG_USER_GROUP_LIST: "그룹방 소속 연결 수",
    UG_SESSION_ENTER: "그날 그룹방에 들어간 횟수",
    INV_CREATE: "그날 보낸 초대 수",
    INV_ACCEPT: "그날 초대에 답한 수",
    KPI_DAILY_PERSONAL_FOCUS: "혼자 타이머로 공부한 시간",
    KPI_DAILY_GROUP_FOCUS: "그룹 타이머로 공부한 시간",
    KPI_DAILY_SESSION_COUNT: "타이머 켠 총 횟수",
    KPI_DAILY_MEMBERSHIP: "그룹방 소속 연결 수",
    KPI_DAILY_GROUP_ENTRY: "그날 그룹방에 들어간 횟수",
    E_TIMER_USAGE_TIME: "혼자 타이머로 공부한 시간",
    PIPE_MEMBERSHIP_SNAPSHOT: "그룹방 소속 연결 수",
    PIPE_SESSION_ENTRIES: "그날 그룹방에 들어간 횟수",
    PIPE_INVITATIONS_CREATED: "그날 보낸 초대 수",
    PIPE_INVITATIONS_RESPONDED: "그날 초대에 답한 수",
    PIPE_PERSONAL_SESSIONS: "혼자 타이머 켠 횟수",
    PIPE_GROUP_SESSIONS: "그룹 타이머 켠 횟수",
    DB_FOCUS_SESSION: "혼자 타이머 켠 횟수",
    DB_GROUP_FOCUS_SESSION: "그룹 타이머 켠 횟수",
    DB_USER_GROUP: "그룹방 소속 연결 수",
  };

  function metricHelp(label, item) {
    return buildMetricTip({ label, ...item });
  }

  const CHART = {
    red: "#fa5332",
    redSoft: "rgba(250,83,50,0.12)",
    black: "#6b7280",
    gray: "#9ca3af",
    graySoft: "rgba(156,163,175,0.2)",
    dark: "#4b5563",
    green: "#3aa89a",
    mint: "#3aa89a",
    peach: "#fdb8ab",
  };

  function chartFill(ctx, colorFrom, colorTo) {
    const g = ctx.createLinearGradient(0, 0, 0, ctx.canvas.height || 220);
    g.addColorStop(0, colorFrom);
    g.addColorStop(1, colorTo);
    return g;
  }

  function renderKpiGrid(el, items) {
    if (!el) return;
    el.innerHTML = items
      .map((i) => {
        const valueClass = [
          "metric-card__value",
          i.pending ? "is-muted" : "",
          i.accent && !i.pending ? "is-accent" : "",
        ]
          .filter(Boolean)
          .join(" ");
        const src = String(i.source || "");
        const chipClass = [
          "metric-card__chip",
          i.chipClass ||
            (src.includes("P2") || src.includes("GA")
              ? "phase2"
              : src.includes("P3")
                ? "phase3"
                : "db"),
        ].join(" ");
        const chipText = i.source || "";
        const aux = i.secondary || i.hint || "";
        const tip = buildMetricTip(i);
        const how = metricHowLabel(i);
        const delta = i.delta
          ? `<span class="metric-card__delta ${i.deltaTone || "flat"}">${escapeHtml(
              i.delta
            )}</span>`
          : "";
        return `<article class="metric-card metric-card--has-tip" data-tip="${escapeHtml(
          tip
        )}" title="${escapeHtml(tip)}">
          <span class="metric-card__label">${
            i.swatch
              ? `<span class="metric-card__swatch" style="background:${escapeHtml(
                  i.swatch
                )}"></span>`
              : ""
          }${escapeHtml(i.label)}</span>
          ${
            how
              ? `<span class="metric-card__how">${escapeHtml(how)}</span>`
              : ""
          }
          <span class="${valueClass}">${escapeHtml(String(i.value))}</span>
          <div class="metric-card__footer">
            ${chipText ? `<span class="${chipClass}">${escapeHtml(chipText)}</span>` : ""}
            ${delta}
            ${aux ? `<span class="metric-card__aux">${escapeHtml(aux)}</span>` : ""}
          </div>
        </article>`;
      })
      .join("");
  }

  /* ===== Overview (홈) ===== */
  function renderHome(dateLabel) {
    const s = summaryView();
    const ga = gaMetricsView();
    const dayCount = selectionDayCount();
    const range = dayCount > 1;
    const periodSum = usePeriodSum();
    const focusSec = totalFocusSeconds(s);
    const homeSec = Number(s.personal_home_focus_seconds) || 0;
    const roomSec = Number(s.personal_group_focus_seconds) || 0;
    const groupSec = Number(s.group_focus_seconds) || 0;
    const share = groupFocusShare(s);
    const rate = inviteAcceptRate(s);
    const timerRate = timerCompleteRate();
    const status = buildHomeStatus(s);
    const prev = state.prevSummary || {};
    const prevFocus = totalFocusSeconds(prev);
    const prevRate = inviteAcceptRate(prev);

    const scale = scaleCount;

    const quick = detectQuickPeriod();
    const stale = isDataStale();
    const heroTitle =
      quick === "yesterday"
        ? stale
          ? "최신 수집일"
          : "어제 활동"
        : quick === "week"
          ? "이번 주"
          : quick === "month"
            ? "이번 달"
            : range
              ? "선택 기간"
              : "선택한 날";
    if ($("homeHeroTitle")) $("homeHeroTitle").textContent = heroTitle;
    if ($("homeSectionTitle")) $("homeSectionTitle").textContent = "Daily pulse";

    const metaEl = $("homeMeta");
    if (metaEl) metaEl.textContent = homeMetaLabel();
    const compareLabel = comparePeriodLabel();

    const insightEl = $("homeInsight");
    if (insightEl) {
      const clickable = !!(status.view || status.anchor || status.issues.length);
      insightEl.className = `home-hero__insight${status.warn ? " warn" : ""}${
        clickable ? " is-clickable" : ""
      }`;
      insightEl.dataset.view = status.view || "";
      insightEl.dataset.anchor = status.anchor || (status.issues.length ? "homeIssues" : "");
      const more =
        status.issues.length > 1
          ? `<span class="insight-more">외 ${status.issues.length - 1}건 · 자세히</span>`
          : clickable
            ? `<span class="insight-more">자세히 보기</span>`
            : "";
      insightEl.innerHTML = `<span class="phase">${escapeHtml(
        status.label
      )}</span><span class="insight-text">${escapeHtml(status.text)}</span>${more}`;
    }

    const entryRaw = Number(s.session_entry_count) || 0;
    const newUsers = gaReady() ? ga.new_users : null;
    const activeUsers = gaReady() ? ga.active_users : null;

    const cmpRange = comparePeriodRange();
    const cmpSummary = cmpRange
      ? summaryFromManifestRange(cmpRange.from, cmpRange.to)
      : prev;
    const cmpGa = cmpRange ? gaMetricsFromManifestRange(cmpRange.from, cmpRange.to) : null;
    const cmpFocus = totalFocusSeconds(cmpSummary);
    const cmpRate = inviteAcceptRate(cmpSummary);
    const cmpEntry = Number(cmpSummary.session_entry_count) || 0;
    const cmpNew = cmpGa?.new_users ?? null;
    const cmpActive = cmpGa?.active_users ?? null;

    // 카드 숫자는 표시값 기준으로 비교 (일평균이면 일평균끼리)
    const currFocusShow = scale(focusSec);
    const prevFocusShow = scale(cmpFocus);
    const currEntryShow = scale(entryRaw);
    const prevEntryShow = scale(cmpEntry);
    const currNewShow =
      newUsers == null ? null : range && !periodSum ? newUsers / dayCount : newUsers;
    const prevNewShow =
      cmpNew == null
        ? null
        : range && !periodSum
          ? cmpNew / (cmpRange?.dayCount || 1)
          : cmpNew;
    const currActiveShow =
      activeUsers == null
        ? null
        : range && !periodSum
          ? activeUsers / dayCount
          : activeUsers;
    const prevActiveShow =
      cmpActive == null
        ? null
        : range && !periodSum
          ? cmpActive / (cmpRange?.dayCount || 1)
          : cmpActive;

    const dFocus = calcDelta(currFocusShow, prevFocusShow);
    const dEntry = calcDelta(currEntryShow, prevEntryShow);
    const dRate = calcDelta(rate, cmpRate);
    const dNew = calcDelta(currNewShow, prevNewShow);
    const dActive = calcDelta(currActiveShow, prevActiveShow);

    const personalTotal = homeSec + roomSec;
    const startedInGroupShare =
      personalTotal > 0 ? roomSec / personalTotal : null;

    renderKpiGrid($("homeUseKpis"), [
      {
        label: "활성",
        value: gaReady() ? fmtScaledNum(activeUsers) : "—",
        pending: !gaReady(),
        accent: gaReady(),
        delta: dActive?.text,
        deltaTone: dActive?.tone,
        aggKind: "ga_users",
        help: `GA active_users · ${compareLabel}`,
      },
      {
        label: "타이머",
        value: fmtDur(scale(focusSec)),
        accent: true,
        delta: dFocus?.text,
        deltaTone: dFocus?.tone,
        aggKind: "db_duration_sum",
        help: "개인+그룹 공유 total_duration · started_at(KST)",
      },
      {
        label: "타이머 완료율",
        value: timerRate == null ? "—" : fmtPct(timerRate),
        pending: timerRate == null,
        accent: timerRate != null,
        aggKind: "ga_event_ratio",
        help: "timer_complete ÷ timer_start",
      },
    ]);

    renderKpiGrid($("homeFocusKpis"), [
      {
        label: "홈에서 시작",
        value: fmtDur(scale(homeSec)),
        swatch: CHART.red,
        aggKind: "db_duration_sum",
        help: "focus_session · group_id 없음",
      },
      {
        label: "그룹에서 시작",
        value: fmtDur(scale(roomSec)),
        swatch: CHART.peach,
        aggKind: "db_duration_sum",
        help: "focus_session · group_id 있음",
      },
      {
        label: "그룹 공유",
        value: fmtDur(scale(groupSec)),
        swatch: CHART.mint,
        aggKind: "db_duration_sum",
        help: "group_focus_session",
      },
      {
        label: "그룹시작 비중",
        value: startedInGroupShare == null ? "—" : fmtPct(startedInGroupShare),
        pending: startedInGroupShare == null,
        aggKind: "share_ratio",
        help: "그룹에서 시작 ÷ (홈+그룹에서 시작) 개인 타이머",
      },
    ]);

    renderKpiGrid($("homeGrowthKpis"), [
      {
        label: "신규",
        value: gaReady() ? fmtScaledNum(newUsers) : "—",
        pending: !gaReady(),
        accent: gaReady(),
        delta: dNew?.text,
        deltaTone: dNew?.tone,
        aggKind: "ga_users",
        help: `GA new_users · ${compareLabel}`,
      },
      {
        label: "입장",
        value: fmtScaledNum(entryRaw),
        accent: true,
        delta: dEntry?.text,
        deltaTone: dEntry?.tone,
        aggKind: "db_count_sum",
        help: `session_entry_count · ${compareLabel}`,
      },
    ]);

    renderKpiGrid($("homeInviteKpis"), [
      {
        label: "생성",
        value: fmtScaledNum(Number(s.invitations_created_count) || 0),
        aggKind: "db_count_sum",
        help: "invitations_created_count",
      },
      {
        label: "응답",
        value: fmtScaledNum(Number(s.invitations_responded_count) || 0),
        aggKind: "db_count_sum",
        help: "invitations_responded_count",
      },
      {
        label: "응답률",
        value: rate == null ? "—" : fmtPct(rate),
        pending: rate == null,
        accent: rate != null,
        delta: dRate?.text,
        deltaTone: dRate?.tone,
        aggKind: "share_ratio",
        help: `응답 ÷ 생성 · ${compareLabel}`,
      },
    ]);
    void dateLabel;
    void prevFocus;
    void prevRate;

    const issuesEl = $("homeIssues");
    if (issuesEl) {
      if (!status.issues.length) {
        issuesEl.innerHTML = `<li class="ok">특이사항 없음</li>`;
      } else {
        const viewLabel = {
          funnel: "전환",
          db: "데이터",
          ga: "이벤트",
          logs: "로그",
        };
        issuesEl.innerHTML = status.issues
          .map((issue) => {
            const link = issue.view
              ? `<a href="#" data-view="${escapeHtml(issue.view)}">${escapeHtml(
                  viewLabel[issue.view] || "보기"
                )}</a>`
              : "";
            return `<li class="${issue.warn ? "warn" : ""}">${escapeHtml(
              issue.text
            )}${link}</li>`;
          })
          .join("");
      }
    }

    syncPeriodChips();
    syncRangeAggUI();

    renderHomeReleaseStrip();

    const trend = homeTrendWindow();
    const chartTrend = homeChartTrendLabel();
    if ($("homeUseChartMeta")) $("homeUseChartMeta").textContent = chartTrend;
    if ($("homeGrowthChartMeta")) $("homeGrowthChartMeta").textContent = chartTrend;

    const trendDates = trend.map((d) => d.date);
    const releaseMarkers = eventsForDates(trendDates);
    renderHomeChartReleaseNote(trendDates, releaseMarkers);

    destroyChart("homeTrend");
    destroyChart("homeTrendGrowth");
    destroyChart("homeFocus");
    destroyChart("homeInvite");
    destroyChart("homeTrendFocus");
    destroyChart("homeTimer");

    const chartOpts = {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: "index", intersect: false },
      plugins: {
        legend: {
          position: "bottom",
          labels: { boxWidth: 10, usePointStyle: true, pointStyle: "circle" },
        },
      },
    };

    const trendCanvas = $("homeTrendChart");
    if (trendCanvas) {
      const ctx = trendCanvas.getContext("2d");
      state.charts.homeTrend = new Chart(trendCanvas, {
        type: "line",
        data: {
          labels: trend.map((d) => d.date.slice(5)),
          datasets: [
            {
              label: "활성",
              data: trend.map((d) => d.activeUsers),
              borderColor: CHART.red,
              backgroundColor: chartFill(ctx, "rgba(250,83,50,0.12)", "rgba(250,83,50,0)"),
              fill: true,
              tension: 0.35,
              spanGaps: true,
              pointRadius: 0,
              pointHoverRadius: 3,
              borderWidth: 1.75,
              yAxisID: "yCount",
            },
            {
              label: "타이머(분)",
              data: trend.map((d) => Math.round(d.totalMin)),
              borderColor: CHART.mint,
              backgroundColor: chartFill(ctx, "rgba(58,168,154,0.1)", "rgba(58,168,154,0)"),
              fill: true,
              tension: 0.35,
              pointRadius: 0,
              pointHoverRadius: 3,
              borderWidth: 1.75,
              yAxisID: "yMin",
            },
          ],
        },
        options: {
          ...chartOpts,
          plugins: {
            ...chartOpts.plugins,
            productEventMarkers: {
              dates: trendDates,
              events: releaseMarkers,
            },
          },
          scales: {
            x: {
              grid: { display: false },
              ticks: { color: CHART.gray },
            },
            yCount: {
              type: "linear",
              position: "left",
              beginAtZero: true,
              ticks: { precision: 0, color: CHART.gray },
              grid: { color: "rgba(139,147,161,0.12)" },
              title: { display: true, text: "명", color: CHART.gray },
            },
            yMin: {
              type: "linear",
              position: "right",
              beginAtZero: true,
              grid: { drawOnChartArea: false },
              ticks: { color: CHART.gray },
              title: { display: true, text: "분", color: CHART.gray },
            },
          },
        },
      });
    }

    const growthCanvas = $("homeTrendGrowthChart");
    if (growthCanvas) {
      const ctx = growthCanvas.getContext("2d");
      state.charts.homeTrendGrowth = new Chart(growthCanvas, {
        type: "line",
        data: {
          labels: trend.map((d) => d.date.slice(5)),
          datasets: [
            {
              label: "입장",
              data: trend.map((d) => d.entries),
              borderColor: CHART.dark,
              backgroundColor: chartFill(ctx, "rgba(75,85,99,0.08)", "rgba(75,85,99,0)"),
              fill: true,
              tension: 0.35,
              pointRadius: 0,
              pointHoverRadius: 3,
              borderWidth: 1.75,
            },
            {
              label: "신규",
              data: trend.map((d) => d.newUsers),
              borderColor: CHART.red,
              backgroundColor: "transparent",
              tension: 0.35,
              spanGaps: true,
              pointRadius: 0,
              pointHoverRadius: 3,
              borderWidth: 1.75,
              borderDash: [4, 4],
            },
          ],
        },
        options: {
          ...chartOpts,
          scales: {
            x: { grid: { display: false }, ticks: { color: CHART.gray } },
            y: {
              beginAtZero: true,
              ticks: { precision: 0, color: CHART.gray },
              grid: { color: "rgba(139,147,161,0.12)" },
            },
          },
        },
      });
    }

    const focusCanvas = $("homeFocusChart");
    const focusEmpty = $("homeFocusChartEmpty");
    const focusTotal = homeSec + roomSec + groupSec;
    if (focusCanvas) {
      if (focusTotal <= 0) {
        destroyChart("homeFocus");
        focusCanvas.classList.add("hidden");
        focusEmpty?.classList.remove("hidden");
      } else {
        focusCanvas.classList.remove("hidden");
        focusEmpty?.classList.add("hidden");
        state.charts.homeFocus = new Chart(focusCanvas, {
          type: "doughnut",
          data: {
            labels: ["홈에서 시작", "그룹에서 시작", "그룹 공유"],
            datasets: [
              {
                data: [homeSec / 60, roomSec / 60, groupSec / 60],
                backgroundColor: [CHART.red, CHART.peach, CHART.mint],
                borderWidth: 2,
                borderColor: "#ffffff",
                hoverOffset: 4,
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: "68%",
            plugins: {
              legend: { display: false },
              tooltip: {
                callbacks: {
                  label(ctx) {
                    const min = ctx.parsed ?? 0;
                    const pct =
                      focusTotal > 0
                        ? ` (${Math.round((min * 60 * 100) / focusTotal)}%)`
                        : "";
                    return `${ctx.label}: ${Math.round(min)}분${pct}`;
                  },
                },
              },
            },
          },
        });
      }
    }

    const inviteCanvas = $("homeInviteChart");
    if (inviteCanvas) {
      state.charts.homeInvite = new Chart(inviteCanvas, {
        type: "bar",
        data: {
          labels: ["생성", "응답"],
          datasets: [
            {
              data: [
                s.invitations_created_count || 0,
                s.invitations_responded_count || 0,
              ],
              backgroundColor: [CHART.red, CHART.mint],
              borderRadius: 8,
              borderSkipped: false,
              maxBarThickness: 36,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: { grid: { display: false }, ticks: { color: CHART.gray } },
            y: {
              beginAtZero: true,
              ticks: { precision: 0, color: CHART.gray },
              grid: { color: "rgba(139,147,161,0.12)" },
            },
          },
        },
      });
    }
  }

  /* ===== 서비스별 ===== */
  function renderLoopBanner(containerId, activeStep) {
    const el = $(containerId);
    if (!el) return;
    const stepInfo = MOGAK_LOOP.find((s) => s.id === activeStep) || MOGAK_LOOP[0];
    const steps = MOGAK_LOOP.map((s) => {
      const active = s.id === activeStep;
      const done = s.step < stepInfo.step;
      return `<div class="svc-loop-step ${active ? "is-active" : ""} ${
        done ? "is-done" : ""
      }" data-loop-step="${s.id}">
        <span class="svc-loop-step__num">${s.step}</span>
        <span class="svc-loop-step__label">${escapeHtml(s.label)}</span>
        <span class="svc-loop-step__q">${escapeHtml(s.question)}</span>
      </div>`;
    }).join('<span class="svc-loop-arrow" aria-hidden="true">→</span>');
    el.innerHTML = `<div class="svc-loop-banner__head">
      <strong>${escapeHtml(stepInfo.tagline || stepInfo.question)}</strong>
      <span>${escapeHtml(stepInfo.desc)}</span>
    </div>
    <div class="svc-loop-steps" role="navigation" aria-label="몰입 루프">${steps}</div>`;
  }

  function loopKpiBlocks(key, s, ga, scale, fmtEventCount, timerRate, rate) {
    const homeSec = Number(s.personal_home_focus_seconds) || 0;
    const roomSec = Number(s.personal_group_focus_seconds) || 0;
    const groupSec = Number(s.group_focus_seconds) || 0;
    const blocks = {
      focus: {
        split: true,
        aTitle: "몰입 품질",
        aSub: "개인 타이머 · 완료율 · 모드",
        bTitle: "할 일·시작",
        bSub: "약속(할일) → 타이머 켜기",
        a: [
          {
            label: "홈 개인 타이머",
            value: fmtDur(scale(homeSec)),
            how: "DB · 홈에서 시작",
            help: "focus_session · group_id 없음",
            aggKind: "db_duration_sum",
            swatch: CHART.red,
          },
          {
            label: "타이머 완료율",
            value: timerRate == null ? "—" : fmtPct(timerRate),
            pending: timerRate == null,
            how: "GA · 전역",
            help: "timer_complete ÷ timer_start",
            aggKind: "ga_event_ratio",
          },
          {
            label: "모드 선택",
            value: fmtEventCount("select_timer_mode").value,
            pending: fmtEventCount("select_timer_mode").pending,
            how: "GA",
          },
          {
            label: "타이머 시작",
            value: fmtEventCount("timer_start").value,
            pending: fmtEventCount("timer_start").pending,
            how: "GA · 전역",
          },
        ],
        b: [
          {
            label: "할 일 완료",
            value: fmtEventCount("todo_complete_click").value,
            pending: fmtEventCount("todo_complete_click").pending,
          },
          {
            label: "시작 실패",
            value: fmtEventCount("timer_start_failed").value,
            pending: fmtEventCount("timer_start_failed").pending,
            help: "할 일 미설정 등",
          },
          {
            label: "개인 몰입 합",
            value: fmtDur(scale(homeSec + roomSec)),
            how: "DB",
            help: "홈+그룹 컨텍스트 개인 타이머",
          },
        ],
      },
      together: {
        split: true,
        aTitle: "그룹방·라운지",
        aSub: "입장 · 함께 켠 타이머 · 응원",
        bTitle: "메이트·초대",
        bSub: "초대 · 콕 · 관계 루프",
        a: [
          {
            label: "그룹 입장",
            value: fmtScaledNum(Number(s.session_entry_count) || 0),
            how: "DB",
          },
          {
            label: "그룹에서 시작",
            value: fmtDur(scale(roomSec)),
            help: "그룹·라운지 개인 타이머",
          },
          {
            label: "그룹 공유 타이머",
            value: fmtDur(scale(groupSec)),
          },
          {
            label: "응원",
            value: fmtEventCount("cheer_click").value,
            pending: fmtEventCount("cheer_click").pending,
          },
        ],
        b: [
          {
            label: "초대 생성",
            value: fmtScaledNum(Number(s.invitations_created_count) || 0),
          },
          {
            label: "초대 응답률",
            value: rate == null ? "—" : fmtPct(rate),
            pending: rate == null,
          },
          {
            label: "콕 응답",
            value: fmtEventCount("poke_response").value,
            pending: fmtEventCount("poke_response").pending,
          },
          {
            label: "라운지 응원",
            value: fmtEventCount("lounge_cheer_click").value,
            pending: fmtEventCount("lounge_cheer_click").pending,
          },
        ],
      },
      habit: {
        split: false,
        kpis: [
          {
            label: "리포트 조회",
            value: fmtEventCount("record_view").value,
            pending: fmtEventCount("record_view").pending,
          },
          {
            label: "온보딩 단계",
            value: fmtEventCount("onboarding_step").value,
            pending: fmtEventCount("onboarding_step").pending,
          },
          {
            label: "활성",
            value: gaReady() ? fmtScaledNum(ga.active_users) : "—",
            pending: !gaReady(),
          },
          {
            label: "신규",
            value: gaReady() ? fmtScaledNum(ga.new_users) : "—",
            pending: !gaReady(),
          },
        ],
      },
    };
    return blocks[key] || blocks.habit;
  }

  function renderLoopChart(canvasId, chartKey, trend) {
    destroyChart(canvasId);
    const canvas = $(canvasId);
    if (!canvas) return;
    const useFocus = chartKey === "focus";
    const useTogether = chartKey === "together";
    const focusMinKey = "homeMin";
    state.charts[canvasId] = new Chart(canvas, {
      type: "line",
      data: {
        labels: trend.map((d) => d.date.slice(5)),
        datasets: useFocus
          ? [
              {
                label: "홈 타이머(분)",
                data: trend.map((d) => Math.round(d[focusMinKey])),
                borderColor: CHART.red,
                backgroundColor: "transparent",
                tension: 0.35,
                borderWidth: 1.75,
                pointRadius: 0,
              },
              {
                label: "전체 타이머(분)",
                data: trend.map((d) => Math.round(d.totalMin)),
                borderColor: CHART.mint,
                backgroundColor: "transparent",
                tension: 0.35,
                borderWidth: 1.75,
                pointRadius: 0,
              },
            ]
          : useTogether
            ? [
                {
                  label: "입장",
                  data: trend.map((d) => d.entries),
                  borderColor: CHART.red,
                  backgroundColor: "transparent",
                  tension: 0.35,
                  borderWidth: 1.75,
                  pointRadius: 0,
                },
                {
                  label: "초대 생성",
                  data: trend.map((d) => d.invitesCreated || 0),
                  borderColor: CHART.mint,
                  backgroundColor: "transparent",
                  tension: 0.35,
                  borderWidth: 1.75,
                  pointRadius: 0,
                },
              ]
            : [
                {
                  label: "신규",
                  data: trend.map((d) => d.newUsers),
                  borderColor: CHART.red,
                  backgroundColor: "transparent",
                  tension: 0.35,
                  borderWidth: 1.75,
                  pointRadius: 0,
                  spanGaps: true,
                },
                {
                  label: "활성",
                  data: trend.map((d) => d.activeUsers),
                  borderColor: CHART.mint,
                  backgroundColor: "transparent",
                  tension: 0.35,
                  borderWidth: 1.75,
                  pointRadius: 0,
                  spanGaps: true,
                },
              ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: "index", intersect: false },
        plugins: {
          legend: {
            position: "bottom",
            labels: { boxWidth: 10, usePointStyle: true, pointStyle: "circle" },
          },
        },
        scales: {
          x: { grid: { display: false }, ticks: { color: CHART.gray } },
          y: {
            beginAtZero: true,
            ticks: { color: CHART.gray },
            grid: { color: "rgba(139,147,161,0.12)" },
          },
        },
      },
    });
  }

  function syncExploreTabs() {
    const tab = state.exploreTab || "compare";
    document.querySelectorAll("[data-explore-tab]").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.exploreTab === tab);
    });
    for (const id of ["compare", "loop", "events", "logs"]) {
      const panel = $(`explorePanel${id.charAt(0).toUpperCase()}${id.slice(1)}`);
      if (panel) panel.classList.toggle("hidden", id !== tab);
    }
  }

  function setExploreTab(tab) {
    state.exploreTab = tab || "compare";
    syncExploreTabs();
    if (tab === "compare") {
      renderExploreCompare();
      renderGaCorrGrid();
    }
    if (tab === "loop") renderExploreLoop();
    if (tab === "events") renderGa();
    if (tab === "logs") renderLogs();
  }

  function renderExploreCompare() {
    const s = state.summary || {};
    const ga = gaMetricsView();
    const dayCount = selectionDayCount();
    const range = dayCount > 1;
    const periodSum = usePeriodSum();
    const scale = (n) => (range && !periodSum ? n / dayCount : n);
    const cmp = comparePeriodRange();
    const cmpSummary = cmp
      ? summaryFromManifestRange(cmp.from, cmp.to)
      : state.prevSummary || {};
    const cmpGa = cmp ? gaMetricsFromManifestRange(cmp.from, cmp.to) : null;

    if ($("exploreCompareMeta")) {
      $("exploreCompareMeta").textContent = [comparePeriodLabel(), homeMetaLabel()]
        .filter(Boolean)
        .join(" · ");
    }

    const focus = totalFocusSeconds(s);
    const cmpFocus = totalFocusSeconds(cmpSummary);
    const entry = Number(s.session_entry_count) || 0;
    const cmpEntry = Number(cmpSummary.session_entry_count) || 0;
    const timerRate = timerCompleteRate();
    const active = gaReady() ? ga.active_users : null;
    const cmpActive = cmpGa?.active_users ?? null;
    const newUsers = gaReady() ? ga.new_users : null;
    const cmpNew = cmpGa?.new_users ?? null;
    const membership = Number(s.membership_count) || 0;
    const cmpMembership = Number(cmpSummary.membership_count) || 0;
    const invites = Number(s.invitations_created_count) || 0;
    const cmpInvites = Number(cmpSummary.invitations_created_count) || 0;

    const dFocus = calcDelta(scale(focus), scale(cmpFocus));
    const dEntry = calcDelta(scale(entry), scale(cmpEntry));
    const dActive = calcDelta(
      active == null ? null : scale(active),
      cmpActive == null ? null : scale(cmpActive)
    );
    const dNew = calcDelta(
      newUsers == null ? null : scale(newUsers),
      cmpNew == null ? null : scale(cmpNew)
    );
    const dMembership = calcDelta(scale(membership), scale(cmpMembership));
    const dInvites = calcDelta(scale(invites), scale(cmpInvites));

    renderKpiGrid($("exploreCompareKpis"), [
      {
        label: "타이머",
        value: fmtDur(scale(focus)),
        delta: dFocus?.text,
        deltaTone: dFocus?.tone,
        aggKind: "db_duration_sum",
        help: "개인+그룹 타이머 합 · DB total_duration",
      },
      {
        label: "그룹 입장",
        value: fmtScaledNum(entry),
        delta: dEntry?.text,
        deltaTone: dEntry?.tone,
        aggKind: "db_count_sum",
        help: "그날 entered_at 기준 그룹방 입장",
      },
      {
        label: "멤버십",
        value: fmtScaledNum(membership),
        delta: dMembership?.text,
        deltaTone: dMembership?.tone,
        aggKind: "db_count_sum",
        help: "그룹방 소속 연결 수(스냅샷)",
      },
      {
        label: "초대 생성",
        value: fmtScaledNum(invites),
        delta: dInvites?.text,
        deltaTone: dInvites?.tone,
        aggKind: "db_count_sum",
      },
      {
        label: "활성",
        value: gaReady() ? fmtScaledNum(active) : "—",
        pending: !gaReady(),
        delta: dActive?.text,
        deltaTone: dActive?.tone,
        aggKind: "ga_users",
      },
      {
        label: "신규",
        value: gaReady() ? fmtScaledNum(newUsers) : "—",
        pending: !gaReady(),
        delta: dNew?.text,
        deltaTone: dNew?.tone,
        aggKind: "ga_users",
      },
      {
        label: "타이머 완료율",
        value: timerRate == null ? "—" : fmtPct(timerRate),
        pending: timerRate == null,
        aggKind: "ga_event_ratio",
      },
    ]);
  }

  function renderExploreLoop() {
    const key = state.exploreLoopStep || "focus";
    const s = state.summary || {};
    const ga = gaMetricsView();
    const dayCount = selectionDayCount();
    const range = dayCount > 1;
    const periodSum = usePeriodSum();
    const scale = (n) => (range && !periodSum ? n / dayCount : n);
    const timerRate = timerCompleteRate();
    const rate = inviteAcceptRate(s);
    const fmtEventCount = (name) => {
      const count = eventCount(name);
      if (count == null) return { value: "—", pending: true };
      return { value: fmtScaledNum(count), pending: false };
    };

    renderLoopBanner("exploreLoopBanner", key);
    const block = loopKpiBlocks(key, s, ga, scale, fmtEventCount, timerRate, rate);

    $("exploreLoopKpiSplit")?.classList.toggle("hidden", !block.split);
    $("exploreLoopKpiDefault")?.classList.toggle("hidden", block.split);

    if (block.split) {
      if ($("exploreLoopKpiATitle")) $("exploreLoopKpiATitle").textContent = block.aTitle;
      if ($("exploreLoopKpiASub")) $("exploreLoopKpiASub").textContent = block.aSub;
      if ($("exploreLoopKpiBTitle")) $("exploreLoopKpiBTitle").textContent = block.bTitle;
      if ($("exploreLoopKpiBSub")) $("exploreLoopKpiBSub").textContent = block.bSub;
      renderKpiGrid($("exploreLoopKpisA"), block.a);
      renderKpiGrid($("exploreLoopKpisB"), block.b);
    } else {
      renderKpiGrid($("exploreLoopKpis"), block.kpis);
    }

    const seriesLabel =
      key === "focus"
        ? "홈 타이머 · 완료"
        : key === "together"
          ? "입장 · 초대"
          : "활성 · 신규";
    if ($("exploreLoopChartMeta")) {
      $("exploreLoopChartMeta").textContent = `${seriesLabel} · ${homeChartTrendLabel()}`;
    }

    renderLoopChart("exploreLoopChart", key, homeTrendWindow());

    const notesEl = $("exploreLoopNotes");
    if (notesEl) {
      notesEl.innerHTML = (LOOP_NOTES[key] || [])
        .map((n) => `<li>${escapeHtml(n)}</li>`)
        .join("");
    }
  }

  function renderService(serviceKey) {
    const key = serviceKey || state.currentService || "home";
    state.currentService = key;
    const meta = SERVICE_META[key] || SERVICE_META.home;
    const s = state.summary || {};
    const ga = gaMetricsView();
    const dayCount = selectionDayCount();
    const range = dayCount > 1;
    const periodSum = usePeriodSum();
    const homeSec = Number(s.personal_home_focus_seconds) || 0;
    const roomSec = Number(s.personal_group_focus_seconds) || 0;
    const groupSec = Number(s.group_focus_seconds) || 0;
    const rate = inviteAcceptRate(s);
    const timerRate = timerCompleteRate();
    const scale = (n) => (range && !periodSum ? n / dayCount : n);
    const fmtEventCount = (name) => {
      const count = eventCount(name);
      if (count == null) return { value: "—", pending: true };
      return { value: fmtScaledNum(count), pending: false };
    };

    const kpiByService = {
      home: {
        timer: [
          {
            label: "홈 개인 타이머",
            value: fmtDur(scale(homeSec)),
            how: "DB · 홈에서 시작",
            help: "focus_session · group_id 없음 · total_duration",
            aggKind: "db_duration_sum",
            swatch: CHART.red,
          },
          {
            label: "타이머 모드 선택",
            value: fmtEventCount("select_timer_mode").value,
            pending: fmtEventCount("select_timer_mode").pending,
            how: "GA · 종류 선택",
            help: "뽀모도로·일반 등 타이머 모드 탭 선택",
          },
          {
            label: "타이머 시작",
            value: fmtEventCount("timer_start").value,
            pending: fmtEventCount("timer_start").pending,
            how: "GA · 전역",
            help: "앱 전체 timer_start (홈·그룹 미구분)",
          },
          {
            label: "타이머 완료율",
            value: timerRate == null ? "—" : fmtPct(timerRate),
            pending: timerRate == null,
            how: "GA · 전역",
            help: "timer_complete ÷ timer_start",
            aggKind: "ga_event_ratio",
          },
        ],
        hub: [
          {
            label: "첫 진입",
            value: fmtEventCount("first_entrance").value,
            pending: fmtEventCount("first_entrance").pending,
          },
          {
            label: "페이지 조회",
            value: fmtEventCount("app_page_view").value,
            pending: fmtEventCount("app_page_view").pending,
          },
          {
            label: "그룹 입장",
            value: fmtScaledNum(Number(s.session_entry_count) || 0),
            how: "DB",
            help: "홈에서 그룹으로 넘어간 입장",
          },
          {
            label: "UI Bowl",
            value: fmtEventCount("ui_bowl_vote_floating_click").value,
            pending: fmtEventCount("ui_bowl_vote_floating_click").pending,
          },
        ],
      },
      group: [
        {
          label: "그룹 입장",
          value: fmtScaledNum(Number(s.session_entry_count) || 0),
          how: "DB",
        },
        {
          label: "그룹에서 시작",
          value: fmtDur(scale(roomSec)),
          help: "그룹·라운지 컨텍스트 개인 타이머",
        },
        {
          label: "그룹 공유 타이머",
          value: fmtDur(scale(groupSec)),
        },
        {
          label: "응원",
          value: fmtEventCount("cheer_click").value,
          pending: fmtEventCount("cheer_click").pending,
        },
        {
          label: "라운지 응원",
          value: fmtEventCount("lounge_cheer_click").value,
          pending: fmtEventCount("lounge_cheer_click").pending,
        },
      ],
      todo: [
        {
          label: "할 일 완료",
          value: fmtEventCount("todo_complete_click").value,
          pending: fmtEventCount("todo_complete_click").pending,
        },
        {
          label: "타이머 완료율",
          value: timerRate == null ? "—" : fmtPct(timerRate),
          pending: timerRate == null,
          aggKind: "ga_event_ratio",
        },
        {
          label: "시작 실패",
          value: fmtEventCount("timer_start_failed").value,
          pending: fmtEventCount("timer_start_failed").pending,
          help: "할 일 미설정 등",
        },
        {
          label: "타이머 시작",
          value: fmtEventCount("timer_start").value,
          pending: fmtEventCount("timer_start").pending,
        },
      ],
      record: [
        {
          label: "리포트 조회",
          value: fmtEventCount("record_view").value,
          pending: fmtEventCount("record_view").pending,
        },
        {
          label: "전체 타이머",
          value: fmtDur(scale(homeSec + roomSec + groupSec)),
          how: "DB",
        },
        {
          label: "페이지 조회",
          value: fmtEventCount("app_page_view").value,
          pending: fmtEventCount("app_page_view").pending,
        },
      ],
      character: [
        {
          label: "온보딩 단계",
          value: fmtEventCount("onboarding_step").value,
          pending: fmtEventCount("onboarding_step").pending,
        },
        {
          label: "약관 동의",
          value: fmtEventCount("auth_agreement_submit").value,
          pending: fmtEventCount("auth_agreement_submit").pending,
        },
        {
          label: "로그인",
          value: fmtEventCount("login").value,
          pending: fmtEventCount("login").pending,
        },
        {
          label: "신규",
          value: gaReady() ? fmtScaledNum(ga.new_users) : "—",
          pending: !gaReady(),
        },
      ],
      mate: [
        {
          label: "초대 생성",
          value: fmtScaledNum(Number(s.invitations_created_count) || 0),
        },
        {
          label: "초대 응답률",
          value: rate == null ? "—" : fmtPct(rate),
          pending: rate == null,
        },
        {
          label: "콕 발송",
          value: fmtEventCount("poke_send").value,
          pending: fmtEventCount("poke_send").pending,
        },
        {
          label: "콕 응답",
          value: fmtEventCount("poke_response").value,
          pending: fmtEventCount("poke_response").pending,
        },
      ],
    };

    const isHomeSvc = key === "home";
    const isGroupSvc = key === "group";
    $("svcKpiDefault")?.classList.toggle("hidden", isHomeSvc);
    $("svcKpiHome")?.classList.toggle("hidden", !isHomeSvc);
    $("svcGroupLedger")?.classList.toggle("hidden", !isGroupSvc);

    if (isHomeSvc) {
      const h = kpiByService.home;
      renderKpiGrid($("svcHomeTimerKpis"), h.timer);
      renderKpiGrid($("svcHomeHubKpis"), h.hub);
    } else {
      renderKpiGrid($("svcKpis"), kpiByService[key] || kpiByService.home);
    }

    syncPeriodChips();
    syncRangeAggUI();

    if ($("svcChartATitle")) $("svcChartATitle").textContent = "관련 추세";
    if ($("svcChartAMeta")) {
      const seriesLabel =
        key === "home"
          ? "홈 타이머 · 입장"
          : key === "group" || key === "todo" || key === "record"
            ? "타이머 · 입장"
            : key === "mate"
              ? "초대 · 응답"
              : "신규 · 활성";
      $("svcChartAMeta").textContent = `${seriesLabel} · ${homeChartTrendLabel()}`;
    }

    const trend = homeTrendWindow();
    destroyChart("svcChartA");
    const canvas = $("svcChartA");
    if (canvas) {
      const useHome = key === "home";
      const useEntry = key === "group" || key === "todo" || key === "record";
      const useMate = key === "mate";
      const focusMinKey = "homeMin";
      state.charts.svcChartA = new Chart(canvas, {
        type: "line",
        data: {
          labels: trend.map((d) => d.date.slice(5)),
          datasets: useHome
            ? [
                {
                  label: "홈 타이머(분)",
                  data: trend.map((d) => Math.round(d[focusMinKey])),
                  borderColor: CHART.red,
                  backgroundColor: "transparent",
                  tension: 0.35,
                  borderWidth: 1.75,
                  pointRadius: 0,
                },
                {
                  label: "입장",
                  data: trend.map((d) => d.entries),
                  borderColor: CHART.mint,
                  backgroundColor: "transparent",
                  tension: 0.35,
                  borderWidth: 1.75,
                  pointRadius: 0,
                },
              ]
            : useEntry
              ? [
                  {
                    label: "전체 타이머(분)",
                    data: trend.map((d) => Math.round(d.totalMin)),
                    borderColor: CHART.red,
                    backgroundColor: "transparent",
                    tension: 0.35,
                    borderWidth: 1.75,
                    pointRadius: 0,
                  },
                  {
                    label: "입장",
                    data: trend.map((d) => d.entries),
                    borderColor: CHART.mint,
                    backgroundColor: "transparent",
                    tension: 0.35,
                    borderWidth: 1.75,
                    pointRadius: 0,
                  },
                ]
              : useMate
                ? [
                    {
                      label: "초대 생성",
                      data: trend.map((d) => d.invitesCreated || 0),
                      borderColor: CHART.red,
                      backgroundColor: "transparent",
                      tension: 0.35,
                      borderWidth: 1.75,
                      pointRadius: 0,
                    },
                    {
                      label: "초대 응답",
                      data: trend.map((d) => d.invitesResponded || 0),
                      borderColor: CHART.mint,
                      backgroundColor: "transparent",
                      tension: 0.35,
                      borderWidth: 1.75,
                      pointRadius: 0,
                    },
                  ]
                : [
                    {
                      label: "신규",
                      data: trend.map((d) => d.newUsers),
                      borderColor: CHART.red,
                      backgroundColor: "transparent",
                      tension: 0.35,
                      borderWidth: 1.75,
                      pointRadius: 0,
                      spanGaps: true,
                    },
                    {
                      label: "활성",
                      data: trend.map((d) => d.activeUsers),
                      borderColor: CHART.mint,
                      backgroundColor: "transparent",
                      tension: 0.35,
                      borderWidth: 1.75,
                      pointRadius: 0,
                      spanGaps: true,
                    },
                  ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: { mode: "index", intersect: false },
          plugins: {
            legend: {
              position: "bottom",
              labels: { boxWidth: 10, usePointStyle: true, pointStyle: "circle" },
            },
          },
          scales: {
            x: { grid: { display: false }, ticks: { color: CHART.gray } },
            y: {
              beginAtZero: true,
              ticks: { color: CHART.gray },
              grid: { color: "rgba(139,147,161,0.12)" },
            },
          },
        },
      });
    }

    const eventBody = $("svcEventBody");
    if (eventBody) {
      const renderEventRows = (names) =>
        (names || []).map((name) => {
          const count = eventCount(name);
          return `<tr><td>${escapeHtml(name)}</td><td>${
            count == null ? "—" : escapeHtml(fmtScaledNum(count))
          }</td></tr>`;
        });

      if (isHomeSvc && (meta.timerEvents || meta.hubEvents)) {
        const timerRows = renderEventRows(meta.timerEvents);
        const hubRows = renderEventRows(meta.hubEvents);
        eventBody.innerHTML =
          `<tr class="event-group-row"><th colspan="2">개인 타이머</th></tr>` +
          (timerRows.join("") || `<tr><td colspan="2">이벤트 없음</td></tr>`) +
          `<tr class="event-group-row"><th colspan="2">홈 기능</th></tr>` +
          (hubRows.join("") || `<tr><td colspan="2">이벤트 없음</td></tr>`);
      } else {
        const rows = renderEventRows(meta.events);
        eventBody.innerHTML =
          rows.join("") || `<tr><td colspan="2">이벤트 없음</td></tr>`;
      }
    }

    const notesEl = $("svcNotes");
    if (notesEl) {
      notesEl.innerHTML = (meta.notes || [])
        .map((n) => `<li>${escapeHtml(n)}</li>`)
        .join("");
    }

    if (isGroupSvc) renderGroupLedger();
  }

  const GROUP_LEDGER_TARGETS = [
    {
      key: "svc",
      dist: "dbGroupDistChart",
      invite: "dbInviteChart",
      inviteKpis: "dbInviteKpis",
      userCount: "userCount",
      userBody: "userGroupBody",
      groupBody: "groupBody",
      entryBody: "entryBody",
    },
    {
      key: "ops",
      dist: "opsGroupDistChart",
      invite: "opsInviteChart",
      inviteKpis: "opsInviteKpis",
      userCount: "opsUserCount",
      userBody: "opsUserGroupBody",
      groupBody: "opsGroupBody",
      entryBody: "opsEntryBody",
    },
  ];

  function renderOpsQuality() {
    const s = state.summary;
    if ($("opsMeta")) {
      $("opsMeta").textContent = `스냅샷 수집: ${state.snapshot?.collected_at || "-"} · manifest 최신 ${
        state.manifest?.latest_date || "-"
      }`;
    }
    const quality = [];
    if ((s.membership_count || 0) > 0 && (s.personal_session_count || 0) === 0) {
      quality.push({
        done: false,
        text: "멤버십 > 0 인데 개인 세션 0 (활동 없는 날일 수 있음)",
      });
    } else {
      quality.push({ done: true, text: "세션·멤버십 조합 이상 없음" });
    }
    quality.push({
      done: false,
      text: "퇴장·입장 이력(매번) 없음 → Phase3 UG_ENTER_HISTORY",
    });
    quality.push({
      done: false,
      text: "콕 발송 DB 없음 → Phase3 POKE_SEND",
    });
    quality.push({
      done: true,
      text: "초대·멤버십·타이머 원천은 파이프라인 수집 중",
    });
    const el = $("dbQualityList");
    if (!el) return;
    el.innerHTML = quality
      .map(
        (q) =>
          `<li class="${q.done ? "done" : "todo"}">${q.done ? "✓" : "○"} ${escapeHtml(
            q.text
          )}</li>`
      )
      .join("");
  }

  function renderGroupLedgerTarget(target, s, membership, userRows, groupRows, entries) {
    const distCanvas = $(target.dist);
    if (distCanvas) {
      destroyChart(target.key + "GroupDist");
      const dist = {};
      for (const u of userRows) {
        const k = String(Math.min(u.group_count, 5));
        dist[k] = (dist[k] || 0) + 1;
      }
      const labels = ["1", "2", "3", "4", "5+"];
      state.charts[target.key + "GroupDist"] = new Chart(distCanvas, {
        type: "bar",
        data: {
          labels: labels.map((l) => `${l}개`),
          datasets: [
            {
              label: "유저 수",
              data: labels.map((l) => dist[l === "5+" ? "5" : l] || 0),
              backgroundColor: CHART.red,
              borderRadius: 8,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: { y: { beginAtZero: true, title: { display: true, text: "명" } } },
        },
      });
    }

    const rate = inviteAcceptRate(s);
    const inviteCanvas = $(target.invite);
    if (inviteCanvas) {
      destroyChart(target.key + "Invite");
      state.charts[target.key + "Invite"] = new Chart(inviteCanvas, {
        type: "doughnut",
        data: {
          labels: ["생성", "응답"],
          datasets: [
            {
              data: [
                s.invitations_created_count || 0,
                s.invitations_responded_count || 0,
              ],
              backgroundColor: [CHART.red, CHART.black],
              borderWidth: 0,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { position: "bottom" } },
        },
      });
    }
    const inviteKpisEl = $(target.inviteKpis);
    if (inviteKpisEl) {
      renderKpiGrid(inviteKpisEl, [
        {
          label: "생성",
          value: fmtNum(s.invitations_created_count) || "0",
          source: "DB",
        },
        {
          label: "응답",
          value: fmtNum(s.invitations_responded_count) || "0",
          source: "DB",
        },
        {
          label: "응답/생성",
          value: rate == null ? "—" : fmtPct(rate),
          source: "DB",
          accent: true,
          pending: rate == null,
        },
      ]);
    }

    renderUserTable(userRows, target);
    renderGroupTable(groupRows, target.groupBody);
    renderEntries(entries, target.entryBody);
  }

  function renderGroupLedger() {
    const s = state.summary;
    const membership =
      state.snapshot?.group_participation?.membership_snapshot || [];
    state.userRows = buildUserRows(membership);
    const groupRows = buildGroupRows(membership);
    const entries = state.snapshot?.group_participation?.session_entries || [];
    for (const target of GROUP_LEDGER_TARGETS) {
      if (!$(target.dist) && !$(target.userBody)) continue;
      renderGroupLedgerTarget(target, s, membership, state.userRows, groupRows, entries);
    }
  }

  /* ===== DB ===== */
  function renderDb() {
    if (!$("dbMeta")) return;
    const s = state.summary;
    $("dbMeta").textContent = `수집: ${state.snapshot?.collected_at || "-"}`;
    const homeSec = Number(s.personal_home_focus_seconds) || 0;
    const roomSec = Number(s.personal_group_focus_seconds) || 0;
    const groupSec = Number(s.group_focus_seconds) || 0;
    const stayReady = s.group_stay_seconds != null;
    renderKpiGrid($("dbFocusKpis"), [
      {
        label: "그룹 세션(체류)",
        value: stayReady ? fmtDur(s.group_stay_seconds) : "—",
        pending: !stayReady,
        source: "대기",
        help: "입장~퇴장 체류. 퇴장 로그 미연결",
      },
      {
        label: "홈에서 시작",
        value: fmtDur(homeSec),
        source: "DB",
        accent: true,
        secondary: "focus_session · home",
        aggKind: "db_duration_sum",
        help: "focus_session · group_id 없음",
      },
      {
        label: "그룹 공유",
        value: fmtDur(groupSec),
        source: "DB",
        accent: true,
        secondary: "group_focus_session",
        aggKind: "db_duration_sum",
        help: "group_focus_session",
      },
      {
        label: "그룹에서 시작",
        value: fmtDur(roomSec),
        source: "DB",
        accent: true,
        secondary: "focus_session · group context",
        aggKind: "db_duration_sum",
        help: "focus_session · group_id 있음",
      },
      {
        label: "개인 세션 수",
        value: fmtNum(s.personal_session_count) || "0",
        source: "DB",
        secondary: "focus_session count",
        aggKind: "db_count_sum",
        help: "focus_session 세션 건수",
      },
      {
        label: "그룹 타이머 수",
        value: fmtNum(s.group_session_count) || "0",
        source: "DB",
        secondary: "group_focus_session count",
        aggKind: "db_count_sum",
        help: "group_focus_session 세션 건수",
      },
    ]);

    destroyChart("dbFocus");
    state.charts.dbFocus = new Chart($("dbFocusChart"), {
      type: "bar",
      data: {
        labels: ["홈시작(분)", "그룹시작(분)", "그룹공유(분)"],
        datasets: [
          {
            data: [homeSec / 60, roomSec / 60, groupSec / 60],
            backgroundColor: [CHART.red, CHART.dark, CHART.black],
            borderRadius: 8,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true } },
      },
    });

    const membership =
      state.snapshot?.group_participation?.membership_snapshot || [];
    state.userRows = buildUserRows(membership);
    const dist = {};
    for (const u of state.userRows) {
      const k = String(Math.min(u.group_count, 5));
      dist[k] = (dist[k] || 0) + 1;
    }
    const labels = ["1", "2", "3", "4", "5+"];
    destroyChart("dbGroupDist");
    state.charts.dbGroupDist = new Chart($("dbGroupDistChart"), {
      type: "bar",
      data: {
        labels: labels.map((l) => `${l}개`),
        datasets: [
          {
            label: "유저 수",
            data: labels.map((l) => dist[l === "5+" ? "5" : l] || 0),
            backgroundColor: CHART.red,
            borderRadius: 8,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true, title: { display: true, text: "명" } } },
      },
    });

    const rate = inviteAcceptRate(s);
    destroyChart("dbInvite");
    state.charts.dbInvite = new Chart($("dbInviteChart"), {
      type: "doughnut",
      data: {
        labels: ["생성", "응답"],
        datasets: [
          {
            data: [
              s.invitations_created_count || 0,
              s.invitations_responded_count || 0,
            ],
            backgroundColor: [CHART.red, CHART.black],
            borderWidth: 0,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: "bottom" } },
      },
    });
    renderKpiGrid($("dbInviteKpis"), [
      {
        label: "생성",
        value: fmtNum(s.invitations_created_count) || "0",
        source: "DB",
      },
      {
        label: "응답",
        value: fmtNum(s.invitations_responded_count) || "0",
        source: "DB",
      },
      {
        label: "응답/생성",
        value: rate == null ? "—" : fmtPct(rate),
        source: "DB",
        accent: true,
        pending: rate == null,
      },
    ]);

    renderUserTable(state.userRows);
    renderGroupTable(buildGroupRows(membership));
    renderEntries(state.snapshot?.group_participation?.session_entries || []);

    const quality = [];
    if ((s.membership_count || 0) > 0 && (s.personal_session_count || 0) === 0) {
      quality.push({
        done: false,
        text: "멤버십 > 0 인데 개인 세션 0 (활동 없는 날일 수 있음)",
      });
    } else {
      quality.push({ done: true, text: "세션·멤버십 조합 이상 없음" });
    }
    quality.push({
      done: false,
      text: "퇴장·입장 이력(매번) 없음 → Phase3 UG_ENTER_HISTORY",
    });
    quality.push({
      done: false,
      text: "콕 발송 DB 없음 → Phase3 POKE_SEND",
    });
    quality.push({
      done: true,
      text: "초대·멤버십·타이머 원천은 파이프라인 수집 중",
    });
    $("dbQualityList").innerHTML = quality
      .map(
        (q) =>
          `<li class="${q.done ? "done" : "todo"}">${q.done ? "✓" : "○"} ${escapeHtml(
            q.text
          )}</li>`
      )
      .join("");
  }

  /* ===== GA ===== */
  function renderGa() {
    const ga = gaMetricsView();
    const ready = gaReady();
    const manual = state.gaMetrics?.source === "ga4_manual";
    $("gaMeta").textContent = ready
      ? state.previewFull
        ? "미리보기 예시 수치 (실제 GA 아님)"
        : manual
          ? `수동 반영 · ${state.gaMetrics?.collected_at || "-"} · 실시간 아님(콘솔 스냅샷)`
          : `수집: ${state.gaMetrics?.collected_at || "-"}`
      : "GA 콘솔 숫자를 수동 입력하면 채워집니다 · python scripts/update_ga_manual.py";

    renderKpiGrid($("gaBasicKpis"), [
      {
        label: "신규",
        value: ready ? fmtScaledNum(ga.new_users) : "—",
        source: manual ? "GA 수동" : "GA",
        help: "그날 처음 온 사람 수",
        accent: true,
        pending: !ready || ga.new_users == null,
        chipClass: "phase2",
        aggKind: "ga_users",
      },
      {
        label: "활성(DAU)",
        value: ready ? fmtScaledNum(ga.active_users) : "—",
        source: manual ? "GA 수동" : "GA",
        help: "그날 앱 켠 사람 수",
        pending: !ready || ga.active_users == null,
        chipClass: "phase2",
        aggKind: "ga_users",
      },
      {
        label: "세션",
        value: ready ? fmtScaledNum(ga.sessions) : "—",
        source: manual ? "GA 수동" : "GA",
        help: "그날 방문(세션) 횟수",
        pending: !ready || ga.sessions == null,
        chipClass: "phase2",
        aggKind: "ga_event_count",
      },
      {
        label: "참여 세션",
        value: ready && ga.engaged_sessions != null ? fmtScaledNum(ga.engaged_sessions) : "—",
        source: manual ? "GA 수동" : "GA",
        help: "의미 있게 머문 방문 수",
        pending: ga.engaged_sessions == null,
        chipClass: "phase2",
        aggKind: "ga_event_count",
      },
      {
        label: "페이지뷰",
        value: ready && ga.screen_page_views != null ? fmtScaledNum(ga.screen_page_views) : "—",
        source: "GA",
        help: "screenPageViews",
        pending: ga.screen_page_views == null,
        chipClass: "phase2",
        aggKind: "ga_event_count",
      },
      {
        label: "이벤트 총수",
        value: ready && ga.event_count_total != null ? fmtScaledNum(ga.event_count_total) : "—",
        source: "GA",
        help: "그날 GA에 찍힌 모든 이벤트 합",
        accent: true,
        pending: ga.event_count_total == null,
        chipClass: "phase2",
        aggKind: "ga_event_count",
      },
      {
        label: "참여율",
        value: ready && ga.engagement_rate != null ? fmtPct(ga.engagement_rate) : "—",
        source: "GA",
        help: "engagementRate",
        pending: ga.engagement_rate == null,
        chipClass: "phase2",
      },
      {
        label: "이탈률",
        value: ready && ga.bounce_rate != null ? fmtPct(ga.bounce_rate) : "—",
        source: manual ? "GA 수동" : "GA",
        help: "바로 나간 방문 비율",
        pending: ga.bounce_rate == null,
        chipClass: "phase2",
      },
      {
        label: "유저당 세션",
        value:
          ready && ga.sessions_per_user != null
            ? Number(ga.sessions_per_user).toFixed(2)
            : "—",
        source: "GA",
        help: "sessionsPerUser",
        pending: ga.sessions_per_user == null,
        chipClass: "phase2",
      },
      {
        label: "D1",
        value: ready && ga.retention_d1 != null ? fmtPct(ga.retention_d1) : "—",
        source: manual ? "GA 수동" : "GA",
        help: "코호트 리텐션(추후 API)",
        accent: true,
        pending: ga.retention_d1 == null,
        chipClass: "phase2",
      },
      {
        label: "D7",
        value: ready && ga.retention_d7 != null ? fmtPct(ga.retention_d7) : "—",
        source: manual ? "GA 수동" : "GA",
        help: "코호트 리텐션(추후 API)",
        pending: ga.retention_d7 == null,
        chipClass: "phase2",
      },
      {
        label: "D30",
        value: ready && ga.retention_d30 != null ? fmtPct(ga.retention_d30) : "—",
        source: manual ? "GA 수동" : "GA",
        help: "코호트 리텐션(추후 API)",
        pending: ga.retention_d30 == null,
        chipClass: "phase2",
      },
    ]);

    $("gaUsersOverlay").classList.toggle("hidden", ready);
    $("gaRetentionOverlay").classList.toggle("hidden", ready);

    destroyChart("gaUsers");
    const gaNewShow = ready && ga.new_users != null ? Number(fmtScaledNum(ga.new_users).replace(/,/g, "")) : 0;
    const gaActiveShow =
      ready && ga.active_users != null ? Number(fmtScaledNum(ga.active_users).replace(/,/g, "")) : 0;
    state.charts.gaUsers = new Chart($("gaUsersChart"), {
      type: "bar",
      data: {
        labels: ["신규", "활성"],
        datasets: [
          {
            data: ready ? [gaNewShow, gaActiveShow] : [0, 0],
            backgroundColor: [CHART.red, CHART.black],
            borderRadius: 10,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true } },
      },
    });

    destroyChart("gaRetention");
    state.charts.gaRetention = new Chart($("gaRetentionChart"), {
      type: "bar",
      data: {
        labels: ["D1", "D7", "D30"],
        datasets: [
          {
            data: ready
              ? [
                  (ga.retention_d1 || 0) * 100,
                  (ga.retention_d7 || 0) * 100,
                  (ga.retention_d30 || 0) * 100,
                ]
              : [0, 0, 0],
            backgroundColor: CHART.red,
            borderRadius: 10,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true, max: 100, title: { display: true, text: "%" } } },
      },
    });

    const poke = eventCount("poke_response");
    const stay = eventCount("group_stay_duration");
    const entries = state.summary.session_entry_count || 0;
    const focusMin =
      ((state.summary.personal_focus_seconds || 0) +
        (state.summary.group_focus_seconds || 0)) /
      60;

    renderGaCorrGrid({ poke, stay, entries, focusMin });

    renderGaEventTable($("gaEventFilter")?.value || "");
  }

  function renderGaCorrGrid(ctx = {}) {
    const grid = $("gaCorrGrid");
    if (!grid) return;
    const poke = ctx.poke ?? eventCount("poke_response");
    const stay = ctx.stay ?? eventCount("group_stay_duration");
    const entries = ctx.entries ?? (state.summary?.session_entry_count || 0);
    const focusMin =
      ctx.focusMin ??
      ((state.summary?.personal_focus_seconds || 0) +
        (state.summary?.group_focus_seconds || 0)) /
        60;

    const corrs = [
      {
        title: "콕 응답 → 그룹 입장",
        pair: "GA poke_response × DB session_entries",
        result:
          poke != null
            ? `응답 ${poke} · 입장 ${entries}`
            : state.previewFull
              ? `응답 ${PREVIEW.ga.event_counts.poke_response} · 입장 ${entries}`
              : "건수 대기 (이벤트는 심어짐)",
        pending: poke == null && !state.previewFull,
        phase: "P2",
      },
      {
        title: "체류 vs 집중",
        pair: "GA group_stay_duration × DB focus",
        result:
          stay != null || state.previewFull
            ? `체류이벤트 ${stay ?? PREVIEW.ga.event_counts.group_stay_duration} · 집중 ${focusMin.toFixed(
                0
              )}분`
            : "체류 건수 대기 · 집중은 DB",
        pending: stay == null && !state.previewFull,
        phase: "P2",
      },
      {
        title: "유입 → 로그인",
        pair: "first_entrance × login",
        result: state.previewFull
          ? `${PREVIEW.ga.event_counts.first_entrance} → ${PREVIEW.ga.event_counts.login}`
          : "두 이벤트 계측됨 · 건수는 API 후",
        pending: !state.previewFull,
        phase: "P2",
      },
      {
        title: "콕 발송 → 응답 → 입장",
        pair: "POKE_SEND(미수집) × poke_response × 입장",
        result: state.previewFull
          ? `${PREVIEW.phase3.poke_funnel.send} → ${PREVIEW.phase3.poke_funnel.respond} → ${PREVIEW.phase3.poke_funnel.enter}`
          : "발송 로그 없음 (Phase3)",
        pending: !state.previewFull,
        phase: "P3",
      },
    ];

    grid.innerHTML = corrs
      .map(
        (c) => `<article class="corr-card ${c.pending ? "pending" : ""}">
        <h3>${escapeHtml(c.title)} <span class="muted" style="font-weight:500;font-size:0.75rem">${escapeHtml(
          c.phase
        )}</span></h3>
        <div class="pair">${escapeHtml(c.pair)}</div>
        <div class="result">${escapeHtml(c.result)}</div>
      </article>`
      )
      .join("");
  }

  function renderGaEventTable(filter) {
    let events = state.gaEvents?.events || [];
    if (state.previewFull) {
      events = events.map((e) => ({
        ...e,
        count: PREVIEW.ga.event_counts[e.event_name] ?? e.count,
        status: "preview_counts",
        in_ga4: true,
      }));
    }
    events = [...events].sort((a, b) => {
      const ac = a.count == null ? -1 : Number(a.count);
      const bc = b.count == null ? -1 : Number(b.count);
      if (bc !== ac) return bc - ac;
      return String(a.event_name).localeCompare(String(b.event_name));
    });
    const q = filter.trim().toLowerCase();
    const filtered = q
      ? events.filter(
          (e) =>
            e.event_name.toLowerCase().includes(q) ||
            (e.label_ko || "").toLowerCase().includes(q)
        )
      : events;
    const gaHit = filtered.filter((e) => e.in_ga4 || (e.count != null && e.count > 0)).length;
    const meta = state.gaEvents || {};
    $("gaEventCount").textContent = `${filtered.length}개 표시 · GA수신명 ${
      meta.ga4_event_name_count ?? gaHit
    } · FE카탈로그 ${meta.fe_catalog_count ?? "-"}`;
    $("gaEventBody").innerHTML = filtered.length
      ? filtered
          .map((e) => {
            const inGa =
              e.in_ga4 === true || (e.count != null && Number(e.count) > 0);
            return `<tr>
          <td><code>${escapeHtml(e.event_name)}</code></td>
          <td>${escapeHtml(e.label_ko || e.event_name)}</td>
          <td>${e.instrumented ? "✓" : "자동/기타"}</td>
          <td>${inGa ? "✓" : "—"}</td>
          <td>${e.count == null ? "—" : escapeHtml(fmtScaledNum(e.count))}</td>
          <td class="text-mg-500">${escapeHtml(e.note || e.status || "")}</td>
        </tr>`;
          })
          .join("")
      : `<tr><td colspan="6" class="empty">이벤트 목록 없음</td></tr>`;
  }

  /* ===== FUNNEL Phase3 ===== */
  function renderFunnel() {
    const s = state.summary;
    const ga = gaMetricsView();
    const preview = state.previewFull;

    // Journey funnel values (relative index 0-100)
    const stages = [
      {
        label: "유입",
        value: preview || gaReady() ? ga.new_users || PREVIEW.ga.new_users : null,
      },
      {
        label: "온보딩",
        value: preview ? PREVIEW.phase3.onboarding_steps.at(-1) : null,
      },
      {
        label: "타이머",
        value:
          (s.personal_session_count || 0) + (s.group_session_count || 0) ||
          (preview ? 40 : 0),
      },
      {
        label: "그룹입장",
        value: s.session_entry_count || (preview ? 25 : 0),
      },
      {
        label: "D1잔존",
        value: preview || gaReady() ? Math.round((ga.retention_d1 || PREVIEW.ga.retention_d1) * 100) : null,
      },
    ];

    destroyChart("funnel");
    state.charts.funnel = new Chart($("funnelChart"), {
      type: "bar",
      data: {
        labels: stages.map((x) => x.label),
        datasets: [
          {
            label: "상대 지표",
            data: stages.map((x) => x.value ?? 0),
            backgroundColor: stages.map((x) =>
              x.value == null ? CHART.graySoft : CHART.red
            ),
            borderRadius: 8,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              afterLabel: (ctx) =>
                stages[ctx.dataIndex].value == null
                  ? "데이터 없음 (보강 필요)"
                  : "",
            },
          },
        },
        scales: { y: { beginAtZero: true } },
      },
    });

    $("funnelStages").innerHTML = [
      {
        title: "유입",
        body: gaReady() || preview ? "GA 신규·first_entrance" : "Phase2 GA API",
        gap: !(gaReady() || preview),
      },
      {
        title: "온보딩",
        body: preview
          ? "step 잔존 곡선 표시 중(예시)"
          : "단계 로그 없음 → ONBOARDING_STEP",
        gap: !preview,
      },
      {
        title: "핵심 사용",
        body: "타이머 DB 수집 중 (가장 강함)",
        gap: false,
      },
      {
        title: "그룹·소셜",
        body: preview
          ? "콕 풀퍼널 예시 표시"
          : "입장·초대 OK / 콕발송·입장이력 약함",
        gap: !preview,
      },
      {
        title: "이탈",
        body: preview
          ? "탈퇴 사유 예시 가능"
          : "탈퇴 사유·리포트 조회 로그 없음",
        gap: !preview,
      },
    ]
      .map(
        (x) => `<article class="stage-card ${x.gap ? "gap" : ""}">
        <div class="title">${escapeHtml(x.title)}</div>
        <div class="body">${escapeHtml(x.body)}</div>
      </article>`
      )
      .join("");

    const linksEl = $("journeyLinks");
    if (linksEl) {
      const links = [
        { step: "캐릭터·온보딩", service: "character", title: "캐릭터" },
        { step: "홈·타이머", service: "home", title: "홈" },
        { step: "할 일", service: "todo", title: "할 일" },
        { step: "그룹·라운지", service: "group", title: "그룹" },
        { step: "메이트·콕", service: "mate", title: "메이트" },
        { step: "회고", service: "record", title: "집중 리포트" },
      ];
      linksEl.innerHTML = links
        .map(
          (l) => `<a href="#" class="journey-link" data-view="svc" data-service="${escapeHtml(
            l.service
          )}">
          <span class="journey-link__step">${escapeHtml(l.step)}</span>
          <span class="journey-link__title">${escapeHtml(l.title)}</span>
          <span class="journey-link__arrow" aria-hidden="true">→</span>
        </a>`
        )
        .join("");
    }

    const pokeReady = preview;
    $("pokeOverlay").classList.toggle("hidden", pokeReady);
    destroyChart("poke");
    const pf = PREVIEW.phase3.poke_funnel;
    state.charts.poke = new Chart($("pokeFunnelChart"), {
      type: "bar",
      data: {
        labels: ["발송", "응답", "입장"],
        datasets: [
          {
            data: pokeReady
              ? [pf.send, pf.respond, pf.enter]
              : [
                  0,
                  scaleCount(eventCount("poke_response") || 0) || 0,
                  scaleCount(s.session_entry_count) || 0,
                ],
            backgroundColor: [CHART.red, CHART.dark, CHART.gray],
            borderRadius: 10,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true } },
      },
    });

    const obReady = preview;
    $("onboardOverlay").classList.toggle("hidden", obReady);
    destroyChart("onboard");
    state.charts.onboard = new Chart($("onboardingChart"), {
      type: "line",
      data: {
        labels: PREVIEW.phase3.onboarding_steps.map((_, i) => `S${i}`),
        datasets: [
          {
            label: "잔존 %",
            data: obReady ? PREVIEW.phase3.onboarding_steps : PREVIEW.phase3.onboarding_steps.map(() => null),
            borderColor: CHART.red,
            tension: 0.35,
            spanGaps: true,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true, max: 100 } },
      },
    });
  }

  /* ===== users tables / compose (reuse) ===== */
  function buildUserRows(membership) {
    const byUser = new Map();
    for (const row of membership || []) {
      const key = row.user_id || row.user_name;
      if (!byUser.has(key)) {
        byUser.set(key, { user_name: row.user_name || "(이름없음)", groups: [] });
      }
      byUser.get(key).groups.push({
        group_name: row.group_name || "",
        entered_at: row.entered_at,
      });
    }
    return [...byUser.values()]
      .map((u) => ({
        ...u,
        group_count: u.groups.length,
        latest_entered_at:
          u.groups.map((g) => g.entered_at).filter(Boolean).sort().at(-1) || "-",
        search: `${u.user_name} ${u.groups.map((g) => g.group_name).join(" ")}`.toLowerCase(),
      }))
      .sort((a, b) => b.group_count - a.group_count);
  }

  function renderUserTable(rows, target) {
    const countEl = $(target?.userCount || "userCount");
    const bodyEl = $(target?.userBody || "userGroupBody");
    if (!bodyEl) return;
    if (countEl) countEl.textContent = `${rows.length}명`;
    bodyEl.innerHTML = rows.length
      ? rows
          .map((u) => {
            const tags = u.groups
              .map((g) => `<span class="tag">${escapeHtml(g.group_name)}</span>`)
              .join("");
            return `<tr><td>${escapeHtml(u.user_name)}</td><td>${u.group_count}</td>
            <td><div class="tags">${tags}</div></td><td>${escapeHtml(
              String(u.latest_entered_at)
            )}</td></tr>`;
          })
          .join("")
      : `<tr><td colspan="4" class="empty">없음</td></tr>`;
  }

  function buildGroupRows(membership) {
    const byGroup = new Map();
    for (const row of membership || []) {
      const key = row.group_id || row.group_name;
      if (!byGroup.has(key)) {
        byGroup.set(key, {
          group_name: row.group_name || "",
          members: 0,
          hosts: [],
          entered: [],
        });
      }
      const g = byGroup.get(key);
      g.members += 1;
      if (row.role === "HOST") g.hosts.push(row.user_name || "");
      if (row.entered_at) g.entered.push(row.entered_at);
    }
    return [...byGroup.values()]
      .map((g) => ({
        ...g,
        hosts: g.hosts.join(", ") || "-",
        latest: g.entered.sort().at(-1) || "-",
      }))
      .sort((a, b) => b.members - a.members);
  }

  function renderGroupTable(rows, bodyId = "groupBody") {
    const bodyEl = $(bodyId);
    if (!bodyEl) return;
    bodyEl.innerHTML = rows.length
      ? rows
          .map(
            (g) =>
              `<tr><td>${escapeHtml(g.group_name)}</td><td>${g.members}</td><td>${escapeHtml(
                g.hosts
              )}</td><td>${escapeHtml(String(g.latest))}</td></tr>`
          )
          .join("")
      : `<tr><td colspan="4" class="empty">없음</td></tr>`;
  }

  function renderEntries(entries, bodyId = "entryBody") {
    const bodyEl = $(bodyId);
    if (!bodyEl) return;
    bodyEl.innerHTML = entries?.length
      ? entries
          .map(
            (e) =>
              `<tr><td>${escapeHtml(e.user_name || "")}</td><td>${escapeHtml(
                e.group_name || ""
              )}</td><td>${escapeHtml(e.participation_status || "")}</td><td>${escapeHtml(
                String(e.entered_at || "")
              )}</td></tr>`
          )
          .join("")
      : `<tr><td colspan="4" class="empty">당일 입장 없음</td></tr>`;
  }

  function resolveValue(item) {
    const binding = item.value_binding || { type: "none" };
    const summary = state.summary || {};
    const prev = state.prevSummary || {};
    if (binding.type === "db_summary" && binding.key) {
      if (binding.key.includes("+")) {
        const keys = binding.key.split("+").map((k) => k.trim());
        const sum = keys.reduce((a, k) => a + (Number(summary[k]) || 0), 0);
        const d = deltaFromKeys(summary, prev, keys);
        return {
          display: fmtNum(sum),
          status: "ok",
          chip: "DB",
          delta: d?.text,
          deltaTone: d?.tone,
        };
      }
      const raw = summary[binding.key];
      if (raw == null) return { display: "—", status: "pending", chip: "DB" };
      const isSec = String(binding.key).includes("seconds");
      const d = calcDelta(raw, prev[binding.key]);
      return {
        display: isSec ? fmtDur(raw) : fmtNum(raw),
        status: "ok",
        chip: "DB",
        delta: d?.text,
        deltaTone: d?.tone,
      };
    }
    if (binding.type === "ga_event" && binding.event_name) {
      const c = eventCount(binding.event_name);
      if (c != null) return { display: fmtNum(c), status: "ok", chip: "GA" };
      return { display: "건수 대기", status: "awaiting_count", chip: "GA 심음" };
    }
    if (item.instrumented_in_fe || item.category === "GA4심어둔이벤트") {
      return { display: "건수 대기", status: "awaiting_count", chip: "GA 심음" };
    }
    return { display: "미수집", status: "pending", chip: "대기" };
  }

  function catalogItems() {
    return state.catalog?.items || [];
  }

  function fillCatalogFilters() {
    /* journey options are static in HTML; lens is button-driven */
  }

  function renderCatalogList() {
    const q = ($("catalogFilter").value || "").trim().toLowerCase();
    const journey = $("catalogJourney")?.value || "";
    const st = $("catalogStatus").value;
    const lens = state.catalogLens || "";
    let items = catalogItems();
    if (lens) items = items.filter((i) => i.lens === lens);
    if (journey) items = items.filter((i) => i.journey === journey);
    if (q) {
      items = items.filter((i) =>
        `${i.id} ${i.name} ${i.category} ${i.subcategory} ${i.lens} ${i.journey}`
          .toLowerCase()
          .includes(q)
      );
    }
    if (st === "ga_fe") {
      items = items.filter(
        (i) => i.instrumented_in_fe || i.value_binding?.type === "ga_event"
      );
    } else if (st === "has_value") {
      items = items.filter((i) => resolveValue(i).status === "ok");
    } else if (st === "pending") {
      items = items.filter((i) => resolveValue(i).status !== "ok");
    }

    const journeyOrder = ["onboarding", "core", "social", "system"];
    items.sort((a, b) => {
      const ja = journeyOrder.indexOf(a.journey);
      const jb = journeyOrder.indexOf(b.journey);
      if (ja !== jb) return (ja < 0 ? 99 : ja) - (jb < 0 ? 99 : jb);
      return String(a.category).localeCompare(String(b.category), "ko");
    });

    const lensHint = lens ? LENS_LABEL[lens] || lens : "전체";
    const journeyHint = journey ? JOURNEY_LABEL[journey] || journey : "전체";
    $("catalogCount").textContent = `${items.length}개 · ${lensHint} × ${journeyHint}`;
    $("catalogList").innerHTML = items
      .map((i) => {
        const v = resolveValue(i);
        const jLabel = JOURNEY_LABEL[i.journey] || i.journey || "-";
        const lLabel = LENS_LABEL[i.lens] || i.lens || "-";
        const tip = metricHelp(i.name, i);
        return `<button type="button" class="catalog-item" data-id="${escapeHtml(
          i.id
        )}" title="${escapeHtml(tip)}" data-tip="${escapeHtml(tip)}">
          <span class="code">${escapeHtml(i.id)}</span>
          <span class="title">${escapeHtml(i.name)}</span>
          <span class="meta">${escapeHtml(lLabel)} · ${escapeHtml(jLabel)} · ${escapeHtml(
          i.category || ""
        )} · ${escapeHtml(v.chip)}</span>
        </button>`;
      })
      .join("");
    $("catalogList").querySelectorAll(".catalog-item").forEach((btn) => {
      btn.addEventListener("click", () => {
        if (!state.boardIds.includes(btn.dataset.id)) state.boardIds.push(btn.dataset.id);
        renderBoard();
      });
    });
  }

  function renderBoard() {
    const empty = $("boardEmpty");
    const grid = $("boardGrid");
    if (!state.boardIds.length) {
      grid.innerHTML = "";
      empty.classList.add("show");
      updateBoardMeta();
      return;
    }
    empty.classList.remove("show");
    const byId = new Map(catalogItems().map((i) => [i.id, i]));
    grid.innerHTML = state.boardIds
      .map((id) => {
        const item = byId.get(id);
        if (!item) return "";
        const v = resolveValue(item);
        const tip = metricHelp(item.name, item);
        return `<article class="metric-card board-card" data-tip="${escapeHtml(
          tip
        )}" title="${escapeHtml(tip)}">
          <button type="button" class="remove" data-id="${escapeHtml(id)}">×</button>
          <div class="metric-card__label">${escapeHtml(item.name)}</div>
          <div class="metric-card__value ${v.status === "ok" ? "" : "is-muted"}">${escapeHtml(v.display)}</div>
          <div class="metric-card__footer">
            <span class="metric-card__chip ${v.status === "ok" ? "db" : "phase2"}">${escapeHtml(v.chip)}</span>
            ${
              v.delta
                ? `<span class="metric-card__delta ${v.deltaTone || "flat"}">${escapeHtml(
                    v.delta
                  )}</span>`
                : ""
            }
            <span class="metric-card__aux">${escapeHtml(
              JOURNEY_LABEL[item.journey] || item.category || ""
            )}</span>
          </div>
        </article>`;
      })
      .join("");
    grid.querySelectorAll(".remove").forEach((b) => {
      b.addEventListener("click", () => {
        state.boardIds = state.boardIds.filter((x) => x !== b.dataset.id);
        renderBoard();
      });
    });
    updateBoardMeta();
  }

  function updateDatePickerBtn() {
    const btn = $("datePickerBtn");
    if (!btn) return;
    const label = selectionLabel(state.dateFrom, state.dateTo);
    btn.textContent = label || "날짜 선택";
  }

  function setCalOpen(open) {
    state.cal.open = open;
    const pop = $("datePickerPop");
    const btn = $("datePickerBtn");
    if (!pop || !btn) return;
    pop.classList.toggle("hidden", !open);
    btn.setAttribute("aria-expanded", open ? "true" : "false");
    if (open) {
      state.cal.pickingEnd = false;
      state.cal.draftFrom = state.dateFrom;
      state.cal.draftTo = state.dateTo;
      renderCalendar();
    } else {
      state.cal.pickingEnd = false;
    }
  }

  function applyCalendarSelection(from, to, { close = true } = {}) {
    const a = from <= to ? from : to;
    const b = from <= to ? to : from;
    state.cal.draftFrom = a;
    state.cal.draftTo = b;
    state.cal.pickingEnd = false;
    if (close) setCalOpen(false);
    else renderCalendar();
    return showSelection(a, b);
  }

  function renderCalendar() {
    const title = $("calTitle");
    const grid = $("calGrid");
    const hint = $("calHint");
    if (!title || !grid) return;
    const y = state.cal.viewYear;
    const m = state.cal.viewMonth;
    title.textContent = `${y}년 ${m + 1}월`;

    const minD = selectableMinDate();
    const maxD = selectableMaxDate();
    const has = availableDateSet();
    const first = new Date(y, m, 1);
    const startPad = first.getDay();
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    grid.innerHTML = "";

    for (let i = 0; i < startPad; i++) {
      grid.appendChild(document.createElement("span"));
    }
    for (let day = 1; day <= daysInMonth; day++) {
      const iso = `${y}-${String(m + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = String(day);
      btn.dataset.date = iso;
      const disabled = iso < minD || iso > maxD;
      btn.disabled = disabled;
      if (has.has(iso)) btn.classList.add("has-data");
      applyReleaseDayMarker(btn, eventsForDates([iso]));
      if (!has.has(iso) && !disabled) btn.classList.add("muted");
      const a = state.cal.draftFrom;
      const b = state.cal.draftTo || state.cal.draftFrom;
      const from = a && b ? (a <= b ? a : b) : a;
      const to = a && b ? (a <= b ? b : a) : a;
      const isMulti = from && to && from !== to;
      const dow = new Date(y, m, day - 1).getDay();
      if (isMulti && iso >= from && iso <= to) {
        btn.classList.add("in-range");
        if (iso === from) {
          btn.classList.add("range-start");
          if (dow < 6) btn.classList.add("range-bridge-after");
        } else if (iso === to) {
          btn.classList.add("range-end");
          if (dow > 0) btn.classList.add("range-bridge-before");
        } else {
          btn.classList.add("range-middle");
        }
      } else if (iso === from) {
        btn.classList.add("selected");
      }
      if (state.cal.pickingEnd && iso === state.cal.draftFrom) {
        btn.classList.add("range-start", "is-picking-end");
      }
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        onCalDayClick(iso);
      });
      grid.appendChild(btn);
    }
    const applyBtn = $("calApply");
    if (applyBtn) applyBtn.disabled = !state.cal.draftFrom;

    const preview = $("calRangePreview");
    if (preview) {
      const a = state.cal.draftFrom;
      const b = state.cal.draftTo || state.cal.draftFrom;
      if (!a) {
        preview.textContent = "날짜를 선택하세요";
        preview.classList.remove("is-range", "is-picking");
      } else if (state.cal.pickingEnd) {
        preview.textContent = `${a} → 종료일 선택`;
        preview.classList.add("is-picking");
        preview.classList.remove("is-range");
      } else if (b && a !== b) {
        const from = a <= b ? a : b;
        const to = a <= b ? b : a;
        const days = eachDateInclusive(from, to).length;
        preview.textContent = `${from} — ${to} · ${days}일`;
        preview.classList.add("is-range");
        preview.classList.remove("is-picking");
      } else {
        preview.textContent = a;
        preview.classList.remove("is-range", "is-picking");
      }
    }

    if (hint) {
      if (state.cal.pickingEnd) {
        hint.textContent = `종료일 선택 · 또는 「${calendarEndShortcutLabel()}」`;
      } else if (
        state.cal.draftFrom &&
        state.cal.draftTo &&
        state.cal.draftFrom !== state.cal.draftTo
      ) {
        hint.textContent = "홈에서 일평균·합산을 선택할 수 있습니다";
      } else if (state.cal.draftFrom) {
        hint.textContent = "다른 날짜를 누르면 기간 선택";
      } else {
        hint.textContent = "시작일 선택 → 종료일 선택 → 적용";
      }
    }

    const quick = $("calQuickActions");
    const quickBtn = $("calEndLatest");
    if (quick && quickBtn) {
      const showQuick = state.cal.pickingEnd && state.cal.draftFrom;
      quick.classList.toggle("hidden", !showQuick);
      if (showQuick) {
        const endIso = calendarEndShortcutDate();
        quickBtn.textContent = calendarEndShortcutLabel(endIso);
        quickBtn.disabled = !endIso || endIso < selectableMinDate();
      }
    }

    syncRangeAggUI();
  }

  function onCalDayClick(iso) {
    // 드래프트만 변경. showSelection은 「적용」에서만.
    if (!state.cal.pickingEnd) {
      state.cal.draftFrom = iso;
      state.cal.draftTo = iso;
      state.cal.pickingEnd = true;
      focusCalendarOnDate(calendarEndShortcutDate() || iso);
      renderCalendar();
      return;
    }
    state.cal.draftTo = iso;
    state.cal.pickingEnd = false;
    renderCalendar();
  }

  function emptySummary() {
    return {
      membership_count: 0,
      session_entry_count: 0,
      invitations_created_count: 0,
      invitations_responded_count: 0,
      personal_session_count: 0,
      group_session_count: 0,
      personal_focus_seconds: 0,
      personal_home_focus_seconds: 0,
      personal_group_focus_seconds: 0,
      group_focus_seconds: 0,
      group_stay_seconds: null,
      activity_log_count: 0,
      activity_unique_users: 0,
    };
  }

  function emptyActivityLogs() {
    return {
      total_events: 0,
      unique_users: 0,
      unique_sessions: 0,
      distinct_event_types: 0,
      by_event: [],
      samples: [],
      note: null,
    };
  }

  function activityReady() {
    const a = state.activityLogs;
    return !!(a && Number(a.total_events || 0) > 0);
  }

  function aggregateActivityLogs(list) {
    const out = emptyActivityLogs();
    const map = new Map();
    let lastSamples = [];
    for (const a of list) {
      if (!a) continue;
      out.total_events += Number(a.total_events || 0);
      out.unique_users += Number(a.unique_users || 0);
      out.unique_sessions += Number(a.unique_sessions || 0);
      if (a.samples?.length) lastSamples = a.samples;
      for (const e of a.by_event || []) {
        const key = `${e.event_type}|${e.event_category}|${e.event_action}`;
        const prev = map.get(key) || {
          event_type: e.event_type,
          event_category: e.event_category,
          event_action: e.event_action,
          event_count: 0,
          unique_users: 0,
          unique_sessions: 0,
        };
        prev.event_count += Number(e.event_count || 0);
        prev.unique_users += Number(e.unique_users || 0);
        prev.unique_sessions += Number(e.unique_sessions || 0);
        map.set(key, prev);
      }
    }
    out.by_event = [...map.values()].sort(
      (a, b) => Number(b.event_count) - Number(a.event_count)
    );
    out.distinct_event_types = new Set(out.by_event.map((e) => e.event_type)).size;
    out.samples = lastSamples;
    out.note = out.total_events
      ? null
      : "activity_logs에 해당 기간 이벤트가 없습니다 (테이블은 연결됨)";
    return out;
  }

  function renderLogs() {
    const a = state.activityLogs || emptyActivityLogs();
    const ready = activityReady();
    $("logsMeta").textContent = ready
      ? `이벤트 ${fmtScaledNum(a.total_events)} · 유형 ${fmtNum(a.distinct_event_types)} · ${
          state.dateFrom === state.dateTo ? state.dateFrom : `${state.dateFrom} ~ ${state.dateTo}`
        }`
      : a.note ||
        "테이블은 연결됐지만, 아직 FE/BE가 거의 기록하지 않아 숫자가 비어 있습니다";

    renderKpiGrid($("logsKpis"), [
      {
        label: "이벤트 총수",
        value: fmtScaledNum(a.total_events) || "0",
        source: "activity_logs",
        accent: true,
        pending: !ready,
        chipClass: "phase3",
      },
      {
        label: "이벤트 유형",
        value: fmtNum(a.distinct_event_types) || "0",
        source: "activity_logs",
        pending: !ready,
        chipClass: "phase3",
      },
      {
        label: "유저(대략)",
        value: fmtNum(a.unique_users) || "0",
        source: "activity_logs",
        help: "기간 합산 시 일자별 unique 합(중복 가능)",
        pending: !ready,
        chipClass: "phase3",
      },
      {
        label: "세션(대략)",
        value: fmtNum(a.unique_sessions) || "0",
        source: "activity_logs",
        pending: !ready,
        chipClass: "phase3",
      },
    ]);

    renderLogsEventTable($("logsEventFilter")?.value || "");
    const samples = a.samples || [];
    $("logsSampleBody").innerHTML = samples.length
      ? samples
          .map(
            (row) => `<tr>
          <td>${escapeHtml(String(row.client_ts || row.created_at || "-"))}</td>
          <td>${escapeHtml(row.event_type || "-")}</td>
          <td>${escapeHtml(row.page_path || "-")}</td>
          <td>${escapeHtml(row.platform || "-")}</td>
          <td class="mono">${escapeHtml(String(row.user_id || "-").slice(0, 8))}</td>
        </tr>`
          )
          .join("")
      : `<tr><td colspan="5" class="text-mg-500">샘플 없음</td></tr>`;
  }

  function renderLogsEventTable(filter) {
    const q = (filter || "").trim().toLowerCase();
    const rows = (state.activityLogs?.by_event || []).filter((e) => {
      if (!q) return true;
      return `${e.event_type} ${e.event_category} ${e.event_action}`
        .toLowerCase()
        .includes(q);
    });
    $("logsEventCount").textContent = `${rows.length}종`;
    $("logsEventBody").innerHTML = rows.length
      ? rows
          .map(
            (e) => `<tr>
          <td>${escapeHtml(e.event_type)}</td>
          <td>${escapeHtml(e.event_category || "-")}</td>
          <td>${escapeHtml(e.event_action || "-")}</td>
          <td>${fmtScaledNum(e.event_count)}</td>
          <td>${fmtNum(e.unique_users)}</td>
          <td>${fmtNum(e.unique_sessions)}</td>
        </tr>`
          )
          .join("")
      : `<tr><td colspan="6" class="text-mg-500">이벤트 없음</td></tr>`;
  }

  function sumSummaries(list) {
    const out = emptySummary();
    let anyStay = false;
    for (const s of list) {
      for (const k of Object.keys(out)) {
        if (k === "group_stay_seconds") {
          if (s?.group_stay_seconds != null) {
            out[k] += Number(s.group_stay_seconds) || 0;
            anyStay = true;
          }
          continue;
        }
        out[k] += Number(s?.[k] || 0);
      }
    }
    if (!anyStay) out.group_stay_seconds = null;
    return out;
  }

  function aggregateGaMetrics(metricList) {
    const out = {
      active_users: 0,
      new_users: 0,
      sessions: 0,
      engaged_sessions: 0,
      average_engagement_time_sec: null,
      bounce_rate: null,
      engagement_rate: null,
      sessions_per_user: null,
      screen_page_views: 0,
      event_count_total: 0,
      user_engagement_duration_sec: 0,
      retention_d1: null,
      retention_d7: null,
      retention_d30: null,
    };
    let sessWeight = 0;
    let engAcc = 0;
    let bounceAcc = 0;
    let bounceW = 0;
    let engRateAcc = 0;
    let engRateW = 0;
    let any = false;
    for (const m of metricList) {
      if (!m) continue;
      any = true;
      out.active_users += Number(m.active_users || 0);
      out.new_users += Number(m.new_users || 0);
      out.sessions += Number(m.sessions || 0);
      out.engaged_sessions += Number(m.engaged_sessions || 0);
      out.screen_page_views += Number(m.screen_page_views || 0);
      out.event_count_total += Number(m.event_count_total || 0);
      out.user_engagement_duration_sec += Number(
        m.user_engagement_duration_sec || 0
      );
      const sess = Number(m.sessions || 0);
      if (m.average_engagement_time_sec != null && sess > 0) {
        engAcc += Number(m.average_engagement_time_sec) * sess;
        sessWeight += sess;
      }
      if (m.bounce_rate != null && sess > 0) {
        bounceAcc += Number(m.bounce_rate) * sess;
        bounceW += sess;
      }
      if (m.engagement_rate != null && sess > 0) {
        engRateAcc += Number(m.engagement_rate) * sess;
        engRateW += sess;
      }
    }
    if (!any) return null;
    out.average_engagement_time_sec = sessWeight
      ? engAcc / sessWeight
      : null;
    out.bounce_rate = bounceW ? bounceAcc / bounceW : null;
    out.engagement_rate = engRateW ? engRateAcc / engRateW : null;
    out.sessions_per_user =
      out.active_users > 0 ? out.sessions / out.active_users : null;
    return out;
  }

  function aggregateGaEvents(eventsLists) {
    const map = new Map();
    for (const payload of eventsLists) {
      for (const e of payload?.events || []) {
        const prev = map.get(e.event_name) || {
          ...e,
          count: 0,
          status: "ok",
        };
        prev.count = Number(prev.count || 0) + Number(e.count || 0);
        map.set(e.event_name, prev);
      }
    }
    const events = [...map.values()];
    return {
      source: "ga4_range_aggregate",
      status: "ok",
      event_count: events.length,
      events,
    };
  }

  async function showDate(date) {
    return showSelection(date, date);
  }

  async function showSelection(from, to) {
    const start = from <= to ? from : to;
    const end = from <= to ? to : from;
    const label = selectionLabel(start, end);
    setStatus("로딩…");
    state.dateFrom = start;
    state.dateTo = end;
    state.currentDate = end;
    updateDatePickerBtn();

    const days = eachDateInclusive(start, end);
    state.rangeDays = days;
    state.prevSummary = getPrevSummary(start);

    const summaries = [];
    const activityPayloads = [];
    let lastSnap = null;
    for (const d of days) {
      const dbDay = (state.manifest.db_days || []).find((x) => x.date === d);
      if (dbDay) {
        try {
          const snap = await loadJson(dbDay.path);
          lastSnap = snap;
          summaries.push(snap.summary || dbDay.summary || {});
          activityPayloads.push(snap.activity_logs || null);
        } catch (_) {
          summaries.push(dbDay.summary || {});
          activityPayloads.push(null);
        }
      } else {
        summaries.push({});
        activityPayloads.push(null);
      }
    }
    state.snapshot = lastSnap;
    state.summary =
      days.length === 1
        ? summaries[0] || {}
        : sumSummaries(summaries);
    state.activityLogs =
      days.length === 1
        ? activityPayloads[0] || lastSnap?.activity_logs || emptyActivityLogs()
        : aggregateActivityLogs(activityPayloads);

    const gaMetricPayloads = [];
    const gaEventPayloads = [];
    for (const d of days) {
      try {
        gaMetricPayloads.push(await loadJson(`../data/ga/${d}.json`));
      } catch (_) {
        gaMetricPayloads.push(null);
      }
      try {
        gaEventPayloads.push(await loadJson(`../data/ga/${d}_events.json`));
      } catch (_) {
        gaEventPayloads.push(null);
      }
    }

    if (days.length === 1) {
      state.gaMetrics = gaMetricPayloads[0];
      state.gaEvents = gaEventPayloads[0];
    } else {
      const metrics = aggregateGaMetrics(
        gaMetricPayloads.map((p) => p?.metrics).filter(Boolean)
      );
      const anyOk = gaMetricPayloads.some((p) => p?.status === "ok");
      state.gaMetrics = metrics
        ? {
            source: "ga4_range_aggregate",
            status: anyOk ? "ok" : "pending_integration",
            target_date: `${start}_${end}`,
            metrics,
          }
        : null;
      state.gaEvents = aggregateGaEvents(gaEventPayloads.filter(Boolean));
    }

    Chart.defaults.font.family =
      '"Pretendard Variable", Pretendard, system-ui, sans-serif';
    Chart.defaults.color = "#7e8389";
    Chart.defaults.borderColor = "#e6e8eb";

    renderHome(label);
    renderService(state.currentService || "home");
    renderDb();
    renderGa();
    renderLogs();
    renderFunnel();
    renderExploreCompare();
    renderExploreLoop();
    renderOpsQuality();
    renderGroupLedger();
    fillCatalogFilters();
    renderCatalogList();
    renderBoard();
    renderSavedBoardsNav();
    const activeView = document.querySelector(".view.active")?.id?.replace("view-", "");
    if (activeView && FILTERABLE_VIEWS.has(activeView)) {
      updateViewContextMeta(
        activeView,
        activeView === "svc" ? SERVICE_META[state.currentService || "home"] : null
      );
    }
    syncPeriodChips();
    syncRangeAggUI();
    const dbHit = summaries.some((s) => Object.values(s || {}).some((v) => Number(v) > 0));
    if (!dbHit && !state.snapshot && !gaReady()) {
      setStatus(`${label} · 데이터 없음`, true);
    } else {
      setStatus(`${label} · ${days.length}일`);
    }
  }

  async function boot() {
    try {
      state.manifest = await loadJson("./manifest.json");
      if (!state.manifest.db_days && state.manifest.days) {
        state.manifest.db_days = state.manifest.days;
      }
      try {
        state.catalog = await loadJson("./metrics_catalog.json");
      } catch (_) {
        state.catalog = { items: [] };
      }
      initProductEvents();
      state.previewFull = $("phasePreview")?.value === "full";
      const latest = state.manifest.latest_date || selectableMaxDate();
      const [from, to] = quickPeriodRange("yesterday");
      state.dateFrom = from || latest;
      state.dateTo = to || latest;
      state.cal.draftFrom = state.dateFrom;
      state.cal.draftTo = state.dateTo;
      const [ly, lm] = (state.dateFrom || latest).split("-").map(Number);
      state.cal.viewYear = ly;
      state.cal.viewMonth = lm - 1;
      updateDatePickerBtn();
      try {
        const all = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
        if (all.current?.ids) {
          state.boardIds = all.current.ids;
          $("boardTitle").value = all.current.title || "내 실험 보드";
        }
      } catch (_) {}
      if (!latest) {
        setStatus("데이터 없음", true);
        return;
      }
      await showSelection(state.dateFrom, state.dateTo);
      // 기본: 어제(=선택 가능 최신일) 칩 활성
      syncPeriodChips();
      switchView("home");
    } catch (err) {
      console.error(err);
      setStatus(err.message || String(err), true);
    }
  }

  document.querySelectorAll(".side-link[data-view]").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (btn.dataset.view === "svc") {
        switchView("svc", { service: btn.dataset.service });
      } else {
        switchView(btn.dataset.view);
      }
    });
  });
  $("exploreLoopBanner")?.addEventListener("click", (e) => {
    const step = e.target.closest(".svc-loop-step[data-loop-step]");
    if (!step?.dataset.loopStep) return;
    state.exploreLoopStep = step.dataset.loopStep;
    renderExploreLoop();
  });
  $("exploreTabs")?.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-explore-tab]");
    if (!btn?.dataset.exploreTab) return;
    setExploreTab(btn.dataset.exploreTab);
  });
  if ($("homeIssues")) {
    $("homeIssues").addEventListener("click", (e) => {
      const link = e.target.closest("a[data-view]");
      if (!link) return;
      e.preventDefault();
      if (link.dataset.view === "svc" && link.dataset.service) {
        switchView("svc", { service: link.dataset.service });
      } else {
        switchView(link.dataset.view);
      }
    });
  }
  document.body.addEventListener("click", (e) => {
    const link = e.target.closest(".journey-link[data-view]");
    if (!link) return;
    e.preventDefault();
    if (link.dataset.view === "svc" && link.dataset.service) {
      switchView("svc", { service: link.dataset.service });
    } else {
      switchView(link.dataset.view);
    }
  });
  if ($("homeInsight")) {
    $("homeInsight").addEventListener("click", () => {
      const el = $("homeInsight");
      if (!el?.classList.contains("is-clickable")) return;
      const view = el.dataset.view;
      if (view) {
        switchView(view);
        return;
      }
      if (el.dataset.anchor === "homeIssues") {
        $("homeIssues")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  }
  if ($("homePeriodChips")) {
    $("homePeriodChips").addEventListener("click", onPeriodChipClick);
  }
  if ($("globalPeriodChips")) {
    $("globalPeriodChips").addEventListener("click", onPeriodChipClick);
  }
  function onPeriodChipClick(e) {
    const btn = e.target.closest(".period-chip");
    if (!btn?.dataset.period) return;
    const [from, to] = quickPeriodRange(btn.dataset.period);
    state.cal.pickingEnd = false;
    state.cal.draftFrom = from;
    state.cal.draftTo = to;
    if (from) {
      const [y, m] = from.split("-").map(Number);
      state.cal.viewYear = y;
      state.cal.viewMonth = m - 1;
    }
    showSelection(from, to).catch((err) => setStatus(err.message, true));
  }
  if ($("datePickerBtn")) {
    $("datePickerBtn").addEventListener("click", (e) => {
      e.stopPropagation();
      setHeaderMoreOpen(false);
      state.cal.draftFrom = state.dateFrom;
      state.cal.draftTo = state.dateTo;
      if (state.dateFrom) {
        const [y, m] = state.dateFrom.split("-").map(Number);
        state.cal.viewYear = y;
        state.cal.viewMonth = m - 1;
      }
      setCalOpen(!state.cal.open);
    });
  }
  if ($("calPrev")) {
    $("calPrev").addEventListener("click", () => {
      state.cal.viewMonth -= 1;
      if (state.cal.viewMonth < 0) {
        state.cal.viewMonth = 11;
        state.cal.viewYear -= 1;
      }
      renderCalendar();
    });
  }
  if ($("calNext")) {
    $("calNext").addEventListener("click", () => {
      state.cal.viewMonth += 1;
      if (state.cal.viewMonth > 11) {
        state.cal.viewMonth = 0;
        state.cal.viewYear += 1;
      }
      renderCalendar();
    });
  }
  if ($("calCancel")) {
    $("calCancel").addEventListener("click", () => setCalOpen(false));
  }
  if ($("calEndLatest")) {
    $("calEndLatest").addEventListener("click", (e) => {
      e.stopPropagation();
      applyCalEndShortcut();
    });
  }
  if ($("calApply")) {
    $("calApply").addEventListener("click", (e) => {
      e.stopPropagation();
      const from = state.cal.draftFrom;
      const to = state.cal.draftTo || state.cal.draftFrom;
      if (!from) return;
      applyCalendarSelection(from, to, { close: true }).catch((err) =>
        setStatus(err.message, true)
      );
    });
  }
  if ($("homeAggChips")) {
    $("homeAggChips").addEventListener("click", onAggChipClick);
  }
  if ($("globalAggChips")) {
    $("globalAggChips").addEventListener("click", onAggChipClick);
  }
  function onAggChipClick(e) {
    const btn = e.target.closest("[data-agg]");
    if (!btn?.dataset.agg) return;
    state.rangeAgg = btn.dataset.agg;
    syncRangeAggUI();
    if (state.dateFrom && state.dateTo) {
      showSelection(state.dateFrom, state.dateTo).catch((err) =>
        setStatus(err.message, true)
      );
    }
  }

  function setHeaderMoreOpen(open) {
    const menu = $("headerMoreMenu");
    const btn = $("headerMoreBtn");
    if (!menu || !btn) return;
    menu.classList.toggle("hidden", !open);
    btn.setAttribute("aria-expanded", open ? "true" : "false");
  }

  if ($("headerMoreBtn")) {
    $("headerMoreBtn").addEventListener("click", (e) => {
      e.stopPropagation();
      setCalOpen(false);
      const menu = $("headerMoreMenu");
      setHeaderMoreOpen(menu?.classList.contains("hidden"));
    });
  }
  document.addEventListener("click", (e) => {
    const pop = $("datePickerPop");
    const btn = $("datePickerBtn");
    if (state.cal.open && pop && btn) {
      const t = e.target;
      const insidePop =
        (t instanceof Node && pop.contains(t)) ||
        (t instanceof Element && t.closest?.("#datePickerPop"));
      const insideBtn =
        (t instanceof Node && btn.contains(t)) ||
        (t instanceof Element && t.closest?.("#datePickerBtn"));
      if (!insidePop && !insideBtn) setCalOpen(false);
    }
    const more = $("headerMoreMenu");
    const moreBtn = $("headerMoreBtn");
    if (more && moreBtn && !more.classList.contains("hidden")) {
      if (!more.contains(e.target) && !moreBtn.contains(e.target)) {
        setHeaderMoreOpen(false);
      }
    }
  });
  if ($("datePickerPop")) {
    $("datePickerPop").addEventListener("click", (e) => e.stopPropagation());
  }
  if ($("phasePreview")) {
    $("phasePreview").addEventListener("change", () => {
      state.previewFull = $("phasePreview").value === "full";
      if (state.dateFrom && state.dateTo) {
        showSelection(state.dateFrom, state.dateTo).catch((err) =>
          setStatus(err.message, true)
        );
      }
    });
  }
  if ($("refreshBtn")) {
    $("refreshBtn").addEventListener("click", () => {
      setHeaderMoreOpen(false);
      boot();
    });
  }
  if ($("shareHelpBtn")) {
    $("shareHelpBtn").addEventListener("click", () => {
      setHeaderMoreOpen(false);
      $("shareDialog")?.showModal();
    });
  }
  if ($("openSidebar")) {
    $("openSidebar").addEventListener("click", openMobileSidebar);
  }
  if ($("drawerBackdrop")) {
    $("drawerBackdrop").addEventListener("click", closeMobileSidebar);
  }
  if ($("newBoardBtn")) {
    $("newBoardBtn").addEventListener("click", () => {
      state.boardIds = [];
      state.activeBoardId = null;
      $("boardTitle").value = `실험 ${new Date().toLocaleDateString("ko-KR")}`;
      renderBoard();
      switchView("compose");
    });
  }
  if ($("editCurrentBoardBtn")) {
    $("editCurrentBoardBtn").addEventListener("click", () => switchView("compose"));
  }
  if ($("exportCurrentBoardBtn")) {
    $("exportCurrentBoardBtn").addEventListener("click", () => $("exportBoardBtn").click());
  }
  if ($("copyShareTipBtn")) {
    $("copyShareTipBtn").addEventListener("click", async () => {
      const tip =
        "【모각작 분석 보드 공유】\n1) 공통은 현황·전환·데이터·이벤트를 보세요.\n2) 개인 보드는 첨부 JSON을 «보드 편집 → 불러오기»로 엽니다.\n3) Lens×Journey로 맞춰 비교하세요.";
      try {
        await navigator.clipboard.writeText(tip);
        setStatus("공유 문구가 복사되었습니다");
      } catch (_) {
        setStatus("복사 실패 — 보드 편집의 공유 문구를 확인하세요", true);
      }
    });
  }
  $("userFilter")?.addEventListener("input", (e) => {
    const q = e.target.value.trim().toLowerCase();
    const rows = q ? state.userRows.filter((r) => r.search.includes(q)) : state.userRows;
    renderUserTable(rows);
    renderUserTable(rows, GROUP_LEDGER_TARGETS[1]);
  });
  $("opsUserFilter")?.addEventListener("input", (e) => {
    const q = e.target.value.trim().toLowerCase();
    const rows = q ? state.userRows.filter((r) => r.search.includes(q)) : state.userRows;
    renderUserTable(rows, GROUP_LEDGER_TARGETS[1]);
    renderUserTable(rows);
  });
  $("gaEventFilter").addEventListener("input", (e) => renderGaEventTable(e.target.value));
  if ($("logsEventFilter")) {
    $("logsEventFilter").addEventListener("input", (e) =>
      renderLogsEventTable(e.target.value)
    );
  }
  $("catalogFilter").addEventListener("input", renderCatalogList);
  $("catalogJourney")?.addEventListener("change", renderCatalogList);
  $("catalogStatus").addEventListener("change", renderCatalogList);
  $("lensFilters")?.querySelectorAll(".quick-filter").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.catalogLens = btn.dataset.lens || "";
      $("lensFilters").querySelectorAll(".quick-filter").forEach((b) => {
        b.classList.toggle("active", b === btn);
      });
      renderCatalogList();
    });
  });
  $("saveBoardBtn").addEventListener("click", () => {
    const title = $("boardTitle").value || "내 실험 보드";
    const id = state.activeBoardId || slugifyBoardId(title);
    const payload = {
      title,
      ids: state.boardIds,
      lens: state.catalogLens || "",
      journey: $("catalogJourney")?.value || "",
      saved_at: new Date().toISOString(),
      schema_version: 2,
      kind: "personal_board",
    };
    const all = loadAllBoards();
    all[id] = payload;
    all.current = { ...payload, id };
    state.activeBoardId = id;
    persistAllBoards(all);
    renderSavedBoardsNav();
    setStatus(`저장됨: ${title}`);
  });
  $("exportBoardBtn").addEventListener("click", () => {
    const blob = new Blob(
      [
        JSON.stringify(
          {
            kind: "personal_board",
            title: $("boardTitle").value,
            ids: state.boardIds,
            lens: state.catalogLens || "",
            journey: $("catalogJourney")?.value || "",
            schema_version: 2,
            exported_at: new Date().toISOString(),
            note: "모각작 개인 분석 뷰 · Lens×Journey · 대시보드에서 불러오기",
          },
          null,
          2
        ),
      ],
      { type: "application/json" }
    );
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `mogakjak-board-${Date.now()}.json`;
    a.click();
  });
  $("clearBoardBtn").addEventListener("click", () => {
    state.boardIds = [];
    renderBoard();
  });
  if ($("deleteBoardBtn")) {
    $("deleteBoardBtn").addEventListener("click", () => {
      if (!state.activeBoardId) {
        setStatus("저장된 보드가 아닙니다. 저장 후 삭제하세요.", true);
        return;
      }
      const all = loadAllBoards();
      delete all[state.activeBoardId];
      if (all.current?.id === state.activeBoardId) delete all.current;
      persistAllBoards(all);
      state.activeBoardId = null;
      state.boardIds = [];
      renderBoard();
      renderSavedBoardsNav();
      setStatus("보드 삭제됨");
      switchView("compose");
    });
  }
  $("importBoardBtn").addEventListener("click", () => $("importFile").click());
  $("importFile").addEventListener("change", async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const data = JSON.parse(await file.text());
      state.boardIds = data.ids || [];
      $("boardTitle").value = data.title || "불러온 보드";
      state.activeBoardId = null;
      applyComposeFilters(data.lens || "", data.journey || "");
      renderBoard();
      switchView("compose");
      setStatus("보드를 불러왔습니다. 저장하면 내 목록에 남습니다.");
    } catch (err) {
      setStatus(err.message, true);
    }
    e.target.value = "";
  });

  function applyComposeFilters(lens, journey) {
    state.catalogLens = lens || "";
    if ($("catalogJourney")) $("catalogJourney").value = journey || "";
    $("lensFilters")?.querySelectorAll(".quick-filter").forEach((b) => {
      b.classList.toggle("active", (b.dataset.lens || "") === state.catalogLens);
    });
    renderCatalogList();
  }

  if ($("changesForm")) {
    $("changesForm").addEventListener("submit", (e) => {
      e.preventDefault();
      const ev = readChangesForm();
      if (!ev.date || !ev.title) {
        setStatus("날짜와 제목은 필수입니다.", true);
        return;
      }
      const wasEdit = !!state.editingEventId;
      upsertProductEvent(ev);
      resetChangesForm(true);
      refreshProductEventViews();
      setStatus(wasEdit ? "변경 기록을 저장했습니다" : "변경 기록을 추가했습니다");
    });
  }
  if ($("changesCancelEditBtn")) {
    $("changesCancelEditBtn").addEventListener("click", () => resetChangesForm(true));
  }
  if ($("changesToggleForm")) {
    $("changesToggleForm").addEventListener("click", () => {
      if (state.editingEventId) {
        resetChangesForm(true);
      } else {
        setChangesFormOpen(!state.changesFormOpen);
        if (state.changesFormOpen && $("changesDate")) {
          $("changesDate").value =
            $("changesDate").value || state.dateTo || state.currentDate || "";
        }
      }
    });
  }
  if ($("changesCalPrev")) {
    $("changesCalPrev").addEventListener("click", () => {
      initChangesCalView();
      state.changesCal.viewMonth -= 1;
      if (state.changesCal.viewMonth < 0) {
        state.changesCal.viewMonth = 11;
        state.changesCal.viewYear -= 1;
      }
      renderChangesCalendar();
    });
  }
  if ($("changesCalNext")) {
    $("changesCalNext").addEventListener("click", () => {
      initChangesCalView();
      state.changesCal.viewMonth += 1;
      if (state.changesCal.viewMonth > 11) {
        state.changesCal.viewMonth = 0;
        state.changesCal.viewYear += 1;
      }
      renderChangesCalendar();
    });
  }
  if ($("changesList")) {
    $("changesList").addEventListener("click", (e) => {
      const editId = e.target.closest("[data-change-edit]")?.dataset.changeEdit;
      const delId = e.target.closest("[data-change-del]")?.dataset.changeDel;
      if (editId) {
        const ev = state.productEvents.find((x) => x.id === editId);
        if (ev) fillChangesForm(ev);
        return;
      }
      if (delId) {
        if (!window.confirm("이 변경 기록을 삭제할까요?")) return;
        deleteProductEvent(delId);
        if (state.editingEventId === delId) resetChangesForm(true);
        refreshProductEventViews();
        setStatus("변경 기록을 삭제했습니다");
      }
    });
  }
  if ($("changesExportBtn")) {
    $("changesExportBtn").addEventListener("click", () => exportProductEventsJson());
  }
  if ($("changesImportBtn")) {
    $("changesImportBtn").addEventListener("click", () => $("changesImportFile")?.click());
  }
  if ($("changesImportFile")) {
    $("changesImportFile").addEventListener("change", async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      try {
        const data = JSON.parse(await file.text());
        const items = data.events || data;
        if (!Array.isArray(items)) throw new Error("events 배열이 필요합니다");
        mergeImportedProductEvents(items);
        resetChangesForm();
        refreshProductEventViews();
        setStatus(`변경 기록 ${items.length}건을 불러왔습니다`);
      } catch (err) {
        setStatus(err.message || String(err), true);
      }
      e.target.value = "";
    });
  }
  if ($("changesResetBundledBtn")) {
    $("changesResetBundledBtn").addEventListener("click", () => {
      syncBundledProductEvents(bundledProductEvents());
      saveProductEventsLocal();
      refreshProductEventViews();
      setStatus("product_events.json 기본값을 병합했습니다");
    });
  }

  boot();
})();
