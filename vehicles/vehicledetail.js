/* vehicles/vehicledetail.js (v3)
   - One shared page: vehicles/detail.html?id=ale-26
   - Finds the matching item in vehicles.json (featured only)
*/
(async function(){
  // ===== Safe i18n (page-scoped) =====
  const asset = (p) => {
    const baseEl = document.querySelector('base');
    const base = baseEl ? baseEl.getAttribute('href') : '/';
    const normBase = (base || '/').replace(/\/+$/,'');
    const normP = String(p || '').replace(/^\/+/,'');
    return `${normBase}/${normP}`;
  };

  const getLang = () => {
    const g = (window.__getLang ? window.__getLang() : (localStorage.getItem('lang') || 'en'));
    return (g === 'ko' || g === 'en') ? g : 'en';
  };

  let PAGE_I18N = null;
  const loadPageI18n = async () => {
    if (PAGE_I18N) return PAGE_I18N;
    try{
      const res = await fetch(asset('vehicles/i18n.json'), { cache: 'no-store' });
      PAGE_I18N = await res.json();
    }catch(e){
      PAGE_I18N = { ko: {}, en: {} };
    }
    return PAGE_I18N;
  };

  const tPage = (key, fallback='') => {
    const lang = getLang();
    const dict = (PAGE_I18N && PAGE_I18N[lang]) ? PAGE_I18N[lang] : null;
    const v = dict ? dict[key] : undefined;
    if (v !== undefined && v !== null && String(v).trim() !== '') return String(v);
    if (window.__t) return window.__t(key, fallback);
    return fallback;
  };

  const applyI18n = () => {
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      const val = tPage(key, el.textContent || '');
      if (val) el.textContent = val;
    });
    document.querySelectorAll('[data-i18n-html]').forEach(el => {
      const key = el.getAttribute('data-i18n-html');
      const val = tPage(key, el.innerHTML || '');
      if (val) el.innerHTML = val;
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const key = el.getAttribute('data-i18n-placeholder');
      const val = tPage(key, el.getAttribute('placeholder') || '');
      if (val) el.setAttribute('placeholder', val);
    });
  };

  const pick = (val) => {
    const lang = getLang();
    if (val && typeof val === 'object' && !Array.isArray(val)) {
      if (val[lang] != null) return val[lang];
      if (val.en != null) return val.en;
      if (val.ko != null) return val.ko;
    }
    return val;
  };

  const T = (k, f='') => tPage(k, f);
  const mount = document.getElementById('detailMount');
  if (!mount) return;

  await loadPageI18n();
  applyI18n();

  const params = new URLSearchParams(location.search);
  const id = params.get('id');

  if (!id){
    mount.innerHTML = `<p style="opacity:.85">${T('vehicles.detail.err.no_id','Invalid access. (missing id)')}</p><p style="opacity:.7">${T('vehicles.detail.err.enter_from','Please enter from the Vehicles page.')}</p>`;
    return;
  }

  let data;
  try{
    const res = await fetch(asset('vehicles/vehicles.json'), { cache:'no-store' });
    data = await res.json();
  }catch(e){
    mount.innerHTML = `<p style="opacity:.85">${T('vehicles.err.load','Failed to load data.')}</p>`;
    return;
  }

  const featured = data.featured || [];
  const v = featured.find(x => String(x.id).toLowerCase() === String(id).toLowerCase());

  if (!v){
    mount.innerHTML = `<p style="opacity:.85">${T('vehicles.detail.err.not_found','Vehicle not found.')}</p><p style="opacity:.7">${T('vehicles.detail.err.check_featured','Check the featured list in vehicles.json.')}</p>`;
    return;
  }

  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;', "'":'&#39;'}[m]));
  const stats = v.stats || {};
  const highlights = (v.highlights || []).filter(Boolean).map(x => `<li>${esc(pick(x))}</li>`).join('');
  const sections = (v.sections || []).map(sec => `
    <div class="section-block">
      <h3>${esc(pick(sec.title))}</h3>
      ${(sec.body || []).map(p => `<p>${esc(pick(p))}</p>`).join('')}
    </div>
  `).join('');

  const gallery = (v.gallery || []).filter(Boolean).map(src => `
    <div class="shot"><img src="${esc(src)}" alt="${esc(v.name)}"></div>
  `).join('');

  document.title = `${v.name} | Vehicles | Auto_Lab`;

  mount.innerHTML = `
    <section class="detail-hero">
      <div class="detail-cover">
        <img src="${esc(v.cover)}" alt="${esc(v.name)}">
      </div>

      <div class="detail-panel">
        <span class="detail-chip">${esc(v.type)} • ${esc(v.season)}</span>
        <h1>${esc(v.name)}</h1>
        <p>${esc(pick(v.tagline || ''))}</p>

        <div class="detail-actions">
          <a class="primary" href="vehicles/vehicles.html">${T('vehicles.detail.nav.back','← Back to Vehicles')}</a>
          <a href="#specs">${T('vehicles.detail.nav.specs','Specs')}</a>
          <a href="#gallery">${T('vehicles.detail.nav.gallery','Gallery')}</a>
        </div>

        <div class="detail-grid" id="specs">
          <div class="card kv">
            <h2>KEY SPECS</h2>
            <dl>
              ${Object.entries(stats).map(([k,val]) => `
                <dt>${esc(k)}</dt><dd>${esc(val)}</dd>
              `).join('')}
            </dl>
          </div>

          <div class="card bullets">
            <h2>HIGHLIGHTS</h2>
            <ul>${highlights || `<li style="opacity:.75">${T('vehicles.detail.empty.highlights','Add highlights in vehicles.json.')}</li>`}</ul>
          </div>
        </div>
      </div>
    </section>

    <section class="sections">
      ${sections || `<div class="section-block"><h3>Concept</h3><p style="opacity:.8">${T('vehicles.detail.empty.sections','Add section content in vehicles.json.')}</p></div>`}
    </section>

    <section id="gallery">
      <div class="card" style="margin-top:18px;">
        <h2>GALLERY</h2>
        <div class="gallery">${gallery || `<p style="opacity:.8">${T('vehicles.detail.empty.gallery','Add images to show them here.')}</p>`}</div>
      </div>
    </section>
  `;
})();