
// Hamburger 메뉴 토글
const hamburger = document.querySelector('.hamburger');
const navLinks = document.querySelector('.nav-links');

if (hamburger && navLinks) {
  const toggleMenu = () => navLinks.classList.toggle('active');
  hamburger.addEventListener('click', toggleMenu);

  hamburger.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') toggleMenu();
  });
}

/* Navbar 배경:
   hero-grid가 화면에 보이는 동안(header 투명)
   hero-grid가 화면에서 사라지면(header.scrolled 적용)
*/
window.addEventListener('DOMContentLoaded', () => {
  const header = document.querySelector('header');
  // ✅ 페이지별 hero 표준: data-nav-hero 우선, 없으면 메인 hero-grid fallback
  const hero = document.querySelector('[data-nav-hero]') || document.getElementById('hero-grid');

  if (!header || !hero) return;

  const observer = new IntersectionObserver(
    ([entry]) => {
      if (entry.isIntersecting) header.classList.remove('scrolled');
      else header.classList.add('scrolled');
    },
    { threshold: 0.02 }
  );

  observer.observe(hero);
});


/* Anchor 이동: navbar 높이 고려 */
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', (e) => {
    const id = a.getAttribute('href');
    const target = document.querySelector(id);
    if (!target) return;

    e.preventDefault();

    const header = document.querySelector('header');
    const navH = header ? header.offsetHeight : 0;
    const y = target.getBoundingClientRect().top + window.scrollY - navH - 12;

    window.scrollTo({ top: y, behavior: 'smooth' });

    if (navLinks && navLinks.classList.contains('active')) {
      navLinks.classList.remove('active');
    }

    history.pushState(null, '', id);
  });
});

(function () {
  const marquees = document.querySelectorAll('.sponsor-marquee');

  marquees.forEach((marquee) => {
    const track = marquee.querySelector('.sponsor-marquee-track');
    if (!track) return;

    // 원본 로고들만을 기준으로 복제하기 위해 초기 상태의 자식들을 저장
    const originals = Array.from(track.children);
    if (originals.length === 0) return;

    // 이미 수동 duplicate를 넣어놨다면(alt에 duplicate 등), 원본만 남기고 싶으면 여기서 필터 가능 / const originals = Array.from(track.children).filter(el => !el.alt?.includes('duplicate'));

    // 컨테이너 폭의 최소 2배 이상이 될 때까지 반복 복제
    const targetWidth = marquee.clientWidth * 2.2;

    // track이 렌더된 뒤 실제 폭을 기준으로 복제
    const fill = () => {
      // 너무 많이 복제되는 것 방지(안전장치)
      let guard = 0;

      while (track.scrollWidth < targetWidth && guard < 30) {
        originals.forEach((node) => {
          track.appendChild(node.cloneNode(true));
        });
        guard++;
      }

      // -50% 애니메이션을 쓸 거면, "절반 지점이 동일한 시퀀스"가 되도록 한 번 더 복제 / 즉, track에 '원본 시퀀스'가 최소 2세트 이상 포함되게 보장 / (위 while이 보통 해결하지만, 아주 큰 화면에서 부족할 수 있어 1회 보강)
      if (track.children.length < originals.length * 2) {
        originals.forEach((node) => track.appendChild(node.cloneNode(true)));
      }
    };

    // 이미지 로딩 후 폭이 변하므로 onload/resize 대응
    const onReady = () => fill();

    // 이미지들이 로드되면 재계산
    const imgs = track.querySelectorAll('img');
    let remaining = imgs.length;
    if (remaining === 0) {
      onReady();
    } else {
      imgs.forEach((img) => {
        if (img.complete) {
          remaining--;
          if (remaining === 0) onReady();
        } else {
          img.addEventListener('load', () => {
            remaining--;
            if (remaining === 0) onReady();
          });
          img.addEventListener('error', () => {
            remaining--;
            if (remaining === 0) onReady();
          });
        }
      });
    }

    // 리사이즈 때 다시 맞춤 (모바일 회전 대응)
    window.addEventListener('resize', () => {
      // 리사이즈 시 과복제 방지 위해, 다시 원본만 남기고 재복제하는 방식이 가장 깔끔 / (단, 기존의 clone들을 제거)
      const keep = originals.length;
      while (track.children.length > keep) track.removeChild(track.lastElementChild);
      fill();
    });
  });
})();

