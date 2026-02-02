/* team/team.js — SAFE KO/EN toggle + keep existing features
   - Reads global language if available (window.__getLang / window.__setLang / window.__onLangChange)
   - Falls back to localStorage.lang if global helpers are absent
   - Keeps members search/division filter functionality
   - Supports {ko,en} fields in team.json (hero/metrics/achievements etc.)
   - "members" can stay single-language; if you later add {ko,en} it still works
   - Toggle button label stays English: KOR / ENG
*/
(async function () {
  "use strict";

  const $ = (id) => document.getElementById(id);

  // ----- base-safe asset path (works with <base href="/Autolab/">) -----
  function asset(path) {
    const base = document.querySelector("base")?.getAttribute("href") || "/";
    return base.replace(/\/+$/, "") + "/" + String(path || "").replace(/^\/+/, "");
  }

  // ----- language: use global if present, else localStorage -----
  function getLang() {
    const v = (window.__getLang ? window.__getLang() : localStorage.getItem("lang") || "en");
    const s = String(v || "en").toLowerCase();
    return s === "ko" || s === "en" ? s : "en";
  }

  function setLang(next) {
    const lang = next === "ko" ? "ko" : "en";

    // Prefer global setter (so every page stays in sync)
    if (window.__setLang) {
      window.__setLang(lang);
    } else {
      localStorage.setItem("lang", lang);
      document.documentElement.lang = lang;

      // notify same-page listeners
      window.dispatchEvent(new CustomEvent("autolab:langchange", { detail: { lang } }));
    }

    syncLangToggleLabel();
    return lang;
  }

  function onLangChange(cb) {
    // If your project provides a registrar, use it
    if (typeof window.__onLangChange === "function") {
      window.__onLangChange(cb);
      return;
    }
    // fallback: listen to our custom event
    window.addEventListener("autolab:langchange", () => cb());
    // also react to storage changes (other tabs / or some implementations)
    window.addEventListener("storage", (e) => {
      if (e.key === "lang") cb();
    });
  }

  function syncLangToggleLabel() {
    const btn = $("langToggleBtn");
    if (!btn) return;
    const L = getLang();
    // label in English only
    btn.textContent = (L === "en") ? "KOR" : "ENG";
  }

  // ----- pick localized value from {ko,en} or return string -----
  function pick(val) {
    const L = getLang();
    if (val == null) return "";
    if (typeof val === "string" || typeof val === "number") return String(val);
    if (typeof val === "object" && !Array.isArray(val)) {
      const a = val[L];
      if (typeof a === "string" || typeof a === "number") return String(a);
      const b = val.en;
      if (typeof b === "string" || typeof b === "number") return String(b);
      const c = val.ko;
      if (typeof c === "string" || typeof c === "number") return String(c);
    }
    return String(val);
  }

  function esc(s) {
    return String(s ?? "").replace(/[&<>"']/g, (m) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[m]));
  }

  // ----- OPTIONAL: apply data-en/data-ko in HTML (if you used it anywhere) -----
  function applyHtmlLang() {
    const L = getLang();
    document.documentElement.lang = L;

    document.querySelectorAll("[data-en]").forEach((el) => {
      const txt = (L === "ko")
        ? (el.getAttribute("data-ko") || el.getAttribute("data-en"))
        : el.getAttribute("data-en");
      if (txt != null) el.textContent = txt;
    });
  }

  // ----- mount points -----
  const heroEyebrow = $("heroEyebrow");
  const heroTitle = $("heroTitle");
  const heroLead = $("heroLead");
  const heroImage = $("heroImage");
  const heroCaptionBold = $("heroCaptionBold");
  const heroCaption = $("heroCaption");
  const heroMetrics = $("heroMetrics");

  const memberSearch = $("memberSearch");
  const memberDivision = $("memberDivision");
  const memberGrid = $("memberGrid");

  const timeline = $("timeline");

  // If core mounts are missing, exit safely
  if (!heroTitle || !heroLead || !heroMetrics || !memberGrid || !timeline) {
    // still try to wire button label if exists
    syncLangToggleLabel();
    return;
  }

  // ----- load data -----
  let data;
  try {
    const res = await fetch(asset("team/team.json"), { cache: "no-store" });
    data = await res.json();
  } catch (e) {
    heroLead.textContent = "Failed to load team data.";
    return;
  }

  // ----- render functions -----
  function renderHero() {
    const hero = data.hero || {};

    if (heroEyebrow) heroEyebrow.textContent = pick(hero.eyebrow);
    if (heroTitle) heroTitle.textContent = pick(hero.title);
    if (heroLead) heroLead.textContent = pick(hero.lead);

    if (heroImage && hero.image) {
      heroImage.src = asset(hero.image).replace(/\/team\/team\//, "/team/"); 
      // ^ in case asset() already includes base; safe no-op if not needed
      heroImage.src = hero.image.startsWith("http") ? hero.image : asset(hero.image);
      heroImage.alt = pick(hero.title) || "Auto_Lab";
    }

    if (heroCaptionBold) heroCaptionBold.textContent = pick(hero.caption_bold);
    if (heroCaption) heroCaption.textContent = pick(hero.caption);
  }

  function renderMetrics() {
    const metrics = Array.isArray(data.metrics) ? data.metrics : [];

    heroMetrics.innerHTML = metrics.map((m) => {
      const label = pick(m.label);
      const value = pick(m.value);
      return `
        <div class="metric">
          <div class="metric__label">${esc(label)}</div>
          <div class="metric__value">${esc(value)}</div>
        </div>
      `;
    }).join("");
  }

  function currentMemberFilters() {
    const q = (memberSearch?.value || "").trim().toLowerCase();
    const div = (memberDivision?.value || "ALL").trim();
    return { q, div };
  }

  function matchesMember(m, q, div) {
    const name = String(m.name || "").toLowerCase();
    const role = String(pick(m.role) || "").toLowerCase();
    const division = String(pick(m.division) || "").toLowerCase();

    if (div !== "ALL" && String(m.division || "") !== div) return false;
    if (!q) return true;
    const hay = `${name} ${role} ${division}`;
    return hay.includes(q);
  }

  function renderMemberDivisionOptions() {
    if (!memberDivision) return;
    const members = Array.isArray(data.members) ? data.members : [];

    // Collect unique divisions from raw value (keep stable)
    const set = new Set(members.map(m => String(m.division || "")).filter(Boolean));
    const divisions = Array.from(set);

    // Keep existing first option if already present; else build minimal
    const hasAll = Array.from(memberDivision.options || []).some(o => o.value === "ALL");
    if (!hasAll) {
      memberDivision.innerHTML = `<option value="ALL">All</option>` + divisions.map(d => `<option value="${esc(d)}">${esc(d)}</option>`).join("");
    } else {
      // ensure divisions are present
      const existing = new Set(Array.from(memberDivision.options).map(o => o.value));
      divisions.forEach(d => {
        if (!existing.has(d)) {
          const opt = document.createElement("option");
          opt.value = d;
          opt.textContent = d;
          memberDivision.appendChild(opt);
        }
      });
    }
  }

  function renderMembers() {
    const members = Array.isArray(data.members) ? data.members : [];
    const { q, div } = currentMemberFilters();

    const items = members.filter(m => matchesMember(m, q, div));

    memberGrid.innerHTML = items.map((m) => {
      const img = m.image ? (m.image.startsWith("http") ? m.image : asset(m.image)) : "";
      const name = m.name || "";
      // members section: keep as-is; if you later make role/division {ko,en}, pick() will support it
      const role = pick(m.role);
      const divisionText = pick(m.division);

      return `
        <article class="member-card">
          <div class="member-photo">
            ${img ? `<img src="${esc(img)}" alt="${esc(name)}">` : ``}
          </div>
          <div class="member-meta">
            <h3>${esc(name)}</h3>
            <p class="member-role">${esc(role)}</p>
            <span class="member-division">${esc(divisionText)}</span>
          </div>
        </article>
      `;
    }).join("");
  }

  function renderAchievements() {
    const ach = Array.isArray(data.achievements) ? data.achievements : [];

    timeline.innerHTML = ach.map((a) => {
      const date = String(a.date || "");
      const title = pick(a.title);
      const desc = pick(a.desc);

      return `
        <div class="timeline-item">
          <div class="timeline-date">${esc(date)}</div>
          <div class="timeline-content">
            <h3>${esc(title)}</h3>
            <p>${esc(desc)}</p>
          </div>
        </div>
      `;
    }).join("");
  }

  function renderAll() {
    applyHtmlLang();
    syncLangToggleLabel();

    renderHero();
    renderMetrics();

    renderMemberDivisionOptions();
    renderMembers();

    renderAchievements();
  }

  // ----- wire events -----
  const langBtn = $("langToggleBtn");
  if (langBtn) {
    langBtn.addEventListener("click", () => {
      const L = getLang();
      const next = (L === "en") ? "ko" : "en";
      setLang(next);
      renderAll();
    });
  }

  memberSearch?.addEventListener("input", renderMembers);
  memberDivision?.addEventListener("change", renderMembers);

  // react to global language changes (e.g., user toggles in navbar)
  onLangChange(() => {
    renderAll();
  });

  // initial render
  renderAll();
})();
