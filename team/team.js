/* team/team.js (v3 safe ko/en + no i18n) */
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

  if (divSel && search && grid){
    const divisions = [...new Set(members.map(m => pick(m.division)).filter(Boolean))].sort();

    // Always English (per your rule for UI controls)
    divSel.innerHTML = ['<option value="ALL">All Divisions</option>']
      .concat(divisions.map(d => `<option value="${esc(d)}">${esc(d)}</option>`))
      .join('');

    // Always English placeholder (do not localize UI controls)
    if (!search.getAttribute('placeholder')) {
      search.setAttribute('placeholder', 'Search name or role');
    }

    function match(m){
      const mDivision = pick(m.division);
      if (divSel.value !== 'ALL' && mDivision !== divSel.value) return false;

      const q = (search.value || '').toLowerCase();
      const hay = `${pick(m.name)} ${pick(m.role)} ${mDivision}`.toLowerCase();
      return !q || hay.includes(q);
    }

    function renderMembers(){
      const list = members.filter(match);
      grid.innerHTML = list.map(m => `
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
    }

    divSel.onchange = renderMembers;
    search.oninput = renderMembers;
    renderMembers();
  }
})();
