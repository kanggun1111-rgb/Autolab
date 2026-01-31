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
  const hero = document.getElementById('hero-grid');
  if (!header || !hero) return;

  const observer = new IntersectionObserver(
    ([entry]) => {
      if (entry.isIntersecting) header.classList.remove('scrolled');
      else header.classList.add('scrolled');
    },
    { threshold: 0.01 }
  );

  observer.observe(hero);
});

/* Anchor 이동: navbar 높이 고려해서 정확히 */
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

    // 모바일에서 메뉴 닫기
    if (navLinks && navLinks.classList.contains('active')) {
      navLinks.classList.remove('active');
    }

    history.pushState(null, '', id);
  });
});

/* 뉴스 썸네일 (있을 때만) */
const mainNews = document.getElementById('news-display');
const mainLink = document.getElementById('news-main-link');
const thumbs = document.querySelectorAll('#news-thumbnails img');

if (mainNews && mainLink && thumbs.length) {
  thumbs.forEach(thumb => {
    thumb.addEventListener('click', () => {
      mainNews.src = thumb.src;
      mainLink.href = thumb.dataset.link;
    });
  });
}

/* Hero 비디오가 있을 때만 강제 재생 */
const heroVideo = document.querySelector('.bg-video');
if (heroVideo) {
  heroVideo.muted = true;
  heroVideo.play().catch(err => console.warn("Video autoplay prevented:", err));
}


