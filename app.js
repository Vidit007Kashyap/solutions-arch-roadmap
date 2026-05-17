// ─── State ───
let mode = 'roadmap'; // 'roadmap' or 'tools'
let rmState = { phase: 1, view: 'phase', subjectId: null, tab: {} };
let tlState = { domain: 'overview', toolId: null, tab: {} };

// ─── Helpers ───
function phaseColor(id) { return PH.find(p => p.id === id).color; }
function domainColor(dId) { return DOMAINS.find(d => d.id === dId).color; }

const LV_COLORS = {
    STARTER:      { bg: '#0f3d2e', c: '#34d399' },
    INTERMEDIATE: { bg: '#1e2a4a', c: '#60a5fa' },
    ADVANCED:     { bg: '#3b1a2e', c: '#f472b6' },
    EXPLORATION:  { bg: '#2a2545', c: '#a78bfa' },
    VISION:       { bg: '#2a2a25', c: '#a8a29e' },
    MASTER:       { bg: '#3b1a2e', c: '#f472b6' },
    PROFICIENT:   { bg: '#1e2a4a', c: '#60a5fa' },
    AWARE:        { bg: '#1a3320', c: '#4ade80' },
};
function lvStyle(l) { const c = LV_COLORS[l] || LV_COLORS.STARTER; return `background:${c.bg};color:${c.c}`; }

// ─── Mobile sidebar ───
function toggleMobileSidebar() {
    document.getElementById('sidebar').classList.toggle('open');
    document.getElementById('sidebar-overlay').classList.toggle('show');
}
function closeMobileSidebar() {
    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('sidebar-overlay').classList.remove('show');
}

// ─── Mode switching ───
function setMode(m) {
    mode = m;
    document.getElementById('mode-roadmap').classList.toggle('active', m === 'roadmap');
    document.getElementById('mode-tools').classList.toggle('active', m === 'tools');
    buildPills();
    buildSidebar();
    renderMain();
}

// ─── Pills ───
function buildPills() {
    const c = document.getElementById('pills');
    c.innerHTML = '';
    if (mode === 'roadmap') {
        PH.forEach(ph => {
            const btn = document.createElement('button');
            btn.className = 'pill';
            btn.id = 'pill-' + ph.id;
            btn.textContent = ph.label;
            btn.style.color = ph.color.mid;
            btn.style.borderColor = ph.color.dark;
            btn.onclick = () => { selectPhase(ph.id); closeMobileSidebar(); };
            c.appendChild(btn);
        });
        highlightPhasePill();
    } else {
        const allBtn = document.createElement('button');
        allBtn.className = 'pill';
        allBtn.id = 'pill-overview';
        allBtn.textContent = 'Overview';
        allBtn.style.color = '#a8a29e';
        allBtn.style.borderColor = '#57534e';
        allBtn.onclick = () => { selectDomain('overview'); closeMobileSidebar(); };
        c.appendChild(allBtn);
        DOMAINS.forEach(d => {
            const btn = document.createElement('button');
            btn.className = 'pill';
            btn.id = 'pill-' + d.id;
            btn.textContent = d.label;
            btn.style.color = d.color.mid;
            btn.style.borderColor = d.color.dark;
            btn.onclick = () => { selectDomain(d.id); closeMobileSidebar(); };
            c.appendChild(btn);
        });
        highlightDomainPill();
    }
}

function highlightPhasePill() {
    document.querySelectorAll('#pills .pill').forEach(b => {
        const id = parseInt(b.id.replace('pill-', ''));
        const ph = PH.find(p => p.id === id);
        if (ph) {
            b.style.background = id === rmState.phase ? ph.color.dark : 'transparent';
            b.style.color = id === rmState.phase ? ph.color.light : ph.color.mid;
            b.style.fontWeight = id === rmState.phase ? '600' : '500';
        }
    });
}

function highlightDomainPill() {
    document.querySelectorAll('#pills .pill').forEach(b => {
        const id = b.id.replace('pill-', '');
        if (id === tlState.domain || (id === 'overview' && tlState.domain === 'overview')) {
            const d = DOMAINS.find(x => x.id === id);
            b.style.background = d ? d.color.dark : '#292524';
            b.style.color = d ? d.color.light : '#e8e9ed';
            b.style.fontWeight = '600';
        } else {
            const d = DOMAINS.find(x => x.id === id);
            b.style.background = 'transparent';
            b.style.color = d ? d.color.mid : '#a8a29e';
            b.style.fontWeight = '500';
        }
    });
}

