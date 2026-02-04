/* team/team.js (v3.1 safe ko/en + no i18n + EV/CV tabs + pagination) */
(async function(){
  const $ = (id) => document.getElementById(id);

  // Base-safe asset path (works with <base href="/Autolab/">)
  function asset(path){
    const base = document.querySelector('base')?.getAttribute('href') || '/';
    return base.replace(/\/+$/, '') + '/' + String(path).replace(/^\/+/, '');
  }

  // Language: 'en' default, persisted in localStorage
  function getLang(){
    const v = (localStorage.getItem('lang') || 'en').toLowerCase();
    return (v === 'ko' || v === 'en') ? v : 'en';
  }
  const lang = getLang();

  // --- Language toggle (safe) ---
  // Some pages rely on main/script.js to bind this, but if that script errors on this page
  // the button can become inert. We bind locally as a fallback without changing UI/design.
  const langToggleBtn = document.getElementById('langToggleBtn');
  if (langToggleBtn && !langToggleBtn.dataset.langBound){
    langToggleBtn.dataset.langBound = '1';
    langToggleBtn.addEventListener('click', (e) => {
      // capture-phase handler to avoid double-toggle if another listener exists
      e.preventDefault();
      e.stopImmediatePropagation();

      const cur = getLang();
      const next = (cur === 'en') ? 'ko' : 'en';
      localStorage.setItem('lang', next);

      // Reload to let each page's renderer apply the selected language.
      // Keep the same URL (including hash) to preserve scroll position intent.
      location.reload();
    }, true);
  }

  // Pick localized string from value:
  // - string -> string
  // - {en,ko} -> v[lang] fallback to v.en/first string value
  function pick(v){
    if (v == null) return '';
    if (typeof v === 'string' || typeof v === 'number') return String(v);
    if (typeof v === 'object'){
      const a = v[lang];
      if (typeof a === 'string' || typeof a === 'number') return String(a);
      const b = v.en;
      if (typeof b === 'string' || typeof b === 'number') return String(b);
      const c = v.ko;
      if (typeof c === 'string' || typeof c === 'number') return String(c);
      // last resort: first string-ish value in object
      for (const key of Object.keys(v)){
        const x = v[key];
        if (typeof x === 'string' || typeof x === 'number') return String(x);
      }
    }
    return '';
  }

  const esc = (s)=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));

  let data;
  try{
    const res = await fetch(asset('team/team.json'), { cache: 'no-store' });
    if(!res.ok) return;
    data = await res.json();
  }catch(e){
    return;
  }

  /* HERO */
  const h = data.hero || {};
  const heroEyebrow = $('heroEyebrow');
  const heroTitle = $('heroTitle');
  const heroLead = $('heroLead');
  const heroImage = $('heroImage');
  const heroCaptionBold = $('heroCaptionBold');
  const heroCaption = $('heroCaption');

  if (heroEyebrow) heroEyebrow.textContent = pick(h.eyebrow);
  if (heroTitle) heroTitle.textContent = pick(h.title);
  if (heroLead) heroLead.textContent = pick(h.lead);
  if (heroImage && h.image) heroImage.src = h.image;
  if (heroCaptionBold) heroCaptionBold.textContent = pick(h.caption_bold);
  if (heroCaption) heroCaption.textContent = pick(h.caption);

  /* Metrics */
  const heroMetrics = $('heroMetrics');
  if (heroMetrics){
    heroMetrics.innerHTML = (data.metrics || []).map(m => `
      <div class="metric">
        <b>${esc(pick(m.label))}</b>
        <span>${esc(pick(m.value))}</span>
      </div>
    `).join('');
  }

  /* Timeline / Achievements */
  const timeline = $('timeline');
  if (timeline){
    timeline.innerHTML = (data.achievements || []).map(t => `
      <article class="t-item">
        <div class="date">${esc(pick(t.date))}</div>
        <div>
          <h3>${esc(pick(t.title))}</h3>
          <p>${esc(pick(t.desc))}</p>
        </div>
      </article>
    `).join('');
  }

  /* Members */
  const members = data.members || [];
  const divSel = $('memberDivision');
  const search = $('memberSearch');
  const grid = $('memberGrid');
  const pager = document.getElementById('memberPagination');

  const PAGE_SIZE = 8;
  let currentPage = 1;
  function resetPage(){ currentPage = 1; }

  // EV/CV tabs
  const tabAll = document.getElementById('tabAll');
  const tabEV  = document.getElementById('tabEV');
  const tabCV  = document.getElementById('tabCV');

  if (divSel && search && grid){

    // --- EV/CV tab state ---
    let teamFilter = 'ALL'; // ALL | EV | CV

    function classifyTeam(m){
      // JSON에 team: "EV" | "CV" 넣는 방식
      const t = String(pick(m.team) || '').trim().toUpperCase();
      if (t === 'EV' || t === 'CV') return t;
      return 'CV'; // fallback
    }

    function baseListByTeam(){
      if (teamFilter === 'ALL') return members;
      return members.filter(m => classifyTeam(m) === teamFilter);
    }

    function buildDivisionOptions(list){
      const divisions = [...new Set(list.map(m => pick(m.division)).filter(Boolean))].sort();
      divSel.innerHTML = ['<option value="ALL">All Divisions</option>']
        .concat(divisions.map(d => `<option value="${esc(d)}">${esc(d)}</option>`))
        .join('');
    }

    // 초기 Division 옵션은 전체 멤버 기준
    buildDivisionOptions(members);

    // Always English placeholder (do not localize UI controls)
    if (!search.getAttribute('placeholder')) {
      search.setAttribute('placeholder', 'Search name or role');
    }

    function setActiveTab(next){
      teamFilter = next;

      const tabs = [tabAll, tabEV, tabCV].filter(Boolean);
      tabs.forEach(btn => {
        const on = (btn.dataset.team === next);
        btn.classList.toggle('active', on);
        btn.setAttribute('aria-selected', on ? 'true' : 'false');
      });

      // 탭이 바뀌면 Division 목록도 그 탭 기준으로 갱신 + 선택값 리셋
      buildDivisionOptions(baseListByTeam());
      divSel.value = 'ALL';

      resetPage();
      renderMembers();
    }

    [tabAll, tabEV, tabCV].filter(Boolean).forEach(btn => {
      btn.addEventListener('click', () => setActiveTab(btn.dataset.team));
    });

    function match(m){
      // 먼저 team 탭 필터 적용
      if (teamFilter !== 'ALL' && classifyTeam(m) !== teamFilter) return false;

      // division 필터
      const mDivision = pick(m.division);
      if (divSel.value !== 'ALL' && mDivision !== divSel.value) return false;

      // 검색
      const q = (search.value || '').toLowerCase();
      const hay = `${pick(m.name)} ${pick(m.role)} ${mDivision}`.toLowerCase();
      return !q || hay.includes(q);
    }

    function renderMembers(){
      const list = members.filter(match);

      // --- pagination ---
      const total = list.length;
      const totalPages = Math.ceil(total / PAGE_SIZE);

      if (currentPage > totalPages) currentPage = totalPages || 1;

      const start = (currentPage - 1) * PAGE_SIZE;
      const pageItems = list.slice(start, start + PAGE_SIZE);

      // cards
      grid.innerHTML = pageItems.map(m => `
        <article class="member-card">
          <div class="member-photo">
            <img src="${esc(pick(m.image) || 'team/images/member-placeholder.jpg')}" alt="${esc(pick(m.name) || 'Member')}">
          </div>
          <div class="member-body">
            <h3>${esc(pick(m.name))}</h3>
            <div class="meta">
              <span>${esc(pick(m.role))}</span>
              <span class="pill">${esc(pick(m.division))}</span>
            </div>
          </div>
        </article>
      `).join('') || '<p style="opacity:.8">No members found.</p>'; // always English

      // pager UI
      if (!pager) return;

      if (totalPages <= 1){
        pager.innerHTML = '';
        return;
      }

      pager.innerHTML = Array.from({ length: totalPages }, (_, i) => {
        const p = i + 1;
        const active = (p === currentPage);
        return `
          <button type="button"
                  class="${active ? 'active' : ''}"
                  ${active ? 'disabled' : ''}
                  data-page="${p}"
                  aria-label="Page ${p}">
            ${p}
          </button>
        `;
      }).join('');

      pager.querySelectorAll('button[data-page]').forEach(btn => {
        btn.onclick = () => {
          currentPage = Number(btn.dataset.page) || 1;
          renderMembers();
          grid.scrollIntoView({ behavior: 'smooth', block: 'start' });
        };
      });
    }

    // 🔥 필터/검색 바뀌면 항상 1페이지로
    divSel.onchange = () => { resetPage(); renderMembers(); };
    search.oninput = () => { resetPage(); renderMembers(); };

    // 초기 탭 상태 반영
    if (tabAll) setActiveTab('ALL');
    else renderMembers();
  }

})();
