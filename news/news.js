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

  // --- lang toggle fallback (do not change UI) ---
  const langToggleBtn = document.getElementById('langToggleBtn');
  if (langToggleBtn && !langToggleBtn.dataset.langBound){
    langToggleBtn.dataset.langBound = '1';
    langToggleBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopImmediatePropagation();
      const cur = (localStorage.getItem('lang') || 'ko').toLowerCase();
      localStorage.setItem('lang', cur === 'en' ? 'ko' : 'en');
      location.reload();
    }, true);
  }

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

  // 카테고리 채우기 (catEl이 없으면 스킵)
  if (catEl){
    const cats = Array.from(new Set(posts.map(p => p.category).filter(Boolean)));
    cats.forEach(c => {
      const opt = document.createElement('option');
      opt.value = c;
      opt.textContent = c;
      catEl.appendChild(opt);
    });
  }

  function normalize(s){ return String(s || '').toLowerCase(); }
  function escapeHtml(s){
    return String(s ?? '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;', "'":'&#39;'}[m]));
  }
  function formatDate(iso){
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString('en-US', { year:'numeric', month:'short', day:'2-digit' });
  }

  // ---- locale/data helpers (backward compatible) ----
  function getLang(){
    return (localStorage.getItem('lang') || 'ko').toLowerCase() === 'en' ? 'en' : 'ko';
  }
  function pickText(p, baseKey, fallback=''){
    const lang = getLang();
    const v1 = p?.[`${baseKey}_${lang}`];
    if (v1 !== undefined && v1 !== null) return v1;

    const obj = p?.[baseKey];
    if (obj && typeof obj === 'object' && (obj.ko !== undefined || obj.en !== undefined)){
      return obj[lang] ?? obj.ko ?? obj.en ?? fallback;
    }

    const v3 = p?.[baseKey];
    return (v3 !== undefined && v3 !== null) ? v3 : fallback;
  }
  function toOneLine(v){
    if (Array.isArray(v)) return v.filter(Boolean).join(' ');
    return String(v ?? '');
  }
  function toLines(v){
    if (Array.isArray(v)) return v;
    if (typeof v === 'string' && v.trim()) return [v];
    return [];
  }
  function coverUrl(p){
    const c = p?.cover;
    if (Array.isArray(c)) return c[0] || '';
    return c || '';
  }
  // --------------------------------------------------

  function getFiltered(){
    const q = normalize(searchEl?.value).trim();
    const cat = catEl?.value || 'ALL';

    return posts.filter(p => {
      const okCat = (cat === 'ALL') || (p.category === cat);
      if (!okCat) return false;
      if (!q) return true;

      const title = toOneLine(pickText(p, 'title', p.title || ''));
      const excerpt = toOneLine(pickText(p, 'excerpt', p.excerpt || ''));
      const content = toLines(pickText(p, 'content', p.content || [])).join(' ');

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

    listEl.innerHTML = slice.map(p => {
      const title = toOneLine(pickText(p, 'title', p.title || ''));
      const excerpt = toOneLine(pickText(p, 'excerpt', p.excerpt || ''));
      const cover = coverUrl(p);

      return `
      <div class="news-card">
        <div class="news-image">
          <img src="${escapeHtml(cover)}" alt="${escapeHtml(title)}">
        </div>
        <div class="news-content">
          <h3>${escapeHtml(title)}</h3>
          <p class="news-date">${escapeHtml(formatDate(p.date))}</p>
          <p class="news-excerpt">${escapeHtml(excerpt)}</p>
          <a href="news/post.html?id=${encodeURIComponent(p.id)}" class="news-link">Read More →</a>
        </div>
      </div>
      `;
    }).join('');

    // pager
    if (!pagerEl) return;
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
  if (searchEl) searchEl.addEventListener('input', () => { page = 1; render(); });
  if (catEl) catEl.addEventListener('change', () => { page = 1; render(); });

  render();
})();