// ─── Sidebar ───
function buildSidebar() {
    const sb = document.getElementById('sidebar');
    sb.innerHTML = '';
    if (mode === 'roadmap') buildRoadmapSidebar(sb);
    else buildToolsSidebar(sb);
}

function buildRoadmapSidebar(sb) {
    PH.forEach(ph => {
        const block = document.createElement('div');
        block.className = 'sb-section';
        block.id = 'sb-' + ph.id;

        const hdr = document.createElement('div');
        hdr.className = 'sb-hdr';
        hdr.innerHTML = `<div class="sb-dot" style="background:${ph.color.dot}"></div><div class="sb-label">${ph.label}: ${ph.title}</div><span class="sb-chev">▶</span>`;
        hdr.onclick = () => toggleRmSection(ph.id);

        const children = document.createElement('div');
        children.className = 'sb-children';
        ph.subjects.forEach(s => {
            const item = document.createElement('div');
            item.className = 'sb-child';
            item.id = 'sbc-' + s.id;
            item.textContent = s.label;
            item.onclick = e => { e.stopPropagation(); selectSubject(ph.id, s.id); closeMobileSidebar(); };
            children.appendChild(item);
        });

        block.appendChild(hdr);
        block.appendChild(children);
        sb.appendChild(block);
    });
    // Open current phase
    const cur = document.getElementById('sb-' + rmState.phase);
    if (cur) cur.classList.add('open');
}

function buildToolsSidebar(sb) {
    DOMAINS.forEach(d => {
        const block = document.createElement('div');
        block.className = 'sb-section';
        block.id = 'sb-' + d.id;

        const hdr = document.createElement('div');
        hdr.className = 'sb-hdr';
        hdr.innerHTML = `<div class="sb-dot" style="background:${d.color.dot}"></div><div class="sb-label">${d.label}</div><span class="sb-chev">▶</span>`;
        hdr.onclick = () => toggleTlSection(d.id);

        const children = document.createElement('div');
        children.className = 'sb-children';
        d.tools.forEach(t => {
            const item = document.createElement('div');
            item.className = 'sb-child';
            item.id = 'sbc-' + t.id;
            item.textContent = t.name;
            item.onclick = e => { e.stopPropagation(); selectTool(d.id, t.id); closeMobileSidebar(); };
            children.appendChild(item);
        });

        block.appendChild(hdr);
        block.appendChild(children);
        sb.appendChild(block);
    });
    if (tlState.domain !== 'overview') {
        const cur = document.getElementById('sb-' + tlState.domain);
        if (cur) cur.classList.add('open');
    }
}

// ─── Sidebar toggle ───
function toggleRmSection(phId) {
    const block = document.getElementById('sb-' + phId);
    const isOpen = block.classList.contains('open');
    document.querySelectorAll('.sb-section').forEach(b => b.classList.remove('open'));
    if (!isOpen) { block.classList.add('open'); selectPhase(phId); }
}

function toggleTlSection(dId) {
    const block = document.getElementById('sb-' + dId);
    const isOpen = block.classList.contains('open');
    document.querySelectorAll('.sb-section').forEach(b => b.classList.remove('open'));
    if (!isOpen) { block.classList.add('open'); selectDomain(dId); }
}

// ─── Phase selection (roadmap) ───
function selectPhase(phId) {
    rmState.phase = phId;
    rmState.view = 'phase';
    rmState.subjectId = null;
    highlightPhasePill();
    document.querySelectorAll('.sb-child').forEach(el => el.classList.remove('active'));
    const block = document.getElementById('sb-' + phId);
    if (block && !block.classList.contains('open')) {
        document.querySelectorAll('.sb-section').forEach(b => b.classList.remove('open'));
        block.classList.add('open');
    }
    renderMain();
}

