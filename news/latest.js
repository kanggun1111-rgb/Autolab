/* /news/latest.js
   - 메인(index.html)의 NEWS 섹션(.news-grid)을 news.json 기반으로 자동 채움 (최신 3개)
   - 기존의 카드(하드코딩)는 이 스크립트가 실행되면 자동으로 교체됨
   - lang 토글 시(전역 설정 localStorage.lang) 즉시 재렌더
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

  / 최신순 정렬
  posts.sort((a,b) => new Date(b.date) - new Date(a.date));

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
    const v1 = p && p[`${key}_${lang}`];
    if (v1 !== undefined && v1 !== null && v1 !== '') return v1;

    / {ko,en} 객체도 지원
    const obj = p && p[key];
    if (obj && typeof obj === 'object' && (obj.ko !== undefined || obj.en !== undefined)){
      return obj[lang] ?? obj.ko ?? obj.en ?? '';
    }

    / 단일 필드 백워드 호환
    return p ? (p[key] ?? '') : '';
  }
  function coverUrl(p){
    const c = p?.cover;
    if (Array.isArray(c)) return c[0] || '';
    return c || '';
  }

  function render(){
    const top = posts.slice(0, 3);
    grid.innerHTML = top.map(p => {
      const title = asText(pick(p,'title'));
      const excerpt = asText(pick(p,'excerpt'));
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
            <a href="news/post.html?id=${encodeURIComponent(p.id)}" class="news-link">Read More →</a>
          </div>
        </div>
      `;
    }).join('');
  }

  / 최초 렌더
  render();

  / lang 토글 시 재렌더 (/main/script.js가 lang을 바꾼 뒤 반영)
  const langBtn = document.getElementById('langToggleBtn');
  if (langBtn && !langBtn.dataset.latestRerenderBound){
    langBtn.dataset.latestRerenderBound = '1';
    langBtn.addEventListener('click', () => {
      setTimeout(() => render(), 0);
    });
  }
})();
