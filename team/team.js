/* team/team.js — robust KO/EN toggle, no i18n keys required
   - team.json uses {en,ko} objects for content (hero/metrics/achievements)
   - members stays as-is (usually English roles), but still searchable/filterable
   - Works with or without main/script.js:
     • If window.__getLang/__setLang exist → uses them
     • Otherwise → uses localStorage + dispatches a custom event
   - HTML text can be switched via data-en/data-ko (safe: keeps fallback text)
*/
(async function(){
  "use strict";

  const $ = (id) => document.getElementById(id);

  // ---------------- Base-safe asset path (works with <base href="/Autolab/">)
  function asset(path){
    const base = document.querySelector('base')?.getAttribute('href') || '/';
    return base.replace(/\/+$/, '') + '/' + String(path).replace(/^\/+/, '');
  }

  // ---------------- Lang manager (single source of truth)
  const LANG_KEY = "lang";

  function getLang(){
    if (typeof window.__getLang === "function") return window.__getLang();
    const v = (localStorage.getItem(LANG_KEY) || "en").toLowerCase();
    return (v === "ko" || v === "en") ? v : "en";
  }

  function setLang(next){
    const lang = (next === "ko") ? "ko" : "en";
    if (typeof window.__setLang === "function") {
      window.__setLang(lang);
      return lang;
    }
    localStorage.setItem(LANG_KEY, lang);
    document.documentElement.lang = lang;
    // notify listeners
    window.dispatchEvent(new CustomEvent("autolab:langchange", { detail: { lang } }));
    return lang;
  }

  function onLangChange(fn){
    if (typeof window.__onLangChange === "function") {
      window.__onLangChange(fn);
      return;
    }
    window.addEventListener("autolab:langchange", () => fn());
  }

  // ---------------- HTML data-en/data-ko apply (safe fallback)
  function applyHtmlLang(){
    const L = getLang();
    document.documentElement.lang = L;

    document.querySelectorAll("[data-en]").forEach(el => {
      const next = (L === "ko")
        ? (el.getAttribute("data-ko") || el.getAttribute("data-en"))
        : el.getAttribute("data-en");

      // Only override when attribute exists; keep authored fallback otherwise
      if (next != null) el.textContent = next;
    });
  }

  // ---------------- Pick localized string from value
  function pick(v){
    const L = getLang();
    if (v == null) return "";
    if (typeof v === "string" || typeof v === "number") return String(v);
    if (typeof v === "object" && !Array.isArray(v)){
      const a = v[L];
      if (typeof a === "string" || typeof a === "number") return String(a);
      const b = v.en;
      if (typeof b === "string" || typeof b === "number") return String(b);
      const c = v.ko;
      if (typeof c === "string" || typeof c === "number") return String(c);
      for (const key of Object.keys(v)){
        const x = v[key];
        if (typeof x === "string" || typeof x === "number") return String(x);
      }
    }
    return "";
  }

  const esc = (s)=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));

  // ---------------- Fetch data once
  let data;
  try{
    const res = await fetch(asset("team/team.json"), { cache: "no-store" });
    if (!res.ok) return;
    data = await res.json();
  }catch(e){
    return;
  }

  // ---------------- UI: toggle button label (always English)
  function syncLangToggleButton(){
    const L = getLang();
    const btn = $("langToggleBtn");
    if (!btn) return;
    // show the OTHER language as action
    btn.textContent = (L === "en") ? "KOR" : "ENG";
  }

  function wireLangToggle(){
    const btn = $("langToggleBtn");
    if (!btn) return;
    btn.addEventListener("click", () => {
      const next = (getLang() === "en") ? "ko" : "en";
      setLang(next);
    });
  }

  // ---------------- Render all sections (rerunnable)
  function renderHero(){
    const h = data.hero || {};
    const heroEyebrow = $("heroEyebrow");
    const heroTitle = $("heroTitle");
    const heroLead = $("heroLead");
    const heroImage = $("heroImage");
    const heroCaptionBold = $("heroCaptionBold");
    const heroCaption = $("heroCaption");

    if (heroEyebrow) heroEyebrow.textContent = pick(h.eyebrow);
    if (heroTitle) heroTitle.textContent = pick(h.title);
    if (heroLead) heroLead.textContent = pick(h.lead);
    if (heroImage && h.image) heroImage.src = h.image;
    if (heroCaptionBold) heroCaptionBold.textContent = pick(h.caption_bold);
    if (heroCaption) heroCaption.textContent = pick(h.caption);
  }

  function renderMetrics(){
    const heroMetrics = $("heroMetrics");
    if (!heroMetrics) return;
    heroMetrics.innerHTML = (data.metrics || []).map(m => `
      <div class="metric">
        <b>${esc(pick(m.label))}</b>
        <span>${esc(pick(m.value))}</span>
      </div>
    `).join("");
  }

  function renderTimeline(){
    const timeline = $("timeline");
    if (!timeline) return;
    timeline.innerHTML = (data.achievements || []).map(t => `
      <article class="t-item">
        <div class="date">${esc(pick(t.date))}</div>
        <div>
          <h3>${esc(pick(t.title))}</h3>
          <p>${esc(pick(t.desc))}</p>
        </div>
      </article>
    `).join("");
  }

  function renderMembers(){
    const members = data.members || [];
    const divSel = $("memberDivision");
    const search = $("memberSearch");
    const grid = $("memberGrid");

    if (!divSel || !search || !grid) return;

    // Always English for UI controls (per your rule)
    const divisions = [...new Set(members.map(m => pick(m.division)).filter(Boolean))].sort();
    divSel.innerHTML = ['<option value="ALL">All Divisions</option>']
      .concat(divisions.map(d => `<option value="${esc(d)}">${esc(d)}</option>`))
      .join("");

    if (!search.getAttribute("placeholder")) {
      search.setAttribute("placeholder", "Search name or role");
    }

    function match(m){
      const mDivision = pick(m.division);
      if (divSel.value !== "ALL" && mDivision !== divSel.value) return false;

      const q = (search.value || "").toLowerCase();
      const hay = `${pick(m.name)} ${pick(m.role)} ${mDivision}`.toLowerCase();
      return !q || hay.includes(q);
    }

    function draw(){
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
      `).join("") || '<p style="opacity:.8">No members found.</p>';
    }

    // preserve user input on rerender
    const prevDivision = divSel.value;
    const prevSearch = search.value;

    divSel.onchange = draw;
    search.oninput = draw;

    // restore
    divSel.value = prevDivision;
    search.value = prevSearch;

    draw();
  }

  function renderAll(){
    applyHtmlLang();          // switches any data-en/data-ko
    syncLangToggleButton();   // updates toggle label
    renderHero();
    renderMetrics();
    renderTimeline();
    renderMembers();
  }

  // ---------------- Init
  wireLangToggle();
  renderAll();
  onLangChange(renderAll);
})();
