/* /news/post.js
   - ?id= 로 게시글 렌더링
   - source_url이 있으면 '원문 보기' 버튼 표시(인스타 등)
   - ko/en 전환 시 페이지 새로고침 없이 내용 재렌더링 (/main/script.js 토글을 방해하지 않음)
*/
(async function(){
  const T = (k, f='') => (window.__t ? window.__t(k, f) : f);
  const mount = document.getElementById('postMount');
  if (!mount) return;

  const id = new URLSearchParams(location.search).get('id');
  if (!id){
    mount.innerHTML = '<p style="opacity:.85">잘못된 접근입니다. <a href="/news/index.html">목록으로</a></p>';
    return;
  }

  let posts = [];
  try{
    const res = await fetch('/news/news.json', { cache: 'no-store' });
    posts = await res.json();
  }catch(err){
    mount.innerHTML = '<p style="opacity:.85">게시글 데이터를 불러오지 못했습니다. <a href="/news/index.html">목록으로</a></p>';
    return;
  }

  const p = posts.find(x => String(x.id) === String(id));
  if (!p){
    mount.innerHTML = '<p style="opacity:.85">게시글을 찾을 수 없습니다. <a href="/news/index.html">목록으로</a></p>';
    return;
  }

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

  // ---------- locale helpers ----------
  function getLang(){
    const v = (localStorage.getItem('lang') || 'ko').toLowerCase();
    return v === 'en' ? 'en' : 'ko';
  }

  function pickText(post, baseKey, fallback=''){
    const lang = getLang();

    // 1) baseKey_ko / baseKey_en 우선
    const v1 = post?.[`${baseKey}_${lang}`];
    if (v1 !== undefined && v1 !== null) return v1;

    // 2) {ko,en} 객체 형태 지원
    const obj = post?.[baseKey];
    if (obj && typeof obj === 'object' && (obj.ko !== undefined || obj.en !== undefined)){
      const v2 = obj[lang];
      if (v2 !== undefined && v2 !== null) return v2;
      return obj.ko ?? obj.en ?? fallback;
    }

    // 3) 기존 단일 필드 (백워드 호환)
    const v3 = post?.[baseKey];
    return (v3 !== undefined && v3 !== null) ? v3 : fallback;
  }

  function toOneLine(v){
    if (Array.isArray(v)) return v.filter(Boolean).join(' ');
    return String(v ?? '');
  }

  function toLines(v){
    if (Array.isArray(v)) return v.filter(x => x !== null && x !== undefined).map(String);
    if (typeof v === 'string' && v.trim()) return [v];
    return [];
  }

  function coverUrl(post){
    const c = post?.cover;
    if (Array.isArray(c)) return c[0] || '';
    return c || '';
  }

  function backLabel(){
    return getLang() === 'en' ? '← View all news' : '← 전체 뉴스 보기';
  }

  function sourceLabel(){
    return getLang() === 'en' ? 'View source →' : '원문 보기 →';
  }
  // -----------------------------------

  function renderPost(){
    const title = toOneLine(pickText(p, 'title', p.title || ''));
    const excerpt = toOneLine(pickText(p, 'excerpt', p.excerpt || ''));
    const contentLines = toLines(pickText(p, 'content', p.content || []));
    const cover = coverUrl(p);

    document.title = `${title} | Auto_Lab`;

    const paragraphs = contentLines.map(line => `<p>${escapeHtml(line)}</p>`).join('');

    mount.innerHTML = `
      <a class="post__back" href="/news/index.html">${escapeHtml(backLabel())}</a>

      <article class="post__head">
        <div class="post__meta">
          <span>${escapeHtml(p.category || 'NEWS')}</span>
          <span>${escapeHtml(formatDate(p.date))}</span>
        </div>
        <h1 class="post__title">${escapeHtml(title)}</h1>
        <div class="post__cover" style="background-image:url('${escapeHtml(cover)}')"></div>
      </article>

      <section class="post__body">
        ${paragraphs || (excerpt ? `<p>${escapeHtml(excerpt)}</p>` : '')}
        ${
          p.source_url
            ? `<a class="post__source" href="${escapeHtml(p.source_url)}" target="_blank" rel="noopener">${escapeHtml(sourceLabel())}</a>`
            : ''
        }
      </section>
    `;
  }

  // 최초 렌더
  renderPost();

  // 언어 토글 시: /main/script.js가 localStorage.lang을 바꾼 뒤 재렌더
  const langBtn = document.getElementById('langToggleBtn');
  if (langBtn && !langBtn.dataset.postRerenderBound){
    langBtn.dataset.postRerenderBound = '1';
    langBtn.addEventListener('click', () => {
      // /main/script.js 토글 처리 후 반영
      setTimeout(() => renderPost(), 0);
    });
  }
})();
