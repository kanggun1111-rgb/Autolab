/* news/latest.js
   - 메인(index.html)의 NEWS 섹션(.news-grid)을 news.json 기반으로 자동 채움 (최신 3개)
   - 기존의 카드(하드코딩)는 이 스크립트가 실행되면 자동으로 교체됨
*/
(async function(){
  const section = document.getElementById('news');
  if (!section) return;

  const grid = section.querySelector('.news-grid');
  if (!grid) return;

  let posts = [];
  try{
    const res = await fetch('news/news.json', { cache: 'no-store' });
    posts = await res.json();
  }catch(err){
    return;
  }

  posts.sort((a,b) => new Date(b.date) - new Date(a.date));
  const top = posts.slice(0, 3);

  function escapeHtml(s){
    return String(s ?? '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;', "'":'&#39;'}[m]));
  }
  function formatDate(iso){
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString('en-US', { year:'numeric', month:'short', day:'2-digit' });
  }



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

  grid.innerHTML = top.map(p => `
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
})();
