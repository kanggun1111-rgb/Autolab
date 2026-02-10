/* /sponsors/sponsors.js
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
  const heroAll = data.hero || {};
  const hero = (heroAll[L]) || heroAll.en || {};

  const setText = (id, v) => {
    const el = document.getElementById(id);
    if (el) el.textContent = v || '';
  };

  setText('heroEyebrow', hero.eyebrow);
  setText('heroTitle', hero.title);
  setText('heroSubtitle', hero.subtitle);

  const c1 = document.getElementById('heroCtaPrimary');
  const c2 = document.getElementById('heroCtaSecondary');

  / ✅ KO/EN PDF 링크를 "둘 다" 확보
  const pdfKo = (heroAll.ko && heroAll.ko.cta_primary && heroAll.ko.cta_primary.href) ? heroAll.ko.cta_primary.href : '';
  const pdfEn = (heroAll.en && heroAll.en.cta_primary && heroAll.en.cta_primary.href) ? heroAll.en.cta_primary.href : '';

  / ===== Primary CTA (PDF) =====
  if (c1 && hero.cta_primary){
    c1.textContent = hero.cta_primary.label || '';

    / KO/EN 둘 다 있으면: 클릭 시 선택 모달
    if (pdfKo && pdfEn){
      c1.href = "#";                 / 기본 링크 제거
      c1.removeAttribute('target');  / 우리가 window.open으로 처리
      c1.rel = "noopener";

      / 중복 바인딩 방지
      if (!c1.dataset.boundPdfPicker){
        c1.dataset.boundPdfPicker = "1";

        const dlg = document.getElementById('pdfLangDialog');
        const koBtn = document.getElementById('pdfKoBtn');
        const enBtn = document.getElementById('pdfEnBtn');

        const openPdf = (href) => {
          if (!href) return;
          window.open(href, '_blank', 'noopener');
          if (dlg && dlg.open) dlg.close();
        };

        const openDialog = () => {
          / dialog 지원 브라우저
          if (dlg && typeof dlg.showModal === 'function') {
            dlg.showModal();
          } else {
            / fallback (구형): confirm으로 대체
            const pickKo = confirm('한국어 PDF를 다운로드할까요?\n(확인=한국어 / 취소=English)');
            openPdf(pickKo ? pdfKo : pdfEn);
          }
        };

        c1.addEventListener('click', (e) => {
          e.preventDefault();
          openDialog();
        });

        if (koBtn) koBtn.addEventListener('click', () => openPdf(pdfKo));
        if (enBtn) enBtn.addEventListener('click', () => openPdf(pdfEn));
      }
    } else {
      / KO/EN 둘 중 하나만 있으면: 기존처럼 바로 열기
      c1.href = hero.cta_primary.href || '#';
      c1.target = "_blank";
      c1.rel = "noopener";
    }
  }

  / ===== Secondary CTA =====
  if (c2 && hero.cta_secondary){
    c2.textContent = hero.cta_secondary.label || '';
    c2.href = hero.cta_secondary.href || '#';
  }
}


function card(item, featured=false){ 
  const href = (item.url || '').trim();
  const clickable = href ? 'is-clickable' : '';

  / url이 있으면 <a>, 없으면 <article>
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
    applyHtmlLang();   / 🔑 HTML 언어 적용
    setHero();         / JSON hero
    const tiers = Array.isArray(data.tiers) ? data.tiers : [];
    mount.innerHTML = tiers.map(renderTier).join('');
  }

  /* --------------------
     Init & lang change
  -------------------- */
  renderAll();
  if (window.__onLangChange) window.__onLangChange(renderAll);
})();
