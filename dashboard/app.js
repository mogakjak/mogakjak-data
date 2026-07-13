(() => {
  const $ = (id) => document.getElementById(id);
  const STORAGE_KEY = "mogakjak_compose_boards_v1";

  const VIEW_META = {
    home: {
      eyebrow: "공통 · Growth",
      title: "홈",
      desc: "성장·몰입 공식 KPI",
    },
    db: {
      eyebrow: "공통 · Core",
      title: "DB 분석",
      desc: "몰입 · 그룹 · 초대",
    },
    ga: {
      eyebrow: "공통 · Tech",
      title: "GA4 지표",
      desc: "유입 · 리텐션 · 계측 이벤트",
    },
    funnel: {
      eyebrow: "공통 · UX",
      title: "여정 퍼널",
      desc: "온보딩 → 핵심 → 소셜",
    },
    compose: {
      eyebrow: "개인 분석",
      title: "보드 편집",
      desc: "Lens × Journey 조립 · JSON 공유",
    },
    board: {
      eyebrow: "개인 분석",
      title: "저장된 보드",
      desc: "읽기 모드",
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
  };

  const state = {
    manifest: null,
    catalog: null,
    snapshot: null,
    summary: {},
    prevSummary: {},
    currentDate: null,
    gaEvents: null,
    gaMetrics: null,
    userRows: [],
    boardIds: [],
    charts: {},
    previewFull: false,
    catalogLens: "",
  };

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
    $("status").textContent = msg;
    $("status").style.color = isError ? "#a33a1b" : "";
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

  function switchView(name, opts = {}) {
    const meta = VIEW_META[name] || VIEW_META.home;
    document.querySelectorAll(".side-link[data-view]").forEach((b) => {
      b.classList.toggle("active", name !== "board" && b.dataset.view === name);
    });
    document.querySelectorAll(".side-link.board-link").forEach((b) => {
      b.classList.toggle(
        "active",
        name === "board" && b.dataset.boardId === opts.boardId
      );
    });
    document.querySelectorAll(".view").forEach((v) => {
      v.classList.toggle("active", v.id === `view-${name}`);
    });
    if ($("viewEyebrow")) $("viewEyebrow").textContent = meta.eyebrow;
    if ($("viewTitle")) {
      $("viewTitle").textContent =
        name === "board" && opts.title ? opts.title : meta.title;
    }
    if ($("viewDesc")) $("viewDesc").textContent = meta.desc;
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
        return `<article class="metric-card board-card">
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
    return state.gaMetrics?.status === "ok" && (m.new_users != null || m.active_users != null);
  }

  function gaMetricsView() {
    if (state.previewFull) return { ...PREVIEW.ga, _preview: true };
    const m = state.gaMetrics?.metrics || {};
    return {
      new_users: m.new_users,
      active_users: m.active_users,
      sessions: m.sessions,
      retention_d1: m.retention_d1,
      retention_d7: m.retention_d7,
      retention_d30: m.retention_d30,
      _preview: false,
    };
  }

  function eventCount(name) {
    if (state.previewFull) return PREVIEW.ga.event_counts[name] ?? null;
    const ev = (state.gaEvents?.events || []).find((e) => e.event_name === name);
    return ev?.count ?? null;
  }

  function inviteAcceptRate(summary) {
    const created = Number(summary.invitations_created_count) || 0;
    const responded = Number(summary.invitations_responded_count) || 0;
    if (!created && !responded) return null;
    // 응답/생성 (수락만 분리 전)
    if (!created) return responded ? 1 : 0;
    return responded / created;
  }

  function buildInsight(summary) {
    const focus =
      (Number(summary.personal_focus_seconds) || 0) +
      (Number(summary.group_focus_seconds) || 0);
    const entries = Number(summary.session_entry_count) || 0;
    const rate = inviteAcceptRate(summary);
    const parts = [];

    if (focus === 0 && (Number(summary.membership_count) || 0) > 0) {
      parts.push("멤버십은 있으나 당일 집중·세션이 0입니다. 활동 없는 날이거나 수집 범위를 점검하세요.");
    } else if (entries > 0 && focus === 0) {
      parts.push("그룹 입장은 있으나 집중시간이 없습니다. 방문→몰입 전환을 의심해 보세요.");
    } else if (entries === 0 && focus > 0) {
      parts.push("집중은 있으나 당일 그룹 입장이 없습니다. 개인 몰입 비중이 높을 수 있습니다.");
    } else if (focus > 0) {
      parts.push(
        `당일 총 집중 ${fmtDur(focus)} · 입장 ${entries}건 · 초대응답률 ${
          rate == null ? "—" : fmtPct(rate)
        }.`
      );
    } else {
      parts.push("당일 DB 활동 지표가 비어 있습니다. 며칠치가 쌓이면 추이·인사이트가 살아납니다.");
    }

    if (!gaReady()) {
      parts.push(" [Phase2] 신규·D1은 GA API 연동 후 표시됩니다.");
    }
    parts.push(" [Phase3] 온보딩·콕발송 구간은 로그 보강 후 퍼널 탭에서 숫자로 바뀝니다.");

    const warn = focus === 0 || entries === 0;
    return { text: parts.join(" "), warn };
  }

  const CHART = {
    red: "#fa5332",
    redSoft: "rgba(250,83,50,0.45)",
    black: "#121212",
    gray: "#7e8389",
    graySoft: "rgba(126,131,137,0.35)",
    dark: "#323437",
    green: "#00770e",
  };

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
        const delta = i.delta
          ? `<span class="metric-card__delta ${i.deltaTone || "flat"}">${escapeHtml(
              i.delta
            )}</span>`
          : "";
        return `<article class="metric-card">
          <span class="metric-card__label">${escapeHtml(i.label)}</span>
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

  /* ===== HOME ===== */
  function renderHome(date) {
    const s = state.summary;
    const ga = gaMetricsView();
    const totalFocus =
      (Number(s.personal_focus_seconds) || 0) + (Number(s.group_focus_seconds) || 0);
    const rate = inviteAcceptRate(s);
    const insight = buildInsight(s);

    $("homeMeta").textContent = `기준일 ${date}${
      state.previewFull ? " · 미리보기(예시 수치 포함)" : ""
    }`;
    $("homeBadges").innerHTML = `
      <span class="badge db">Phase1 DB · ${state.snapshot ? "연결" : "없음"}</span>
      <span class="badge ga ${gaReady() ? "ready" : ""}">Phase2 GA · ${
      gaReady() ? (ga._preview ? "미리보기" : "연결") : "연동 대기"
    }</span>
      <span class="badge ga">Phase3 로그 · ${
        state.previewFull ? "미리보기" : "보강 대기"
      }</span>`;

    $("homeInsight").className = `insight-banner${insight.warn ? " warn" : ""}`;
    $("homeInsight").innerHTML = `<span class="phase">Insight</span>${escapeHtml(
      insight.text
    )}`;

    const prev = state.prevSummary || {};
    const prevRate = inviteAcceptRate(prev);
    const dFocus = deltaFromKeys(s, prev, [
      "personal_focus_seconds",
      "group_focus_seconds",
    ]);
    const dPersonal = deltaFromKeys(s, prev, "personal_focus_seconds");
    const dGroup = deltaFromKeys(s, prev, "group_focus_seconds");
    const dEntry = deltaFromKeys(s, prev, "session_entry_count");
    const dRate = calcDelta(rate, prevRate);
    const dMember = deltaFromKeys(s, prev, "membership_count");

    renderKpiGrid($("homeKpiGrid"), [
      {
        label: "총 집중",
        value: fmtDur(totalFocus),
        source: "DB · Phase1",
        hint: "개인+그룹",
        accent: true,
        delta: dFocus?.text,
        deltaTone: dFocus?.tone,
      },
      {
        label: "개인 집중",
        value: fmtDur(s.personal_focus_seconds),
        source: "DB",
        secondary: "focus_session",
        delta: dPersonal?.text,
        deltaTone: dPersonal?.tone,
      },
      {
        label: "그룹 집중",
        value: fmtDur(s.group_focus_seconds),
        source: "DB",
        secondary: "group_focus_session",
        delta: dGroup?.text,
        deltaTone: dGroup?.tone,
      },
      {
        label: "그룹 입장",
        value: fmtNum(s.session_entry_count) || "0",
        source: "DB",
        hint: "당일 entered_at",
        accent: true,
        delta: dEntry?.text,
        deltaTone: dEntry?.tone,
      },
      {
        label: "초대 응답률",
        value: rate == null ? "—" : fmtPct(rate),
        source: "DB",
        hint: "응답 ÷ 생성",
        pending: rate == null,
        accent: true,
        delta: dRate?.text,
        deltaTone: dRate?.tone,
      },
      {
        label: "멤버십",
        value: fmtNum(s.membership_count) || "0",
        source: "DB",
        hint: "스냅샷",
        delta: dMember?.text,
        deltaTone: dMember?.tone,
      },
      {
        label: "신규 사용자",
        value: gaReady() ? fmtNum(ga.new_users) : "—",
        source: "GA · Phase2",
        hint: gaReady() ? "Data API" : "연동 대기",
        pending: !gaReady(),
        chipClass: "phase2",
      },
      {
        label: "D1 리텐션",
        value: gaReady() ? fmtPct(ga.retention_d1) : "—",
        source: "GA · Phase2",
        hint: gaReady() ? "전일 코호트" : "연동 대기",
        pending: !gaReady(),
        chipClass: "phase2",
      },
    ]);

    destroyChart("homeFocus");
    state.charts.homeFocus = new Chart($("homeFocusChart"), {
      type: "bar",
      data: {
        labels: ["개인", "그룹"],
        datasets: [
          {
            data: [
              (s.personal_focus_seconds || 0) / 60,
              (s.group_focus_seconds || 0) / 60,
            ],
            backgroundColor: [CHART.red, CHART.black],
            borderRadius: 10,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true, title: { display: true, text: "분" } } },
      },
    });

    destroyChart("homeEntryFocus");
    state.charts.homeEntryFocus = new Chart($("homeEntryFocusChart"), {
      type: "bar",
      data: {
        labels: ["입장(건)", "총집중(분)"],
        datasets: [
          {
            data: [s.session_entry_count || 0, totalFocus / 60],
            backgroundColor: [CHART.black, CHART.red],
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

    destroyChart("homeInvite");
    state.charts.homeInvite = new Chart($("homeInviteChart"), {
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

    const showGa = gaReady();
    $("homeGaOverlay").classList.toggle("hidden", showGa);
    destroyChart("homeGaGrowth");
    state.charts.homeGaGrowth = new Chart($("homeGaGrowthChart"), {
      type: "bar",
      data: {
        labels: ["신규", "활성", "D1%"],
        datasets: [
          {
            data: showGa
              ? [ga.new_users, ga.active_users, (ga.retention_d1 || 0) * 100]
              : [0, 0, 0],
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

    const dbAsc = [...(state.manifest.db_days || [])].sort((a, b) =>
      a.date.localeCompare(b.date)
    );
    destroyChart("homeTrend");
    state.charts.homeTrend = new Chart($("homeTrendChart"), {
      type: "line",
      data: {
        labels: dbAsc.map((d) => d.date),
        datasets: [
          {
            label: "총집중(분)·DB",
            data: dbAsc.map(
              (d) =>
                ((d.summary.personal_focus_seconds || 0) +
                  (d.summary.group_focus_seconds || 0)) /
                60
            ),
            borderColor: CHART.red,
            tension: 0.35,
          },
          {
            label: "입장·DB",
            data: dbAsc.map((d) => d.summary.session_entry_count || 0),
            borderColor: CHART.black,
            borderDash: [4, 4],
            yAxisID: "y1",
            tension: 0.35,
          },
          {
            label: "신규·GA",
            data: dbAsc.map(() => (showGa ? ga.new_users : null)),
            borderColor: CHART.gray,
            spanGaps: true,
            yAxisID: "y1",
            tension: 0.35,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: { legend: { position: "bottom" } },
        scales: {
          y: { beginAtZero: true, title: { display: true, text: "분" } },
          y1: {
            position: "right",
            grid: { drawOnChartArea: false },
            beginAtZero: true,
          },
        },
      },
    });

    renderHomeFunnelStrip(s, ga);
  }

  function renderHomeFunnelStrip(s, ga) {
    const stages = [
      {
        name: "유입",
        status: gaReady() ? "Phase2 가능" : "GA 대기",
        value: gaReady() ? `신규 ${fmtNum(ga.new_users)}` : "—",
        cls: gaReady() ? "strong" : "gap",
      },
      {
        name: "온보딩",
        status: state.previewFull ? "미리보기" : "Phase3 로그 없음",
        value: state.previewFull
          ? `완료 ${PREVIEW.phase3.onboarding_steps.at(-1)}%`
          : "데이터 없음",
        cls: state.previewFull ? "strong" : "gap",
      },
      {
        name: "타이머",
        status: "Phase1 강함",
        value: fmtDur(
          (s.personal_focus_seconds || 0) + (s.group_focus_seconds || 0)
        ),
        cls: "strong",
      },
      {
        name: "그룹·소셜",
        status: "입장·초대 OK / 콕발송 약함",
        value: `입장 ${s.session_entry_count || 0}`,
        cls: "strong",
      },
      {
        name: "리텐션",
        status: gaReady() ? "Phase2" : "GA 대기",
        value: gaReady() ? `D1 ${fmtPct(ga.retention_d1)}` : "—",
        cls: gaReady() ? "strong" : "gap",
      },
    ];
    $("homeFunnelStrip").innerHTML = stages
      .map(
        (st) => `<div class="funnel-step ${st.cls}">
        <div class="step-name">${escapeHtml(st.name)}</div>
        <div class="step-status">${escapeHtml(st.status)}</div>
        <div class="step-value">${escapeHtml(st.value)}</div>
      </div>`
      )
      .join("");
  }

  /* ===== DB ===== */
  function renderDb() {
    const s = state.summary;
    $("dbMeta").textContent = `수집: ${state.snapshot?.collected_at || "-"}`;
    renderKpiGrid($("dbFocusKpis"), [
      {
        label: "개인 세션",
        value: fmtNum(s.personal_session_count) || "0",
        source: "DB",
        secondary: "focus_session",
      },
      {
        label: "그룹 세션",
        value: fmtNum(s.group_session_count) || "0",
        source: "DB",
        secondary: "group_focus_session",
      },
      {
        label: "개인 집중",
        value: fmtDur(s.personal_focus_seconds),
        source: "DB",
        accent: true,
      },
      {
        label: "그룹 집중",
        value: fmtDur(s.group_focus_seconds),
        source: "DB",
        accent: true,
      },
    ]);

    destroyChart("dbFocus");
    state.charts.dbFocus = new Chart($("dbFocusChart"), {
      type: "bar",
      data: {
        labels: ["개인 세션", "그룹 세션", "개인(분)", "그룹(분)"],
        datasets: [
          {
            data: [
              s.personal_session_count || 0,
              s.group_session_count || 0,
              (s.personal_focus_seconds || 0) / 60,
              (s.group_focus_seconds || 0) / 60,
            ],
            backgroundColor: [CHART.red, CHART.black, CHART.redSoft, CHART.graySoft],
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
    $("gaMeta").textContent = ready
      ? state.previewFull
        ? "미리보기 예시 수치 (실제 GA 아님)"
        : `수집: ${state.gaMetrics?.collected_at || "-"}`
      : "Phase 2 · GA4 Data API 연동 후 숫자가 채워집니다";

    renderKpiGrid($("gaBasicKpis"), [
      {
        label: "신규",
        value: ready ? fmtNum(ga.new_users) : "—",
        source: "GA · Phase2",
        accent: true,
        pending: !ready,
        chipClass: "phase2",
      },
      {
        label: "활성",
        value: ready ? fmtNum(ga.active_users) : "—",
        source: "GA · Phase2",
        pending: !ready,
        chipClass: "phase2",
      },
      {
        label: "세션",
        value: ready ? fmtNum(ga.sessions) : "—",
        source: "GA · Phase2",
        pending: !ready,
        chipClass: "phase2",
      },
      {
        label: "D1",
        value: ready ? fmtPct(ga.retention_d1) : "—",
        source: "GA · Phase2",
        accent: true,
        pending: !ready,
        chipClass: "phase2",
      },
      {
        label: "D7",
        value: ready ? fmtPct(ga.retention_d7) : "—",
        source: "GA · Phase2",
        pending: !ready,
        chipClass: "phase2",
      },
      {
        label: "D30",
        value: ready ? fmtPct(ga.retention_d30) : "—",
        source: "GA · Phase2",
        pending: !ready,
        chipClass: "phase2",
      },
    ]);

    $("gaUsersOverlay").classList.toggle("hidden", ready);
    $("gaRetentionOverlay").classList.toggle("hidden", ready);

    destroyChart("gaUsers");
    state.charts.gaUsers = new Chart($("gaUsersChart"), {
      type: "bar",
      data: {
        labels: ["신규", "활성"],
        datasets: [
          {
            data: ready ? [ga.new_users, ga.active_users] : [0, 0],
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

    $("gaCorrGrid").innerHTML = corrs
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

    renderGaEventTable($("gaEventFilter").value || "");
  }

  function renderGaEventTable(filter) {
    let events = state.gaEvents?.events || [];
    if (state.previewFull) {
      events = events.map((e) => ({
        ...e,
        count: PREVIEW.ga.event_counts[e.event_name] ?? e.count,
        status: "preview_counts",
      }));
    }
    const q = filter.trim().toLowerCase();
    const filtered = q
      ? events.filter(
          (e) =>
            e.event_name.toLowerCase().includes(q) ||
            (e.label_ko || "").toLowerCase().includes(q)
        )
      : events;
    $("gaEventCount").textContent = `${filtered.length}개`;
    $("gaEventBody").innerHTML = filtered.length
      ? filtered
          .map(
            (e) => `<tr>
          <td><code>${escapeHtml(e.event_name)}</code></td>
          <td>${escapeHtml(e.label_ko || "")}</td>
          <td>${escapeHtml((e.params || []).join(", ") || "-")}</td>
          <td>${e.instrumented ? "✓" : "-"}</td>
          <td>${e.count == null ? "—" : fmtNum(e.count)}</td>
          <td>${escapeHtml(e.status || "")}</td>
        </tr>`
          )
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
            data: pokeReady ? [pf.send, pf.respond, pf.enter] : [0, eventCount("poke_response") || 0, s.session_entry_count || 0],
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

  function renderUserTable(rows) {
    $("userCount").textContent = `${rows.length}명`;
    $("userGroupBody").innerHTML = rows.length
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

  function renderGroupTable(rows) {
    $("groupBody").innerHTML = rows.length
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

  function renderEntries(entries) {
    $("entryBody").innerHTML = entries?.length
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
        return `<button type="button" class="catalog-item" data-id="${escapeHtml(i.id)}">
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
        return `<article class="metric-card board-card">
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

  function fillDateSelect(manifest, selected) {
    const select = $("dateSelect");
    select.innerHTML = "";
    const dates = [
      ...new Set([
        ...(manifest.db_days || []).map((d) => d.date),
        ...(manifest.ga_days || []).map((d) => d.date),
      ]),
    ].sort().reverse();
    for (const date of dates) {
      const opt = document.createElement("option");
      opt.value = date;
      opt.textContent = date;
      if (date === selected) opt.selected = true;
      select.appendChild(opt);
    }
  }

  async function showDate(date) {
    setStatus(`로딩… ${date}`);
    state.currentDate = date;
    state.prevSummary = getPrevSummary(date);
    const dbDay = (state.manifest.db_days || []).find((d) => d.date === date);
    if (dbDay) {
      state.snapshot = await loadJson(dbDay.path);
      state.summary = state.snapshot.summary || dbDay.summary || {};
    } else {
      state.snapshot = null;
      state.summary = {};
    }
    try {
      state.gaEvents = await loadJson(`../data/ga/${date}_events.json`);
    } catch (_) {
      state.gaEvents = null;
    }
    try {
      state.gaMetrics = await loadJson(`../data/ga/${date}.json`);
    } catch (_) {
      state.gaMetrics = null;
    }

    Chart.defaults.font.family =
      '"Pretendard Variable", Pretendard, system-ui, sans-serif';
    Chart.defaults.color = "#7e8389";
    Chart.defaults.borderColor = "#e6e8eb";

    renderHome(date);
    renderDb();
    renderGa();
    renderFunnel();
    fillCatalogFilters();
    renderCatalogList();
    renderBoard();
    renderSavedBoardsNav();
    setStatus(
      `표시 ${date} · preview=${state.previewFull ? "FULL" : "AUTO"} · DB ${
        state.snapshot ? "O" : "-"
      } · GA이벤트 ${(state.gaEvents?.events || []).length}`
    );
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
      state.previewFull = $("phasePreview").value === "full";
      fillDateSelect(state.manifest, state.manifest.latest_date);
      try {
        const all = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
        if (all.current?.ids) {
          state.boardIds = all.current.ids;
          $("boardTitle").value = all.current.title || "내 실험 보드";
        }
      } catch (_) {}
      if (!state.manifest.latest_date) {
        setStatus("데이터 없음", true);
        return;
      }
      await showDate(state.manifest.latest_date);
      switchView("home");
    } catch (err) {
      console.error(err);
      setStatus(err.message || String(err), true);
    }
  }

  document.querySelectorAll(".side-link[data-view]").forEach((btn) => {
    btn.addEventListener("click", () => switchView(btn.dataset.view));
  });
  $("dateSelect").addEventListener("change", (e) => {
    if (e.target.value) showDate(e.target.value).catch((err) => setStatus(err.message, true));
  });
  $("phasePreview").addEventListener("change", () => {
    state.previewFull = $("phasePreview").value === "full";
    const date = $("dateSelect").value;
    if (date) showDate(date).catch((err) => setStatus(err.message, true));
  });
  $("refreshBtn").addEventListener("click", () => boot());
  if ($("shareHelpBtn")) {
    $("shareHelpBtn").addEventListener("click", () => {
      $("shareDialog").showModal();
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
        "【모각작 분석 보드 공유】\n1) 공통 KPI는 홈·여정·DB·GA를 보세요.\n2) 개인 보드는 첨부 JSON을 «보드 편집 → 불러오기»로 엽니다.\n3) Lens(성장/UX/개발)×Journey(온보딩/핵심/소셜/시스템)로 맞춰 비교하세요.";
      try {
        await navigator.clipboard.writeText(tip);
        setStatus("공유 문구가 복사되었습니다");
      } catch (_) {
        setStatus("복사 실패 — 공유 방법 버튼을 보세요", true);
      }
    });
  }
  $("userFilter").addEventListener("input", (e) => {
    const q = e.target.value.trim().toLowerCase();
    renderUserTable(
      q ? state.userRows.filter((r) => r.search.includes(q)) : state.userRows
    );
  });
  $("gaEventFilter").addEventListener("input", (e) => renderGaEventTable(e.target.value));
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

  boot();
})();
