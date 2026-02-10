// /vehicles/vehicles.js — language toggle without i18n keys (safe fallback)
// - Keeps all existing functionality (featured cards, previous modal, filters)
// - Uses localStorage.lang = 'en' | 'ko'
// - Does NOT require any i18n json; it only switches a few UI strings + selects ko/en fields in vehicles.json when present

(function(){
  "use strict";

  // ---------- base-safe asset path ----------
  function asset(path){
    const base = document.querySelector("base")?.getAttribute("href") || "/";
    const cleanBase = base.replace(/\/+$/,"");
    const cleanPath = String(path || "").replace(/^\/+/,"");
    return cleanBase + "/" + cleanPath;
  }

  // ---------- language state ----------
  function getLang(){
    const v = (localStorage.getItem("lang") || "").toLowerCase();
    return (v === "ko" || v === "en") ? v : "en";
  }
  function setLang(next){
    const lang = (next === "ko") ? "ko" : "en";
    localStorage.setItem("lang", lang);
    document.documentElement.lang = lang;
    // Toggle button label is always English: ENG/KOR
    const btn = document.getElementById("langToggleBtn");
    if (btn) btn.textContent = (lang === "en" ? "KOR" : "ENG");
    return lang;
  }

  // ---------- pick localized value from data ----------
  // If value is {ko: "...", en: "..."}, choose by lang. Otherwise return as-is.
  function pick(val, lang){
    if (val && typeof val === "object" && !Array.isArray(val)){
      if (typeof val[lang] === "string") return val[lang];
      if (lang === "ko" && typeof val.ko === "string") return val.ko;
      if (lang === "en" && typeof val.en === "string") return val.en;
    }
    return val;
  }

  function esc(s){
    return String(s ?? "").replace(/[&<>"']/g, m => ({
      "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
    }[m]));
  }

  // ---------- UI strings (minimal, page-specific) ----------
  const UI = {
    en: {
      hero: "Auto_Lab develops two cars each season (EV / CV). Explore current-season cars below, and browse past seasons for specs and highlights.",
      previousLead: "Filter previous cars by year/platform and review key specifications for each vehicle.",
      searchPh: "Search year or name (e.g., 2025, ALE-25)",
      loadFail: "Failed to load data.",
      seasonEmpty: "No vehicle data for this season.",
      modalSpecs: "Vehicle Specs",
      seasonLabel: "Season"
    },
    ko: {
      hero: "Auto_Lab은 매 시즌 2대의 차량(EV / CV)을 병행 개발하여 대회에 출전합니다. 아래에서 시즌 대표 차량을 확인하고, 이전 시즌 차량의 제원도 탐색할 수 있습니다.",
      previousLead: "연도/플랫폼별로 이전 차량을 필터링하고, 각 차량의 주요 제원을 확인할 수 있습니다.",
      searchPh: "연도/차량명 검색 (예: 2025, ALE-25)",
      loadFail: "데이터를 불러오지 못했습니다.",
      seasonEmpty: "해당 시즌 차량 데이터가 없습니다.",
      modalSpecs: "Vehicle Specs", / keep header/button style English if desired
      seasonLabel: "Season"        / keep label English per your earlier rule
    }
  };

  function applyStaticText(lang){
    // hero paragraph: first p inside .vehicles-hero
    const heroP = document.querySelector(".vehicles-hero p");
    if (heroP) heroP.textContent = UI[lang].hero;

    // previous lead: first p inside #previous .previous-head
    const prevP = document.querySelector("#previous .previous-head p");
    if (prevP) prevP.textContent = UI[lang].previousLead;

    // search placeholder
    const yearInput = document.getElementById("filterYear");
    if (yearInput) yearInput.setAttribute("placeholder", UI[lang].searchPh);

    // modal title default (actual title changes when opening modal)
    const modalTitle = document.getElementById("modalTitle");
    if (modalTitle && !modalTitle.textContent.trim()) modalTitle.textContent = UI[lang].modalSpecs;

    // season label
    const seasonLabel = document.querySelector(".select-wrap > span");
    if (seasonLabel) seasonLabel.textContent = UI[lang].seasonLabel;
  }

  // ---------- main app ----------
  (async function(){
    const featuredGrid = document.getElementById("featuredGrid");
    const previousGrid = document.getElementById("previousGrid");
    const filterType = document.getElementById("filterType");
    const filterYear = document.getElementById("filterYear");
    const seasonSelect = document.getElementById("seasonSelect");

    const modal = document.getElementById("specModal");
    const modalTitle = document.getElementById("modalTitle");
    const modalBody = document.getElementById("modalBody");
    const modalClose = document.getElementById("modalClose");

    if (!featuredGrid || !previousGrid) return;

    // init lang + wire toggle
    let lang = setLang(getLang());
    applyStaticText(lang);

    const langBtn = document.getElementById("langToggleBtn");
    if (langBtn){
      langBtn.addEventListener("click", () => {
        lang = setLang(lang === "en" ? "ko" : "en");
        applyStaticText(lang);
        renderFeatured(seasonSelect ? seasonSelect.value : currentSeasonDefault());
        renderPrevious();
      });
    }

    let data;
    try{
      const res = await fetch(asset("/vehicles/vehicles.json"), { cache: "no-store" });
      data = await res.json();
    }catch(err){
      featuredGrid.innerHTML = `<p style="opacity:.8">${esc(UI[lang].loadFail)}</p>`;
      return;
    }

    const featuredAll = data.featured || [];
    const previous = data.previous || [];

    function seasonsFromFeatured(){
      const set = new Set(featuredAll.map(v => String(v.season || "").trim()).filter(Boolean));
      return Array.from(set).sort((a,b) => Number(b) - Number(a));
    }
    function currentSeasonDefault(){
      const seasons = seasonsFromFeatured();
      return seasons[0] || "";
    }
    function populateSeasonSelect(){
      if (!seasonSelect) return;
      const seasons = seasonsFromFeatured();
      seasonSelect.innerHTML = seasons.map(s => `<option value="${esc(s)}">${esc(s)}</option>`).join("");
      seasonSelect.value = currentSeasonDefault();
      seasonSelect.addEventListener("change", () => renderFeatured(seasonSelect.value));
    }

    function featuredPairForSeason(season){
      const list = featuredAll.filter(v => String(v.season) === String(season));
      const ev = list.find(v => v.type === "EV");
      const cv = list.find(v => v.type === "CV");
      const rest = list.filter(v => v !== ev && v !== cv);
      return [ev, cv].filter(Boolean).concat(rest.slice(0,2));
    }

    function detailHref(id){
      return `/vehicles/detail.html?id=${encodeURIComponent(id)}`;
    }

    function renderFeatured(season){
      const pair = featuredPairForSeason(season);
      if (pair.length === 0){
        featuredGrid.innerHTML = `<p style="opacity:.8">${esc(UI[lang].seasonEmpty)}</p>`;
        return;
      }

      featuredGrid.innerHTML = pair.slice(0,2).map(v => {
        const stats = v.stats || {};
        const highlights = (v.highlights || []).slice(0,3).map(x => `<li>${esc(pick(x, lang) ?? "")}</li>`).join("");
        return `
          <article class="vehicle-card">
            <div class="vehicle-card__media">
              <img src="${esc(v.cover)}" alt="${esc(pick(v.name, lang) ?? v.name)}">
            </div>

            <div class="vehicle-card__body">
              <span class="vehicle-chip">${esc(v.type)} • ${esc(v.season)}</span>

              <div class="vehicle-title">
                <h3>${esc(pick(v.name, lang) ?? v.name)}</h3>
                <span>${esc(v.type)} PLATFORM</span>
              </div>

              <p class="vehicle-card__tagline">${esc(pick(v.tagline, lang) ?? "")}</p>

              <div class="vehicle-split">
                <div class="vehicle-stats">
                  <h4>KEY SPECS</h4>
                  <dl>
                    ${Object.entries(stats).slice(0,6).map(([k,val]) => `
                      <dt>${esc(pick(k, lang) ?? k)}</dt>
                      <dd>${esc(pick(val, lang) ?? val)}</dd>
                    `).join("")}
                  </dl>
                </div>

                <div class="vehicle-highlights">
                  <h4>HIGHLIGHTS</h4>
                  <ul>${highlights}</ul>
                </div>
              </div>

              <div class="vehicle-cta">
                <a href="${detailHref(v.id)}">View Details →</a>
              </div>
            </div>
          </article>
        `;
      }).join("");
    }

    function matchesPrev(v){
      const t = filterType ? filterType.value : "ALL";
      const q = (filterYear ? filterYear.value : "").trim().toLowerCase();
      if (t !== "ALL" && v.type !== t) return false;
      if (!q) return true;
      const hay = `${pick(v.name, lang) ?? v.name} ${v.season} ${v.type}`.toLowerCase();
      return hay.includes(q);
    }

    function renderPrevious(){
      const items = previous.filter(matchesPrev);

      previousGrid.innerHTML = items.map(v => `
        <article class="prev-card" data-vid="${esc(v.id)}" tabindex="0" role="button" aria-label="Open specs for ${esc(pick(v.name, lang) ?? v.name)}">
          <div class="prev-card__media">
            <img src="${esc(v.cover)}" alt="${esc(pick(v.name, lang) ?? v.name)}">
          </div>
          <div class="prev-card__body">
            <div class="prev-card__top">
              <h3>${esc(pick(v.name, lang) ?? v.name)}</h3>
              <span>${esc(v.type)} • ${esc(v.season)}</span>
            </div>

            <div class="prev-specs">
              ${Object.entries(v.specs || {}).slice(0,3).map(([k,val]) => `
                <div class="row"><b>${esc(pick(k, lang) ?? k)}</b><span>${esc(pick(val, lang) ?? val)}</span></div>
              `).join("")}
            </div>
          </div>
        </article>
      `).join("");

      previousGrid.querySelectorAll(".prev-card").forEach(card => {
        const id = card.getAttribute("data-vid");
        card.addEventListener("click", () => openModal(id));
        card.addEventListener("keydown", (e) => {
          if (e.key === "Enter" || e.key === " ") openModal(id);
        });
      });
    }

    function openModal(id){
      const v = previous.find(x => x.id === id);
      if (!v) return;

      modalTitle.textContent = `${pick(v.name, lang) ?? v.name} • ${v.type} • ${v.season}`;
      const rows = Object.entries(v.specs || {}).map(([k,val]) => `
        <tr><th>${esc(pick(k, lang) ?? k)}</th><td>${esc(pick(val, lang) ?? val)}</td></tr>
      `).join("");

      modalBody.innerHTML = `<table class="spec-table"><tbody>${rows}</tbody></table>`;
      modal.classList.add("open");
      modal.setAttribute("aria-hidden","false");
      document.body.style.overflow = "hidden";
    }

    function closeModal(){
      modal.classList.remove("open");
      modal.setAttribute("aria-hidden","true");
      document.body.style.overflow = "";
    }

    modalClose?.addEventListener("click", closeModal);
    modal?.addEventListener("click", (e) => { if (e.target === modal) closeModal(); });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape" && modal.classList.contains("open")) closeModal(); });

    filterType?.addEventListener("change", renderPrevious);
    filterYear?.addEventListener("input", renderPrevious);

    populateSeasonSelect();
    renderFeatured(seasonSelect ? seasonSelect.value : currentSeasonDefault());
    renderPrevious();
  })();
})();
