/* news/post.js
   - news.json을 읽어서 단일 글 렌더링
   - ?id=... 로 post 선택
*/
(async function(){
  const T = (k, f='') => (window.__t ? window.__t(k, f) : f);

  function qs(name){
    const u = new URL(location.href);
    return u.searchParams.get(name);
  }

  function escapeHtml(s){
    return String(s ?? '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;', "'":'&#39;'}[m]));
  }

  function formatDate(iso){
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString('en-US', { year:'numeric', month:'short', day:'2-digit' });
  }

  /* ===================== locale helpers (SAFE, backward compatible) ===================== */
  function getLang(){
    return (localStorage.getItem('lang') || 'ko').toLowerCase();
  }
  const LANG = (getLang() === 'en') ? 'en' : 'ko';

  function pickText(p, baseKey, fallback=''){
    const v1 = p?.[`${baseKey}_${LANG}`];
    if (v1 !== undefined && v1 !== null) return v1;

    const obj = p?.[baseKey];
    if (obj && typeof obj === 'object' && (obj.ko !== undefined || obj.en !== undefined)){
      const v2 = obj[LANG];
      if (v2 !== undefined && v2 !== null) return v2;
      return obj.ko ?? obj.en ?? fallback;
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
  /* ===================================================================================== */

  const id = qs('id');
  const root = document.getElementById('postRoot') || document.querySelector('main') || document.body;

  if (!id){
    root.innerHTML = '<p style="opacity:.8;text-align:center">잘못된 접근입니다.</p>';
    return;
  }

  let posts = [];
  try{
    const res = await fetch('news/news.json', { cache:'no-store' });
    posts = await res.json();
  }catch(err){
    root.innerHTML = '<p style="opacity:.8;text-align:center">뉴스 데이터를 불러오지 못했습니다.</p>';
    return;
  }

  const p = posts.find(x => String(x.id) === String(id));
  if (!p){
    root.innerHTML = '<p style="opacity:.8;text-align:center">해당 글을 찾을 수 없습니다.</p>';
    return;
  }

  const title = toOneLine(pickText(p, 'title', p.title || ''));
  const contentLines = toLines(pickText(p, 'content', p.content || []));
  const excerpt = toOneLine(pickText(p, 'excerpt', p.excerpt || ''));

  // document title
  document.title = `${title} | Auto_Lab`;

  // Render: 기존 DOM 구조를 몰라도 깨지지 않게 최소한으로 생성
  const coverHtml = p.cover ? `
    <div class="post-cover">
      <img src="${escapeHtml(p.cover)}" alt="${escapeHtml(title)}">
    </div>` : '';

  const paragraphs = contentLines.length
    ? contentLines.map(line => `<p>${escapeHtml(line)}</p>`).join('')
    : (excerpt ? `<p>${escapeHtml(excerpt)}</p>` : '');

  // source link optional (if exists in data)
  const sourceUrl = p.source_url || p.url || '';
  const sourceHtml = sourceUrl
    ? `<p class="post-source"><a href="${escapeHtml(sourceUrl)}" target="_blank" rel="noopener">View Source →</a></p>`
    : '';

  root.innerHTML = `
    <article class="post">
      ${coverHtml}
      <h1 class="post__title">${escapeHtml(title)}</h1>
      <p class="post__meta">${escapeHtml(formatDate(p.date))}${p.category ? ` • ${escapeHtml(p.category)}` : ''}</p>
      <div class="post__body">
        ${paragraphs}
        ${sourceHtml}
      </div>
    </article>
  `;
})();
