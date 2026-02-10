/* /main/home.js
   - Renders index.html hero + why-season section from /main/home.json
   - Uses window.__getLang() + window.__onLangChange() from /main/script.js
*/
(async function(){
  if (!document.body.classList.contains('page-home')) return;

  let data;
  try{
    const res = await fetch('main/home.json', { cache: 'no-store' });
    data = await res.json();
  }catch(e){
    console.warn('home.json load failed', e);
    return;
  }

  const $ = (id) => document.getElementById(id);
  const lang = () => (window.__getLang ? window.__getLang() : 'ko');

  function render(){
    const L = lang();
    const hero = (data.hero && data.hero[L]) || {};
    const why  = (data.why  && data.why[L])  || {};

    const he = $('homeHeroEyebrow');
    const ht = $('homeHeroTitle');
    const hs = $('homeHeroSubtitle');

    if (he) he.textContent = hero.eyebrow || '';
    if (ht) ht.textContent = hero.title || '';
    if (hs) hs.textContent = hero.subtitle || '';

    const wl = $('whyLead');
    const wd = $('whyDesc');
    if (wl) wl.textContent = why.lead || '';
    if (wd) wd.textContent = why.desc || '';

    const points = Array.isArray(why.points) ? why.points : [];
    const mount = $('whyPoints');
    if (mount){
      mount.innerHTML = points.map((p, idx) => `
        <li>
          <strong data-i18n="home.why.point${idx+1}.title">${p.title || ''}</strong>
          <span>${p.desc || ''}</span>
        </li>
      `).join('');
    }

    / Re-apply i18n (nav + fixed labels)
    if (window.__applyI18n) window.__applyI18n();
  }

  render();
  if (window.__onLangChange) window.__onLangChange(render);
})();