function selectSubject(phId, subjId) {
    rmState.phase = phId;
    rmState.view = 'subject';
    rmState.subjectId = subjId;
    highlightPhasePill();
    const block = document.getElementById('sb-' + phId);
    if (block && !block.classList.contains('open')) {
        document.querySelectorAll('.sb-section').forEach(b => b.classList.remove('open'));
        block.classList.add('open');
    }
    document.querySelectorAll('.sb-child').forEach(el => el.classList.remove('active'));
    const el = document.getElementById('sbc-' + subjId);
    if (el) el.classList.add('active');
    renderMain();
}

// ─── Domain/tool selection (tools) ───
function selectDomain(dId) {
    tlState.domain = dId;
    tlState.toolId = null;
    highlightDomainPill();
    document.querySelectorAll('.sb-child').forEach(el => el.classList.remove('active'));
    if (dId !== 'overview') {
        const block = document.getElementById('sb-' + dId);
        if (block && !block.classList.contains('open')) {
            document.querySelectorAll('.sb-section').forEach(b => b.classList.remove('open'));
            block.classList.add('open');
        }
    }
    renderMain();
}

function selectTool(dId, tId) {
    tlState.domain = dId;
    tlState.toolId = tId;
    highlightDomainPill();
    const block = document.getElementById('sb-' + dId);
    if (block && !block.classList.contains('open')) {
        document.querySelectorAll('.sb-section').forEach(b => b.classList.remove('open'));
        block.classList.add('open');
    }
    document.querySelectorAll('.sb-child').forEach(el => el.classList.remove('active'));
    const el = document.getElementById('sbc-' + tId);
    if (el) el.classList.add('active');
    renderMain();
}

// ─── Main renderer ───
function renderMain() {
    const m = document.getElementById('main-inner');
    m.innerHTML = '';
    if (mode === 'roadmap') {
        if (rmState.view === 'phase') renderPhaseView(m);
        else renderSubjectView(m);
    } else {
        if (tlState.domain === 'overview' || !tlState.toolId) renderDomainView(m);
        else renderToolView(m);
    }
}

// ─── Roadmap: Phase overview ───
function renderPhaseView(m) {
    const ph = PH.find(p => p.id === rmState.phase);
    const col = ph.color;
    m.innerHTML = `
        <div class="view-header">
            <div class="view-title">${ph.label}: ${ph.title}</div>
            <div class="view-meta">${ph.subtitle} · ${ph.duration}</div>
        </div>
        <div class="view-why">${ph.why}</div>
    `;
    const g = document.createElement('div');
    g.className = 'card-grid';
    ph.subjects.forEach(s => {
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `<div class="card-num" style="color:${col.mid}">${s.label}</div><div class="card-name">${s.label.split(' ').slice(1).join(' ')}</div><div class="card-sub">${s.duration}</div>`;
        card.onclick = () => selectSubject(ph.id, s.id);
        g.appendChild(card);
    });
    m.appendChild(g);
    const hint = document.createElement('div');
    hint.className = 'hint';
    hint.textContent = 'Click any card or sidebar item to open its full syllabus.';
    m.appendChild(hint);
}

