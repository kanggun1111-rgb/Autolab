/* news/post.js
   - ?id= 로 게시글 렌더링
   - source_url이 있으면 '원문 보기' 버튼 표시(인스타 등)
*/
(async function(){
  const T = (k, f='') => (window.__t ? window.__t(k, f) : f);
  const mount = document.getElementById('postMount');
  if (!mount) return;

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



// ===== locale helpers (keeps existing layout / functions) =====
function getLang(){
  const v = (localStorage.getItem('lang') || 'ko').toLowerCase();
  return (v === 'en') ? 'en' : 'ko';
}
function asText(v){
  if (Array.isArray(v)) return v.filter(Boolean).join(' ');
  return String(v ?? '');
}
function asLines(v){
  if (Array.isArray(v)) return v;
  if (typeof v === 'string') return v ? [v] : [];
  return [];
}
function pick(p, key){
  const lang = getLang();
  const v = p && p[`${key}_${lang}`];
  if (v !== undefined && v !== null && v !== '') return v;
  return p ? p[key] : '';
}
(function bindLangToggleFallback(){
  const btn = document.getElementById('langToggleBtn');
  if (!btn || btn.dataset.langFallbackBound) return;
  btn.dataset.langFallbackBound = '1';
  btn.addEventListener('click', () => {
    btn.dataset.langBefore = (localStorage.getItem('lang') || 'ko');
  }, true);
  btn.addEventListener('click', () => {
    const before = (btn.dataset.langBefore || (localStorage.getItem('lang') || 'ko')).toLowerCase();
    const after = (localStorage.getItem('lang') || 'ko').toLowerCase();
    if (after !== before) return;
    localStorage.setItem('lang', before === 'en' ? 'ko' : 'en');
    location.reload();
  });
})();
// ==============================================================

  const title = asText(pick(p,'title'));
  document.title = `${title} | Auto_Lab`;

  const lines = asLines(pick(p,'content'));
  const paragraphs = (lines || []).map(line => `<p>${escapeHtml(line)}</p>`).join('');

  mount.innerHTML = `
    <a class="post__back" href="news/index.html">← View all news</a>

    <article class="post__head">
      <div class="post__meta">
        <span>${escapeHtml(p.category || 'NEWS')}</span>
        <span>${escapeHtml(formatDate(p.date))}</span>
      </div>
      <h1 class="post__title">${escapeHtml(title)}</h1>
      <div class="post__cover" style="background-image:url('${escapeHtml(p.cover)}')"></div>
    </article>

    <section class="post__body">
      ${paragraphs || `<p>${escapeHtml(asText(pick(p,'excerpt')) || '')}</p>`}
      ${
        p.source_url
          ? `<a class="post__source" href="${escapeHtml(p.source_url)}" target="_blank" rel="noopener">원문 보기 →</a>`
          : ''
      }
    </section>
  `;
})();