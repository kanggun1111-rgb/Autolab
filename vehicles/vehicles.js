/* vehicles/vehicles.js (v3)
   ✅ 요구사항
   - '현재 시즌 2대(ALE/ALC)'만 상세 페이지로 연결
   - 이전 차량은 모달 유지 (상세 페이지 없음)
   - 2027 등 다음 시즌은 vehicles.json만 수정하면 자동 반영
   - 상세 페이지는 단일 페이지(detail.html?id=ale-27)로 자동 업데이트
*/
(async function(){
  const T = (k, f='') => (window.__t ? window.__t(k, f) : f);
  const featuredGrid = document.getElementById('featuredGrid');
  const previousGrid = document.getElementById('previousGrid');
  const filterType = document.getElementById('filterType');
  const filterYear = document.getElementById('filterYear');
  const seasonSelect = document.getElementById('seasonSelect');

  const modal = document.getElementById('specModal');
  const modalTitle = document.getElementById('modalTitle');
  const modalBody = document.getElementById('modalBody');
  const modalClose = document.getElementById('modalClose');

  if (!featuredGrid || !previousGrid) return;

  let data;
  try{
    const res = await fetch('vehicles/vehicles.json', { cache: 'no-store' });
    data = await res.json();
  }catch(err){
    featuredGrid.innerHTML = '<p style="opacity:.8">데이터를 불러오지 못했습니다.</p>';
    return;
  }

  const featuredAll = data.featured || [];
  const previous = data.previous || [];

  function esc(s){
    return String(s ?? '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;', "'":'&#39;'}[m]));
  }

  function seasonsFromFeatured(){
    const set = new Set(featuredAll.map(v => String(v.season || '').trim()).filter(Boolean));
    // sort desc numeric
    return Array.from(set).sort((a,b) => Number(b) - Number(a));
  }

  function currentSeasonDefault(){
    const seasons = seasonsFromFeatured();
    return seasons[0] || '';
  }

  function populateSeasonSelect(){
    if (!seasonSelect) return;
    const seasons = seasonsFromFeatured();
    seasonSelect.innerHTML = seasons.map(s => `<option value="${esc(s)}">${esc(s)}</option>`).join('');
    seasonSelect.value = currentSeasonDefault();
    seasonSelect.addEventListener('change', () => renderFeatured(seasonSelect.value));
  }

  function featuredPairForSeason(season){
    const list = featuredAll.filter(v => String(v.season) === String(season));
    // We expect exactly EV + CV, but keep robust
    const ev = list.find(v => v.type === 'EV');
    const cv = list.find(v => v.type === 'CV');
    const rest = list.filter(v => v !== ev && v !== cv);
    return [ev, cv].filter(Boolean).concat(rest.slice(0, 2)); // ensure at least up to 2 cards
  }

  function detailHref(id){
    return `vehicles/detail.html?id=${encodeURIComponent(id)}`;
  }

  function renderFeatured(season){
    const pair = featuredPairForSeason(season);
    if (pair.length === 0){
      featuredGrid.innerHTML = '<p style="opacity:.8">해당 시즌 차량 데이터가 없습니다.</p>';
      return;
    }

    featuredGrid.innerHTML = pair.slice(0,2).map(v => {
      const stats = v.stats || {};
      const highlights = (v.highlights || []).slice(0, 3).map(x => `<li>${esc(x)}</li>`).join('');
      return `
        <article class="vehicle-card">
          <div class="vehicle-card__media">
            <img src="${esc(v.cover)}" alt="${esc(v.name)}">
          </div>

          <div class="vehicle-card__body">
            <span class="vehicle-chip">${esc(v.type)} • ${esc(v.season)}</span>

            <div class="vehicle-title">
              <h3>${esc(v.name)}</h3>
              <span>${esc(v.type)} PLATFORM</span>
            </div>

            <p class="vehicle-card__tagline">${esc(v.tagline || '')}</p>

            <div class="vehicle-split">
              <div class="vehicle-stats">
                <h4>KEY SPECS</h4>
                <dl>
                  ${Object.entries(stats).slice(0, 6).map(([k,val]) => `
                    <dt>${esc(k)}</dt>
                    <dd>${esc(val)}</dd>
                  `).join('')}
                </dl>
              </div>

              <div class="vehicle-highlights">
                <h4>HIGHLIGHTS</h4>
                <ul>${highlights}</ul>
              </div>
            </div>

            <div class="vehicle-cta">
              <a href="${detailHref(v.id)}">View Details →</a>
            </div>
          </div>
        </article>
      `;
    }).join('');
  }

  /* Previous (modal only) */
  function matchesPrev(v){
    const t = filterType ? filterType.value : 'ALL';
    const q = (filterYear ? filterYear.value : '').trim().toLowerCase();
    if (t !== 'ALL' && v.type !== t) return false;
    if (!q) return true;
    const hay = `${v.name} ${v.season} ${v.type}`.toLowerCase();
    return hay.includes(q);
  }

  function renderPrevious(){
    const items = previous.filter(matchesPrev);

    previousGrid.innerHTML = items.map(v => `
      <article class="prev-card" data-vid="${esc(v.id)}" tabindex="0" role="button" aria-label="Open specs for ${esc(v.name)}">
        <div class="prev-card__media">
          <img src="${esc(v.cover)}" alt="${esc(v.name)}">
        </div>
        <div class="prev-card__body">
          <div class="prev-card__top">
            <h3>${esc(v.name)}</h3>
            <span>${esc(v.type)} • ${esc(v.season)}</span>
          </div>

          <div class="prev-specs">
            ${Object.entries(v.specs || {}).slice(0, 3).map(([k,val]) => `
              <div class="row"><b>${esc(k)}</b><span>${esc(val)}</span></div>
            `).join('')}
          </div>
        </div>
      </article>
    `).join('');

    previousGrid.querySelectorAll('.prev-card').forEach(card => {
      const id = card.getAttribute('data-vid');
      card.addEventListener('click', () => openModal(id));
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') openModal(id);
      });
    });
  }

  function openModal(id){
    const v = previous.find(x => x.id === id);
    if (!v) return;

    modalTitle.textContent = `${v.name} • ${v.type} • ${v.season}`;
    const rows = Object.entries(v.specs || {}).map(([k,val]) => `
      <tr><th>${esc(k)}</th><td>${esc(val)}</td></tr>
    `).join('');

    modalBody.innerHTML = `<table class="spec-table"><tbody>${rows}</tbody></table>`;
    modal.classList.add('open');
    modal.setAttribute('aria-hidden','false');
    document.body.style.overflow = 'hidden';
  }

  function closeModal(){
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden','true');
    document.body.style.overflow = '';
  }

  modalClose?.addEventListener('click', closeModal);
  modal?.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && modal.classList.contains('open')) closeModal(); });

  filterType?.addEventListener('change', renderPrevious);
  filterYear?.addEventListener('input', renderPrevious);

  populateSeasonSelect();
  renderFeatured(seasonSelect ? seasonSelect.value : currentSeasonDefault());
  renderPrevious();
})();