// ─── Roadmap: Subject detail ───
function renderSubjectView(m) {
    const ph = PH.find(p => p.id === rmState.phase);
    const s = ph.subjects.find(x => x.id === rmState.subjectId);
    const col = ph.color;
    const TABS = ['Units','Projects','Resources','Schedule','Mistakes','Mental Models'];
    if (!rmState.tab[s.id]) rmState.tab[s.id] = 0;

    const bc = document.createElement('div');
    bc.className = 'breadcrumb';
    bc.innerHTML = `<span onclick="selectPhase(${ph.id})">${ph.label}: ${ph.title}</span> / ${s.label}`;
    m.appendChild(bc);

    const tb = document.createElement('div');
    tb.className = 'title-bar';
    tb.innerHTML = `<div class="title-text">${s.label.split(' ').slice(1).join(' ')}</div><span class="dur-badge" style="background:${col.dark};color:${col.light}">${s.duration}</span>`;
    m.appendChild(tb);

    const why = document.createElement('div');
    why.className = 'view-why';
    why.textContent = s.why;
    m.appendChild(why);

    const tabsEl = document.createElement('div');
    tabsEl.className = 'tabs';
    const panelWrap = document.createElement('div');

    TABS.forEach((name, ti) => {
        const btn = document.createElement('button');
        btn.className = 'tab-btn' + (ti === rmState.tab[s.id] ? ' on' : '');
        btn.textContent = name;
        btn.onclick = () => {
            rmState.tab[s.id] = ti;
            tabsEl.querySelectorAll('.tab-btn').forEach((b, bi) => b.classList.toggle('on', bi === ti));
            panelWrap.querySelectorAll('.panel').forEach((p, pi) => p.classList.toggle('on', pi === ti));
        };
        tabsEl.appendChild(btn);
    });
    m.appendChild(tabsEl);

    const panels = TABS.map((_, ti) => {
        const p = document.createElement('div');
        p.className = 'panel' + (ti === rmState.tab[s.id] ? ' on' : '');
        panelWrap.appendChild(p);
        return p;
    });

    // Units
    (s.units || []).forEach(u => {
        const card = document.createElement('div');
        card.className = 'unit-card';
        const hdr = document.createElement('div');
        hdr.className = 'unit-hdr';
        hdr.innerHTML = `<span class="u-num" style="background:${col.dark};color:${col.light}">${u.num}</span><span class="u-title">${u.title}</span><span class="u-week">${u.week}</span><span class="u-chev">▶</span>`;
        hdr.onclick = () => card.classList.toggle('open');
        card.appendChild(hdr);

        const body = document.createElement('div');
        body.className = 'unit-body';
        const tg = document.createElement('div');
        tg.className = 'topic-grid';
        (u.topics || []).forEach(t => {
            tg.innerHTML += `<div class="topic-chip"><div class="tc-name">${t.n}</div><div class="tc-note">${t.d}</div></div>`;
        });
        body.appendChild(tg);
        if (u.insight) {
            body.innerHTML += `<div class="insight-box">${u.insight}</div>`;
        }
        card.appendChild(body);
        panels[0].appendChild(card);
    });

    // Projects
    (s.projects || []).forEach(p => {
        panels[1].innerHTML += `<div class="proj-item"><span class="proj-lv" style="${lvStyle(p.l)}">${p.l}</span><div class="proj-name">${p.n}</div><div class="proj-desc">${p.d}</div></div>`;
    });

    // Resources
    (s.resources || []).forEach(r => {
        panels[2].innerHTML += `<div class="res-row"><span class="res-type">${r.t}</span><div><div class="res-name">${r.n}</div><div class="res-sub">${r.s || ''}</div></div></div>`;
    });

    // Schedule
    (s.schedule || []).forEach(w => {
        panels[3].innerHTML += `<div class="week-row"><span class="wk">${w.p}</span><div class="wk-task">${w.t}</div></div>`;
    });

    // Mistakes
    (s.mistakes || []).forEach(mk => {
        panels[4].innerHTML += `<div class="mistake-row"><div class="m-dot">!</div><div class="m-text"><b>${mk.t}:</b> ${mk.d}</div></div>`;
    });

    // Mental Models
    (s.mentalModels || []).forEach(mm => {
        panels[5].innerHTML += `<div class="mm-card">${mm}</div>`;
    });

    m.appendChild(panelWrap);
}

// ─── Tools: Domain overview ───
function renderDomainView(m) {
    if (tlState.domain === 'overview') {
        m.innerHTML = `
            <div class="view-header"><div class="view-title">Phase 8 — Technology & Tools Mastery</div><div class="view-meta">Every technology, tool, and framework a world-class Solutions Architect must master</div></div>
            <div class="view-why">Phase 8 maps every technology, tool, and framework a world-class Solutions Architect must master — organised by domain. Each tool entry includes depth level, core concepts, hands-on projects, resources, schedule, and common mistakes. Click any domain or tool in the sidebar to begin.</div>
        `;
        const g = document.createElement('div');
        g.className = 'card-grid';
        DOMAINS.forEach(d => {
            const card = document.createElement('div');
            card.className = 'card';
            card.innerHTML = `<div class="card-num" style="color:${d.color.mid}">${d.label}</div><div class="card-name">${d.tools.length} tools</div><div class="card-sub">${d.tools.map(t => t.name.split(' ')[0]).join(', ')}</div>`;
            card.onclick = () => selectDomain(d.id);
            g.appendChild(card);
        });
        m.appendChild(g);
        const hint = document.createElement('div');
        hint.className = 'hint';
        hint.textContent = 'Click any domain card or sidebar item to explore tools in depth.';
        m.appendChild(hint);
        return;
    }

    const d = DOMAINS.find(x => x.id === tlState.domain);
    m.innerHTML = `
        <div class="view-header"><div class="view-title">${d.label}</div><div class="view-meta">${d.tools.length} tools · Click any card to open the full syllabus</div></div>
        <div class="view-why">${d.intro}</div>
    `;
    const g = document.createElement('div');
    g.className = 'card-grid';
    d.tools.forEach(t => {
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `<span class="level-badge" style="${lvStyle(t.level)}">${t.level}</span><div class="card-name" style="margin-top:8px">${t.name}</div>`;
        card.onclick = () => selectTool(d.id, t.id);
        g.appendChild(card);
    });
    m.appendChild(g);
}

