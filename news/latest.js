/* news/latest.js
   - 메인(index)에서 최신 뉴스 N개 렌더링
*/
(async function(){
  const mount = document.getElementById('latestNews');
  if (!mount) return;

  function escapeHtml(s){
    return String(s ?? '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;', "'":'&#39;'}[m]));
  }

  function formatDate(iso){
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString('en-US', { year:'numeric', month:'short', day:'2-digit' });
  }

  /* locale helpers */
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

  let posts = [];
  try{
    const res = await fetch('news/news.json', { cache:'no-store' });
    posts = await res.json();
  }catch(err){
    // fail silently on main
    return;
  }

  posts.sort((a,b) => new Date(b.date) - new Date(a.date));
  const top = posts.slice(0, 3);

  mount.innerHTML = top.map(p => {
    const title = toOneLine(pickText(p, 'title', p.title || ''));
    const excerpt = toOneLine(pickText(p, 'excerpt', p.excerpt || ''));

    return `
      <div class="news-card">
        <div class="news-image">
          <img src="${escapeHtml(p.cover)}" alt="${escapeHtml(title)}">
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
})();
