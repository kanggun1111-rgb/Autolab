/* news/news.js
   - news.json을 읽어서 목록 렌더링
   - 검색/카테고리 필터
   - 간단 페이징 (페이지당 9개)
*/
(async function(){
  const T = (k, f='') => (window.__t ? window.__t(k, f) : f);
  const listEl = document.getElementById('newsList');
  const pagerEl = document.getElementById('newsPager');
  const searchEl = document.getElementById('newsSearch');
  const catEl = document.getElementById('newsCategory');

  if (!listEl) return;

  const PAGE_SIZE = 9;
  let page = 1;
  let posts = [];

  try{
    const res = await fetch('news/news.json', { cache: 'no-store' });
    posts = await res.json();
  }catch(err){
    listEl.innerHTML = '<p style="opacity:.8;text-align:center">뉴스 데이터를 불러오지 못했습니다.</p>';
    return;
  }

  // 최신순
  posts.sort((a,b) => new Date(b.date) - new Date(a.date));

  // 카테고리 채우기
  const cats = Array.from(new Set(posts.map(p => p.category).filter(Boolean)));
  cats.forEach(c => {
    const opt = document.createElement('option');
    opt.value = c;
    opt.textContent = c;
    catEl.appendChild(opt);
  });

  function normalize(s){ return String(s || '').toLowerCase(); }
  function escapeHtml(s){
    return String(s ?? '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;', "'":'&#39;'}[m]));
  }
  function formatDate(iso){
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString('en-US', { year:'numeric', month:'short', day:'2-digit' });
  }



// ===== locale helpers (keeps existing layout / functions) =====
function getLang(){
  const v = (localStorage.getItem('lang') || 'ko').toLowerCase();
  return (v === 'en') ? 'en' : 'ko';
}
function asText(v){
  if (Array.isArray(v)) return v.filter(Boolean).join(' ');
  return String(v ?? '');
}
function pick(p, key){
  const lang = getLang();
  const v = p && p[`${key}_${lang}`];
  if (v !== undefined && v !== null && v !== '') return v;
  return p ? p[key] : '';
}
// Safe fallback: if main/script.js failed to bind lang toggle on this page,
// we bind it here WITHOUT interfering when it already works.
(function bindLangToggleFallback(){
  const btn = document.getElementById('langToggleBtn');
  if (!btn || btn.dataset.langFallbackBound) return;
  btn.dataset.langFallbackBound = '1';

  // Capture: remember lang BEFORE any other click handlers run.
  btn.addEventListener('click', () => {
    btn.dataset.langBefore = (localStorage.getItem('lang') || 'ko');
  }, true);

  // Bubble: only toggle if nothing changed.
  btn.addEventListener('click', () => {
    const before = (btn.dataset.langBefore || (localStorage.getItem('lang') || 'ko')).toLowerCase();
    const after = (localStorage.getItem('lang') || 'ko').toLowerCase();
    if (after !== before) return; // already handled elsewhere
    localStorage.setItem('lang', before === 'en' ? 'ko' : 'en');
    location.reload();
  });
})();
// ==============================================================

  function getFiltered(){
    const q = normalize(searchEl.value).trim();
    const cat = catEl.value;

    return posts.filter(p => {
      const okCat = (cat === 'ALL') || (p.category === cat);
      if (!okCat) return false;
      if (!q) return true;
      const title = asText(pick(p,'title'));
      const excerpt = asText(pick(p,'excerpt'));
      const content = asText(pick(p,'content'));
      const hay = normalize(title) + ' ' + normalize(excerpt) + ' ' + normalize(content);
      return hay.includes(q);
    });
  }

  function render(){
    const filtered = getFiltered();
    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    page = Math.min(page, totalPages);

    const start = (page - 1) * PAGE_SIZE;
    const slice = filtered.slice(start, start + PAGE_SIZE);

    listEl.innerHTML = slice.map(p => `
      <div class="news-card">
        <div class="news-image">
          <img src="${escapeHtml(p.cover)}" alt="${escapeHtml(asText(pick(p,'title')))}">
        </div>
        <div class="news-content">
          <h3>${escapeHtml(asText(pick(p,'title')))}</h3>
          <p class="news-date">${escapeHtml(formatDate(p.date))}</p>
          <p class="news-excerpt">${escapeHtml(asText(pick(p,'excerpt')) || '')}</p>
          <a href="news/post.html?id=${encodeURIComponent(p.id)}" class="news-link">Read More →</a>
        </div>
      </div>
    `).join('');

    // pager
    pagerEl.innerHTML = '';
    const prev = document.createElement('button');
    prev.textContent = 'Prev';
    prev.disabled = page <= 1;
    prev.addEventListener('click', () => { page--; render(); window.scrollTo({top:0, behavior:'smooth'}); });

    const next = document.createElement('button');
    next.textContent = 'Next';
    next.disabled = page >= totalPages;
    next.addEventListener('click', () => { page++; render(); window.scrollTo({top:0, behavior:'smooth'}); });

    const info = document.createElement('button');
    info.textContent = `${page} / ${totalPages}`;
    info.disabled = true;

    pagerEl.appendChild(prev);
    pagerEl.appendChild(info);
    pagerEl.appendChild(next);
  }

  // events
  searchEl.addEventListener('input', () => { page = 1; render(); });
  catEl.addEventListener('change', () => { page = 1; render(); });

  render();
})();