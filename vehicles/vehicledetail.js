// vehicles/vehicledetail.js — language toggle without i18n keys (safe fallback)
// - Keeps existing functionality
// - Uses localStorage.lang = 'en' | 'ko'
// - Selects localized fields from vehicles.json when values are {ko,en}

(function(){
  "use strict";

  function asset(path){
    const base = document.querySelector("base")?.getAttribute("href") || "/";
    const cleanBase = base.replace(/\/+$/,"");
    const cleanPath = String(path || "").replace(/^\/+/,"");
    return cleanBase + "/" + cleanPath;
  }

  function getLang(){
    const v = (localStorage.getItem("lang") || "").toLowerCase();
    return (v === "ko" || v === "en") ? v : "en";
  }
  function setLang(next){
    const lang = (next === "ko") ? "ko" : "en";
    localStorage.setItem("lang", lang);
    document.documentElement.lang = lang;
    const btn = document.getElementById("langToggleBtn");
    if (btn) btn.textContent = (lang === "en" ? "KOR" : "ENG");
    return lang;
  }

  function pick(val, lang){
    if (val && typeof val === "object" && !Array.isArray(val)){
      if (typeof val[lang] === "string") return val[lang];
      if (lang === "ko" && typeof val.ko === "string") return val.ko;
      if (lang === "en" && typeof val.en === "string") return val.en;
    }
    return val;
  }

  const UI = {
    en: {
      invalid: "Invalid access. Please open this page from Vehicles.",
      loadFail: "Failed to load data.",
      notFound: "Vehicle data not found. Check vehicles.json (featured).",
      fillHighlights: "Add highlights in vehicles.json.",
      fillSections: "You can add section content in vehicles.json.",
      fillGallery: "Add images to show them here."
    },
    ko: {
      invalid: "잘못된 접근입니다. Vehicles 페이지에서 다시 진입하세요.",
      loadFail: "데이터를 불러오지 못했습니다.",
      notFound: "차량 정보를 찾을 수 없습니다. vehicles.json의 featured 항목을 확인하세요.",
      fillHighlights: "내용을 vehicles.json에서 채워주세요.",
      fillSections: "vehicles.json에서 섹션 내용을 추가할 수 있습니다.",
      fillGallery: "이미지를 추가하면 여기에 표시됩니다."
    }
  };

  function esc(s){
    return String(s ?? "").replace(/[&<>"']/g, m => ({
      "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
    }[m]));
  }

  function render(mount, v, lang){
    const stats = v.stats || {};
    const highlightsArr = (v.highlights || []).filter(Boolean).map(x => `<li>${esc(pick(x, lang) ?? "")}</li>`).join("");
    const highlights = highlightsArr || `<li style="opacity:.75">${esc(UI[lang].fillHighlights)}</li>`;

    const sectionsArr = (v.sections || []).map(sec => {
      const title = esc(pick(sec.title, lang) ?? sec.title ?? "");
      const bodyArr = (sec.body || []).map(p => `<p>${esc(pick(p, lang) ?? p)}</p>`).join("");
      return `
        <div class="section-block">
          <h3>${title}</h3>
          ${bodyArr}
        </div>
      `;
    }).join("");
    const sections = sectionsArr || `<div class="section-block"><h3>Concept</h3><p style="opacity:.8">${esc(UI[lang].fillSections)}</p></div>`;

    const galleryArr = (v.gallery || []).filter(Boolean).map(src => `
      <div class="shot"><img src="${esc(src)}" alt="${esc(pick(v.name, lang) ?? v.name)}"></div>
    `).join("");
    const gallery = galleryArr || `<p style="opacity:.8">${esc(UI[lang].fillGallery)}</p>`;

    document.title = `${pick(v.name, lang) ?? v.name} | Vehicles | Auto_Lab`;

    mount.innerHTML = `
      <section class="detail-hero">
        <div class="detail-cover">
          <img src="${esc(v.cover)}" alt="${esc(pick(v.name, lang) ?? v.name)}">
        </div>

        <div class="detail-panel">
          <span class="detail-chip">${esc(v.type)} • ${esc(v.season)}</span>
          <h1>${esc(pick(v.name, lang) ?? v.name)}</h1>
          <p>${esc(pick(v.tagline, lang) ?? "")}</p>

          <div class="detail-actions">
            <a class="primary" href="/vehicles/vehicles.html">← Back to Vehicles</a>
            <a href="#specs">Specs</a>
            <a href="#gallery">Gallery</a>
          </div>

          <div class="detail-grid" id="specs">
            <div class="card kv">
              <h2>KEY SPECS</h2>
              <dl>
                ${Object.entries(stats).map(([k,val]) => `
                  <dt>${esc(pick(k, lang) ?? k)}</dt><dd>${esc(pick(val, lang) ?? val)}</dd>
                `).join("")}
              </dl>
            </div>

            <div class="card bullets">
              <h2>HIGHLIGHTS</h2>
              <ul>${highlights}</ul>
            </div>
          </div>
        </div>
      </section>

      <section class="sections">
        ${sections}
      </section>

      <section id="gallery">
        <div class="card" style="margin-top:18px;">
          <h2>GALLERY</h2>
          <div class="gallery">${gallery}</div>
        </div>
      </section>
    `;
  }

  (async function(){
    const mount = document.getElementById("detailMount");
    if (!mount) return;

    // init lang + toggle button
    let lang = setLang(getLang());
    const btn = document.getElementById("langToggleBtn");
    if (btn){
      btn.addEventListener("click", () => {
        lang = setLang(lang === "en" ? "ko" : "en");
        // re-render once data already loaded
        if (window.__vehicleDetailData) render(mount, window.__vehicleDetailData, lang);
      });
    }

    const params = new URLSearchParams(location.search);
    const id = params.get("id");

    if (!id){
      mount.innerHTML = `<p style="opacity:.85">${esc(UI[lang].invalid)}</p>`;
      return;
    }

    let data;
    try{
      const res = await fetch(asset("/vehicles/vehicles.json"), { cache:"no-store" });
      data = await res.json();
    }catch(e){
      mount.innerHTML = `<p style="opacity:.85">${esc(UI[lang].loadFail)}</p>`;
      return;
    }

    const featured = data.featured || [];
    const v = featured.find(x => String(x.id).toLowerCase() === String(id).toLowerCase());

    if (!v){
      mount.innerHTML = `<p style="opacity:.85">${esc(UI[lang].notFound)}</p>`;
      return;
    }

    window.__vehicleDetailData = v; // cache for re-render on lang switch
    render(mount, v, lang);
  })();
})();