document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('toggleViewBtn');
  if (!btn) return;

  const root = document.documentElement;

  // 저장된 상태 복원
  if (localStorage.getItem('viewMode') === 'pc') {
    root.classList.add('pc-view');
    btn.textContent = '모바일 버전으로 보기';
  } else {
    btn.textContent = 'PC 버전으로 보기';
  }

  btn.addEventListener('click', () => {
    const isPc = root.classList.toggle('pc-view');

    if (isPc) {
      localStorage.setItem('viewMode', 'pc');
      btn.textContent = '모바일 버전으로 보기';
    } else {
      localStorage.removeItem('viewMode');
      btn.textContent = 'PC 버전으로 보기';
    }
  });
// pc-view 토글 버튼 로직 안에서 (pc-view 켜거나 끌 때 공통으로)
if (navLinks) navLinks.classList.remove('active');
});






/* ================= LANGUAGE (KO/EN) =================
   - Toggle button id: langToggleBtn
   - Stores in localStorage: lang = 'ko' | 'en'
   - Applies [data-i18n] text via /main/site.json
*/
(function(){
  const KEY = 'lang';
  let SITE = null;
  let listeners = [];

  function getLang(){
    return (localStorage.getItem(KEY) || 'ko') === 'en' ? 'en' : 'ko';
  }

  function setLang(next){
    localStorage.setItem(KEY, next);
    document.documentElement.setAttribute('lang', next === 'en' ? 'en' : 'ko');
    applyI18n();
    listeners.forEach(fn => { try{ fn(next); }catch(e){} });
  }

  async function loadSite(){
    if (SITE) return SITE;
    try{
      const res = await fetch('/main/site.json', { cache: 'no-store' });
      SITE = await res.json();
    }catch(e){
      SITE = { i18n: { ko:{}, en:{} } };
    }
    return SITE;
  }

  function t(key){
    const L = getLang();
    const dict = (SITE && SITE.i18n && SITE.i18n[L]) ? SITE.i18n[L] : {};
    return dict[key] || '';
  }

  async function applyI18n(){
    await loadSite();

    // Apply data-i18n
    document.querySelectorAll('[data-i18n-html]').forEach(el => {
      const k = el.getAttribute('data-i18n-html');
      const v = t(k);
      if (!v) return;
      el.innerHTML = v;
    });

    // Apply data-i18n
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const k = el.getAttribute('data-i18n');
      const v = t(k);
      if (!v) return;
      el.textContent = v;
    });

    // Update language toggle label (ENG <-> 한글)
    const btn = document.getElementById('langToggleBtn');
    if (btn) btn.textContent = t('toggle.lang') || (getLang()==='en'?'한글':'ENG');

    // Update view toggle button label if exists
    const viewBtn = document.getElementById('toggleViewBtn');
    if (viewBtn){
      const isPc = document.documentElement.classList.contains('pc-view');
      viewBtn.textContent = isPc ? (t('toggle.view.mobile') || '모바일 버전으로 보기')
                                 : (t('toggle.view.pc') || 'PC 버전으로 보기');
    }
  }

  // Expose small API for page scripts
  window.__getLang = getLang;
  window.__setLang = setLang;
  window.__applyI18n = applyI18n;
  window.__t = (key, fallback='') => {
    try{ return t(key) || fallback || ''; }catch(e){ return fallback || ''; }
  };
  window.__onLangChange = (fn) => { listeners.push(fn); };

  document.addEventListener('DOMContentLoaded', async () => {
    const initial = getLang();
    document.documentElement.setAttribute('lang', initial === 'en' ? 'en' : 'ko');
    await applyI18n();

    const btn = document.getElementById('langToggleBtn');
    if (btn){
      btn.addEventListener('click', () => {
        const next = getLang() === 'ko' ? 'en' : 'ko';
        setLang(next);
        // Close hamburger menu if open
        const navLinks = document.querySelector('.nav-links');
        if (navLinks) navLinks.classList.remove('active');
      });
    }
  });
})();

