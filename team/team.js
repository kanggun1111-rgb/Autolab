/* team/team.js (v2 simplified) */
(async function(){
  const $ = (id) => document.getElementById(id);

  let data;
  try{
    const res = await fetch('team/team.json', { cache: 'no-store' });
    data = await res.json();
  }catch(e){ return; }

  const esc = (s)=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));

  /* HERO */
  const h=data.hero||{};
  $('heroEyebrow').textContent=h.eyebrow||'';
  $('heroTitle').textContent=h.title||'';
  $('heroLead').textContent=h.lead||'';
  if(h.image) $('heroImage').src=h.image;
  $('heroCaptionBold').textContent=h.caption_bold||'';
  $('heroCaption').textContent=h.caption||'';

  /* Metrics */
  $('heroMetrics').innerHTML=(data.metrics||[]).map(m=>`
    <div class="metric"><b>${esc(m.label)}</b><span>${esc(m.value)}</span></div>
  `).join('');

  /* Timeline */
  $('timeline').innerHTML=(data.achievements||[]).map(t=>`
    <article class="t-item">
      <div class="date">${esc(t.date)}</div>
      <div>
        <h3>${esc(t.title)}</h3>
        <p>${esc(t.desc)}</p>
      </div>
    </article>
  `).join('');

  /* Members */
  const members=data.members||[];
  const divSel=$('memberDivision'), search=$('memberSearch'), grid=$('memberGrid');

  const divisions=[...new Set(members.map(m=>m.division).filter(Boolean))].sort();
  divSel.innerHTML=['<option value="ALL">All Divisions</option>']
    .concat(divisions.map(d=>`<option value="${esc(d)}">${esc(d)}</option>`)).join('');

  function match(m){
    if(divSel.value!=='ALL' && m.division!==divSel.value) return false;
    const q=(search.value||'').toLowerCase();
    return !q || `${m.name} ${m.role} ${m.division}`.toLowerCase().includes(q);
  }

  function renderMembers(){
    const list=members.filter(match);
    grid.innerHTML=list.map(m=>`
      <article class="member-card">
        <div class="member-photo"><img src="${esc(m.image||'team/images/member-placeholder.jpg')}"></div>
        <div class="member-body">
          <h3>${esc(m.name)}</h3>
          <div class="meta">
            <span>${esc(m.role)}</span>
            <span class="pill">${esc(m.division)}</span>
          </div>
        </div>
      </article>
    `).join('') || '<p style="opacity:.8">No members found.</p>';
  }

  divSel.onchange=renderMembers;
  search.oninput=renderMembers;
  renderMembers();
})();
