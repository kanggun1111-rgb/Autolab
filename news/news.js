/* news/news.js
   - news.json을 읽어서 목록 렌더링
   - 검색/카테고리 필터
   - 간단 페이징 (페이지당 6개)
   - ko/en 전환 즉시 반영 (기존 레이아웃/기능 유지)
*/
(async function(){
  const listEl = document.getElementById('newsList');
  const pagerEl = document.getElementById('newsPager');
  const searchEl = document.getElementById('newsSearch');
  const catEl = document.getElementById('newsCategory');

  if (!listEl) return;

  const PAGE_SIZE = 6;
  let page = 1;
  let posts = [];

  // ---------- utils ----------
  function normalize(s){ return String(s || '').toLowerCase(); }
  function escapeHtml(s){
    return String(s ?? '').replace(/[&<>"']/g, m => ({
      '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;', "'":'&#39;'
    }[m]));
  }
  function formatDate(iso){
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString('en-US', { year:'numeric', month:'short', day:'2-digit' });
  }

  // ---------- locale helpers (backward compatible) ----------
  function getLang(){
    const v = (localStorage.getItem('lang') || 'ko').toLowerCase();
    return v === 'en' ? 'en' : 'ko';
  }
  function asText(v){
    if (Array.isArray(v)) return v.filter(Boolean).join(' ');
    return String(v ?? '');
  }
  function asLines(v){
    if (Array.isArray(v)) return v.filter(x => x !== null && x !== undefined).map(String);
    if (typeof v === 'string' && v.trim()) return [v];
    return [];
  }
  function coverUrl(p){
    const c = p?.cover;
    if (Array.isArray(c)) return c[0] || '';
    return c || '';
  }

  // baseKey_ko/en → {ko,en} → baseKey 순으로 안전하게 가져오기
  function pickText(p, baseKey, fallback=''){
    const lang = getLang();

    const v1 = p?.[`${baseKey}_${lang}`];
    if (v1 !== undefined && v1 !== null && v1 !== '') return v1;

    const obj = p?.[baseKey];
    if (obj && typeof obj === 'object' && (obj.ko !== undefined || obj.en !== undefined)){
      const v2 = obj[lang];
      if (v2 !== undefined && v2 !== null && v2 !== '') return v2;
      return obj.ko ?? obj.en ?? fallback;
    }

    const v3 = p?.[baseKey];
    if (v3 !== undefined && v3 !== null && v3 !== '') return v3;

    return fallback;
  }

  // ---------- load ----------
  try{
    const res = await fetch('/news/news.json', { cache: 'no-store' });
    posts = await res.json();
  }catch(err){
    listEl.innerHTML = '<p style="opacity:.8;text-align:center">뉴스 데이터를 불러오지 못했습니다.</p>';
    return;
  }

  // 최신순
  posts.sort((a,b) => new Date(b.date) - new Date(a.date));

  // ---------- category options ----------
  if (catEl){
    catEl.innerHTML = ''; // 안전: 중복 방지
    const allOpt = document.createElement('option');
    allOpt.value = 'ALL';
    allOpt.textContent = 'ALL';
    catEl.appendChild(allOpt);

    const cats = Array.from(new Set(posts.map(p => p.category).filter(Boolean)));
    cats.forEach(c => {
      const opt = document.createElement('option');
      opt.value = c;
      opt.textContent = c;
      catEl.appendChild(opt);
    });

    catEl.value = 'ALL';
  }

  // ---------- filter + render ----------
  function getFiltered(){
    const q = normalize(searchEl?.value).trim();
    const cat = catEl?.value || 'ALL';

    return posts.filter(p => {
      const okCat = (cat === 'ALL') || (p.category === cat);
      if (!okCat) return false;
      if (!q) return true;

      const title = asText(pickText(p, 'title', p.title || ''));
      const excerpt = asText(pickText(p, 'excerpt', p.excerpt || ''));
      const content = asLines(pickText(p, 'content', p.content || [])).join(' ');

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
      const title = asText(pickText(p, 'title', p.title || ''));
      const excerpt = asText(pickText(p, 'excerpt', p.excerpt || ''));
      const cover = coverUrl(p);

      return `
      <div class="news-card">
        <div class="news-image">
          <img src="${escapeHtml(cover)}" alt="${escapeHtml(title)}">
        </div>
        <div class="news-content">
          <h3>${escapeHtml(title)}</h3>
          <p class="news-date">${escapeHtml(formatDate(p.date))}</p>
          <p class="news-excerpt">${escapeHtml(excerpt || '')}</p>
          <a href="/news/post.html?id=${encodeURIComponent(p.id)}" class="news-link">Read More →</a>
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

  // ---------- events ----------
  if (searchEl) searchEl.addEventListener('input', () => { page = 1; render(); });
  if (catEl) catEl.addEventListener('change', () => { page = 1; render(); });

  // ---------- lang toggle integration ----------
  // 1) main/script.js가 토글을 처리하면: localStorage.lang이 바뀐 뒤 render()만 다시
  // 2) main/script.js가 실패하면: 여기서 토글을 직접 하고 render()
  
  (function bindLang(){
  const btn = document.getElementById('langToggleBtn');
  if (!btn || btn.dataset.newsLangBound) return;
  btn.dataset.newsLangBound = '1';

  btn.addEventListener('click', () => {
    const before = (localStorage.getItem('lang') || 'ko').toLowerCase();

    // main/script.js가 먼저 토글/라벨 갱신을 끝내도록 한 틱 늦춰서 확인
    setTimeout(() => {
      const after = (localStorage.getItem('lang') || 'ko').toLowerCase();

      // main/script.js가 성공적으로 바꿨으면: 렌더만
      if (after !== before){
        page = 1;
        render();
        return;
      }

      // main/script.js가 못 바꿨으면: 여기서 보조로 토글하고 렌더
      const next = (before === 'en') ? 'ko' : 'en';
      localStorage.setItem('lang', next);
      page = 1;
      render();
    }, 0);
  });
})();


  // initial render
  render();
})();

