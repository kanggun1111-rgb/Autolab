/* main/script.js
   Global navbar behavior (works across index/team/sponsors/others)
   - Transparent header while hero is visible
   - Adds .scrolled when hero leaves viewport (IntersectionObserver)
   - Fallback to scrollY-based behavior if no hero exists
   - Mobile hamburger toggle (.menu-open on header)
*/

(() => {
  const header = document.querySelector('.site-header');
  if (!header) return;

  const toggleBtn = header.querySelector('.nav-toggle');
  const navLinksWrap = header.querySelector('.nav-links');

  // ---------------------------
  // Mobile menu toggle
  // ---------------------------
  const closeMenu = () => header.classList.remove('menu-open');

  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      header.classList.toggle('menu-open');
    });
  }

  // Close menu when clicking a nav link (mobile)
  if (navLinksWrap) {
    navLinksWrap.addEventListener('click', (e) => {
      const a = e.target.closest('a');
      if (!a) return;
      closeMenu();
    });
  }

  // Close menu on ESC
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeMenu();
  });

  // Close menu on resize to desktop
  window.addEventListener('resize', () => {
    if (window.innerWidth > 860) closeMenu();
  });

  // ---------------------------
  // Navbar "scrolled" behavior
  // ---------------------------
  const hero =
    document.querySelector('#hero-grid') ||
    document.querySelector('#team-hero') ||
    document.querySelector('#sponsors-hero') ||
    document.querySelector('[data-nav-hero]');

  const setScrolled = (on) => header.classList.toggle('scrolled', !!on);

  // If hero exists and IntersectionObserver supported
  if (hero && 'IntersectionObserver' in window) {
    const obs = new IntersectionObserver(
      ([entry]) => {
        // hero is visible => header transparent (no .scrolled)
        // hero not visible => header gets background (.scrolled)
        setScrolled(!entry.isIntersecting);
      },
      { threshold: 0.12 }
    );

    obs.observe(hero);
  } else {
    // Fallback: add background after small scroll
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  // ---------------------------
  // Optional: Close menu if user taps outside (mobile)
  // ---------------------------
  document.addEventListener('click', (e) => {
    if (!header.classList.contains('menu-open')) return;
    const insideHeader = e.target.closest('.site-header');
    if (!insideHeader) closeMenu();
  });
})();

