/* sponsors/sponsors.js
   - sponsors.json 기반 렌더링 (KO/EN)
   - HTML data-en / data-ko 동시 지원
   - Title/Gold/Silver/Support: grid
*/
(async function(){
  /* --------------------
     Language helpers
  -------------------- */
  const getLang = () => (window.__getLang ? window.__getLang() : (localStorage.getItem('lang') || 'en'));
  const esc = (s)=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));

  /* --------------------
     HTML (data-en / data-ko)
  -------------------- */
  function applyHtmlLang(){
    const L = getLang();
    document.documentElement.lang = L;

    document.querySelectorAll('[data-en]').forEach(el=>{
      const text =
        L === 'ko'
          ? el.getAttribute('data-ko') || el.getAttribute('data-en')
          : el.getAttribute('data-en');

      if (text != null) el.textContent = text;
    });
  }

  /* --------------------
     JSON-based sponsors
  -------------------- */
  const mount = document.getElementById('tiersMount');
  if (!mount) return;

  let data;
  try{
    const res = await fetch('sponsors/sponsors.json', { cache:'no-store' });
    data = await res.json();
  }catch(e){
    mount.innerHTML = '<p style="opacity:.8">Failed to load sponsors data.</p>';
    return;
  }

  function setHero(){
    const L = getLang();
    const hero = (data.hero && data.hero[L]) || (data.hero && data.hero.en) || {};

    const setText = (id, v) => {
      const el = document.getElementById(id);
      if (el) el.textContent = v || '';
    };

    setText('heroEyebrow', hero.eyebrow);
    setText('heroTitle', hero.title);
    setText('heroSubtitle', hero.subtitle);

    const c1 = document.getElementById('heroCtaPrimary');
    const c2 = document.getElementById('heroCtaSecondary');

    if (c1 && hero.cta_primary){
      c1.textContent = hero.cta_primary.label || '';
      c1.href = hero.cta_primary.href || '#';
    }
    if (c2 && hero.cta_secondary){
      c2.textContent = hero.cta_secondary.label || '';
      c2.href = hero.cta_secondary.href || '#';
    }
  }

function card(item, featured=false){ 
  const href = (item.url || '').trim();
  const clickable = href ? 'is-clickable' : '';

  // url이 있으면 <a>, 없으면 <article>
  const tagOpen  = href
    ? `<a class="logo-card ${clickable} ${featured ? 'featured' : ''}" href="${esc(href)}" target="_blank" rel="noopener">`
    : `<article class="logo-card ${featured ? 'featured' : ''}">`;

  const tagClose = href ? `</a>` : `</article>`;

  return `
    ${tagOpen}
      <div class="logo-card__inner">
        <div class="logo-media">
          <img src="${esc(item.logo || '')}" alt="Sponsor logo">
        </div>
      </div>
    ${tagClose}
  `;
}



  function renderTier(t){
    const tierName = t.tier || '';
    const L = getLang();

    const noteObj = t.note || '';
    const note =
      (typeof noteObj === 'object')
        ? (noteObj[L] || noteObj.en || '')
        : noteObj;

    const layout = t.layout || 'grid';
    const items = Array.isArray(t.items) ? t.items : [];

    const isFeatured = layout === 'featured';
    const gridClass = isFeatured ? 'logo-grid featured' : 'logo-grid';

    const cards = items.map(i => card(i, isFeatured)).join('')
      || `<p style="opacity:.75">No sponsors yet.</p>`;

    return `
      <section class="tier-block" data-tier="${esc(tierName)}">
        <div class="tier-head">
          <div>
            <h2>${esc(tierName)} Partner</h2>
            <p>${esc(note)}</p>
          </div>
          <span class="tier-badge">${esc(String(tierName).toUpperCase())}</span>
        </div>

        <div class="${gridClass}">
          ${cards}
        </div>
      </section>
    `;
  }

  function renderAll(){
    applyHtmlLang();   // 🔑 HTML 언어 적용
    setHero();         // JSON hero
    const tiers = Array.isArray(data.tiers) ? data.tiers : [];
    mount.innerHTML = tiers.map(renderTier).join('');
  }

  /* --------------------
     Init & lang change
  -------------------- */
  renderAll();
  if (window.__onLangChange) window.__onLangChange(renderAll);
})();