// ─── Tools: Tool detail ───
function renderToolView(m) {
    const d = DOMAINS.find(x => x.id === tlState.domain);
    const t = d.tools.find(x => x.id === tlState.toolId);
    const TABS = ['Concepts','Projects','Resources','Schedule','Mistakes'];
    if (!tlState.tab[t.id]) tlState.tab[t.id] = 0;

    const bc = document.createElement('div');
    bc.className = 'breadcrumb';
    bc.innerHTML = `<span onclick="selectDomain('${d.id}')">${d.label}</span> / ${t.name}`;
    m.appendChild(bc);

    const tb = document.createElement('div');
    tb.className = 'title-bar';
    tb.innerHTML = `<div class="title-text">${t.name}</div><span class="level-badge" style="${lvStyle(t.level)}">${t.level}</span>`;
    m.appendChild(tb);

    const why = document.createElement('div');
    why.className = 'view-why';
    why.textContent = t.why;
    m.appendChild(why);

    const tabsEl = document.createElement('div');
    tabsEl.className = 'tabs';
    const panelWrap = document.createElement('div');

    TABS.forEach((name, ti) => {
        const btn = document.createElement('button');
        btn.className = 'tab-btn' + (ti === tlState.tab[t.id] ? ' on' : '');
        btn.textContent = name;
        btn.onclick = () => {
            tlState.tab[t.id] = ti;
            tabsEl.querySelectorAll('.tab-btn').forEach((b, bi) => b.classList.toggle('on', bi === ti));
            panelWrap.querySelectorAll('.panel').forEach((p, pi) => p.classList.toggle('on', pi === ti));
        };
        tabsEl.appendChild(btn);
    });
    m.appendChild(tabsEl);

    const panels = TABS.map((_, ti) => {
        const p = document.createElement('div');
        p.className = 'panel' + (ti === tlState.tab[t.id] ? ' on' : '');
        panelWrap.appendChild(p);
        return p;
    });

    // Concepts
    const cg = document.createElement('div');
    cg.className = 'concept-grid';
    (t.concepts || []).forEach(cc => {
        cg.innerHTML += `<div class="concept-chip"><div class="cc-name">${cc.n}</div><div class="cc-note">${cc.d}</div></div>`;
    });
    panels[0].appendChild(cg);

    // Projects
    (t.projects || []).forEach(p => {
        panels[1].innerHTML += `<div class="proj-item"><span class="proj-lv" style="${lvStyle(p.l)}">${p.l}</span><div class="proj-name">${p.n}</div><div class="proj-desc">${p.d}</div></div>`;
    });

    // Resources
    (t.resources || []).forEach(r => {
        panels[2].innerHTML += `<div class="res-row"><span class="res-type">${r.t}</span><div><div class="res-name">${r.n}</div><div class="res-sub">${r.s || r.d || ''}</div></div></div>`;
    });

    // Schedule
    (t.schedule || []).forEach(w => {
        panels[3].innerHTML += `<div class="week-row"><span class="wk">${w.p}</span><div class="wk-task">${w.t}</div></div>`;
    });

    // Mistakes
    (t.mistakes || []).forEach(mk => {
        panels[4].innerHTML += `<div class="mistake-row"><div class="m-dot">!</div><div class="m-text"><b>${mk.t}:</b> ${mk.d}</div></div>`;
    });

    m.appendChild(panelWrap);
}

// ─── Init ───
buildPills();
buildSidebar();
selectPhase(1);
