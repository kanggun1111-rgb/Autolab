/* sponsors/sponsors.js
   - sponsors.json 기반 렌더링 (KO/EN)
   - Title/Gold/Silver/Support: grid
   - Logos never crop: object-fit:contain is handled in CSS
*/
(async function(){
  const T = (k, f='') => (window.__t ? window.__t(k, f) : f);

  const mount = document.getElementById('tiersMount');
  if (!mount) return;

  const lang = () => (window.__getLang ? window.__getLang() : 'ko');
  const esc = (s)=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));

  let data;
  try{
    const res = await fetch('sponsors/sponsors.json', { cache:'no-store' });
    data = await res.json();
  }catch(e){
    mount.innerHTML = '<p style="opacity:.8">데이터를 불러오지 못했습니다.</p>';
    return;
  }

  function setHero(){
    const L = lang();
    const hero = (data.hero && data.hero[L]) || (data.hero && data.hero.ko) || {};

    const setText = (id, v) => { const el=document.getElementById(id); if(el) el.textContent = v || ''; };
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
    const link = href ? `<a class="logo-link" href="${esc(href)}" target="_blank" rel="noopener">Visit →</a>` : `<span style="opacity:.65;font-weight:800;">&nbsp;</span>`;
    const name = item.name || '';
    return `
      <article class="logo-card ${featured ? 'featured' : ''}">
        <div class="logo-card__inner">
          <div class="logo-title">
            <b>${esc(name)}</b>
            <span>${featured ? 'TITLE' : ''}</span>
          </div>
          <div class="logo-media">
            <img src="${esc(item.logo || '')}" alt="${esc(name)}">
          </div>
          ${link}
        </div>
      </article>
    `;
  }

  function renderTier(t){
    const tierName = t.tier || '';
    const L = lang();
    const noteObj = t.note || '';
    const note = (typeof noteObj === 'object' && noteObj) ? (noteObj[L] || noteObj.ko || '') : (noteObj || '');
    const layout = t.layout || 'grid';
    const items = Array.isArray(t.items) ? t.items : [];

    const isFeatured = layout === 'featured';
    const gridClass = isFeatured ? 'logo-grid featured' : 'logo-grid';
    const cards = items.map(i => card(i, isFeatured)).join('') || `<p style="opacity:.75">${T('sponsors.empty','No sponsors yet.')}</p>`;

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
    setHero();
    const tiers = Array.isArray(data.tiers) ? data.tiers : [];
    mount.innerHTML = tiers.map(renderTier).join('');
  }

  renderAll();
  if (window.__onLangChange) window.__onLangChange(renderAll);
})();
