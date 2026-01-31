
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