/* ================= APPLY DEADLINE (Recruit) =================
   - Any element with [data-apply-cta] will be blocked after the deadline.
   - Shows a modal: "지원기간이 아닙니다"
   Deadline (UTC): 2026-03-09T15:00:00Z
*/
(function(){
  const AUTOLAB_RECRUIT_DEADLINE = new Date('2026-03-09T15:00:00Z').getTime();

  function getLang(){
    const htmlLang = (document.documentElement.getAttribute('lang') || 'ko').toLowerCase();
    const stored = (localStorage.getItem('lang') || '').toLowerCase();
    const L = stored || htmlLang;
    return (L === 'en') ? 'en' : 'ko';
  }

  function fallbackText(key){
    const L = getLang();
    const fb = {
      ko: { title: '지원기간이 아닙니다', body: '이번 모집은 마감되었습니다.', close: '닫기' },
      en: { title: 'Applications Closed', body: 'This recruitment period has ended.', close: 'Close' }
    };
    return (fb[L] && fb[L][key]) || fb.ko[key];
  }

  function pickText(i18nKey, fallbackKey){
    const el = document.querySelector('[data-i18n="' + i18nKey + '"]');
    const t = el && el.textContent ? el.textContent.trim() : '';
    return t || fallbackText(fallbackKey);
  }

  function isRecruitOpen(nowMs){
    const n = (typeof nowMs === 'number') ? nowMs : Date.now();
    return n < AUTOLAB_RECRUIT_DEADLINE;
  }

  function closeModal(){
    const ov = document.querySelector('.apply-modal-overlay');
    if (ov) ov.remove();
  }

  function showApplyClosedModal(){
    if (document.querySelector('.apply-modal-overlay')) return;

    const title = pickText('apply.modal.title', 'title');
    const body  = pickText('apply.modal.body',  'body');
    const close = pickText('apply.modal.close', 'close');

    const overlay = document.createElement('div');
    overlay.className = 'apply-modal-overlay';
    overlay.setAttribute('role','dialog');
    overlay.setAttribute('aria-modal','true');

    const modal = document.createElement('div');
    modal.className = 'apply-modal';

    const h = document.createElement('h3');
    h.textContent = title;

    const p = document.createElement('p');
    p.textContent = body;

    const actions = document.createElement('div');
    actions.className = 'apply-modal-actions';

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'apply-modal-btn';
    btn.textContent = close;
    btn.addEventListener('click', closeModal);

    actions.appendChild(btn);
    modal.appendChild(h);
    modal.appendChild(p);
    modal.appendChild(actions);
    overlay.appendChild(modal);

    overlay.addEventListener('click', function(e){
      if (e.target === overlay) closeModal();
    });

    document.addEventListener('keydown', function esc(e){
      if (e.key === 'Escape') {
        closeModal();
        document.removeEventListener('keydown', esc);
      }
    });

    document.body.appendChild(overlay);
  }

  window.__AUTOLAB__ = window.__AUTOLAB__ || {};
  window.__AUTOLAB__.isRecruitOpen = isRecruitOpen;
  window.__AUTOLAB__.showApplyClosedModal = showApplyClosedModal;

  window.addEventListener('DOMContentLoaded', function(){
    document.querySelectorAll('[data-apply-cta]').forEach(function(el){
      el.addEventListener('click', function(e){
        if (!isRecruitOpen()) {
          e.preventDefault();
          e.stopPropagation();
          showApplyClosedModal();
          return false;
        }
      });
    });
  });
})();
