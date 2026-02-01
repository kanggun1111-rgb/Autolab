/* vehicles/vehicledetail.js (v3)
   - One shared page: vehicles/detail.html?id=ale-26
   - Finds the matching item in vehicles.json (featured only)
   - JSON만 수정하면 상세 내용 자동 업데이트
*/
(async function(){
  const T = (k, f='') => (window.__t ? window.__t(k, f) : f);
  const mount = document.getElementById('detailMount');
  if (!mount) return;

  const params = new URLSearchParams(location.search);
  const id = params.get('id');

  if (!id){
    mount.innerHTML = '<p style="opacity:.85">잘못된 접근입니다. (id 없음)</p><p style="opacity:.7">Vehicles 페이지에서 다시 진입하세요.</p>';
    return;
  }

  let data;
  try{
    const res = await fetch('vehicles/vehicles.json', { cache:'no-store' });
    data = await res.json();
  }catch(e){
    mount.innerHTML = '<p style="opacity:.85">데이터를 불러오지 못했습니다.</p>';
    return;
  }

  const featured = data.featured || [];
  const v = featured.find(x => String(x.id).toLowerCase() === String(id).toLowerCase());

  if (!v){
    mount.innerHTML = '<p style="opacity:.85">차량 정보를 찾을 수 없습니다.</p><p style="opacity:.7">vehicles.json의 featured 항목을 확인하세요.</p>';
    return;
  }

  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;', "'":'&#39;'}[m]));
  const stats = v.stats || {};
  const highlights = (v.highlights || []).filter(Boolean).map(x => `<li>${esc(x)}</li>`).join('');
  const sections = (v.sections || []).map(sec => `
    <div class="section-block">
      <h3>${esc(sec.title)}</h3>
      ${(sec.body || []).map(p => `<p>${esc(p)}</p>`).join('')}
    </div>
  `).join('');

  const gallery = (v.gallery || []).filter(Boolean).map(src => `
    <div class="shot"><img src="${esc(src)}" alt="${esc(v.name)}"></div>
  `).join('');

  document.title = `${v.name} | Vehicles | Auto_Lab`;

  mount.innerHTML = `
    <section class="detail-hero">
      <div class="detail-cover">
        <img src="${esc(v.cover)}" alt="${esc(v.name)}">
      </div>

      <div class="detail-panel">
        <span class="detail-chip">${esc(v.type)} • ${esc(v.season)}</span>
        <h1>${esc(v.name)}</h1>
        <p>${esc(v.tagline || '')}</p>

        <div class="detail-actions">
          <a class="primary" href="vehicles/vehicles.html">← Back to Vehicles</a>
          <a href="#specs">Specs</a>
          <a href="#gallery">Gallery</a>
        </div>

        <div class="detail-grid" id="specs">
          <div class="card kv">
            <h2>KEY SPECS</h2>
            <dl>
              ${Object.entries(stats).map(([k,val]) => `
                <dt>${esc(k)}</dt><dd>${esc(val)}</dd>
              `).join('')}
            </dl>
          </div>

          <div class="card bullets">
            <h2>HIGHLIGHTS</h2>
            <ul>${highlights || '<li style="opacity:.75">내용을 vehicles.json에서 채워주세요.</li>'}</ul>
          </div>
        </div>
      </div>
    </section>

    <section class="sections">
      ${sections || '<div class="section-block"><h3>Concept</h3><p style="opacity:.8">vehicles.json에서 섹션 내용을 추가할 수 있습니다.</p></div>'}
    </section>

    <section id="gallery">
      <div class="card" style="margin-top:18px;">
        <h2>GALLERY</h2>
        <div class="gallery">${gallery || '<p style="opacity:.8">이미지를 추가하면 여기에 표시됩니다.</p>'}</div>
      </div>
    </section>
  `;
})();