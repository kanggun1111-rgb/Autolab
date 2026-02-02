/* news/post.js
   - ?id= 로 게시글 렌더링
   - source_url이 있으면 '원문 보기' 버튼 표시(인스타 등)
*/
(async function(){
  const T = (k, f='') => (window.__t ? window.__t(k, f) : f);
  const mount = document.getElementById('postMount');
  if (!mount) return;

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

  const id = new URLSearchParams(location.search).get('id');
  if (!id){
    mount.innerHTML = '<p style="opacity:.85">잘못된 접근입니다. <a href="news/index.html">목록으로</a></p>';
    return;
  }

  let posts = [];
  try{
    const res = await fetch('news/news.json', { cache: 'no-store' });
    posts = await res.json();
  }catch(err){
    mount.innerHTML = '<p style="opacity:.85">게시글 데이터를 불러오지 못했습니다. <a href="news/index.html">목록으로</a></p>';
    return;
  }

  const p = posts.find(x => x.id === id);
  if (!p){
    mount.innerHTML = '<p style="opacity:.85">게시글을 찾을 수 없습니다. <a href="news/index.html">목록으로</a></p>';
    return;
  }

  function escapeHtml(s){
    return String(s ?? '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;', "'":'&#39;'}[m]));
  }
  function formatDate(iso){
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString('en-US', { year:'numeric', month:'short', day:'2-digit' });
  }

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

  const title = toOneLine(pickText(p, 'title', p.title || ''));
  const contentLines = toLines(pickText(p, 'content', p.content || []));
  const excerpt = toOneLine(pickText(p, 'excerpt', p.excerpt || ''));
  const cover = coverUrl(p);

  document.title = `${title} | Auto_Lab`;

  const paragraphs = contentLines.map(line => `<p>${escapeHtml(line)}</p>`).join('');

  mount.innerHTML = `
    <a class="post__back" href="news/index.html">← View all news</a>

    <article class="post__head">
      <div class="post__meta">
        <span>${escapeHtml(p.category || 'NEWS')}</span>
        <span>${escapeHtml(formatDate(p.date))}</span>
      </div>
      <h1 class="post__title">${escapeHtml(title)}</h1>
      <div class="post__cover" style="background-image:url('${escapeHtml(cover)}')"></div>
    </article>

    <section class="post__body">
      ${paragraphs || `<p>${escapeHtml(excerpt)}</p>`}
      ${
        p.source_url
          ? `<a class="post__source" href="${escapeHtml(p.source_url)}" target="_blank" rel="noopener">원문 보기 →</a>`
          : ''
      }
    </section>
  `;
})();
