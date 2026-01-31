// Hero video
const heroVideo = document.querySelector('.bg-video');
heroVideo.muted = true;
heroVideo.play().catch(err => console.warn("Video autoplay prevented:", err));

// Hamburger
const hamburger = document.querySelector('.hamburger');
const navLinks = document.querySelector('.nav-links');
hamburger.addEventListener('click', () => {
  navLinks.classList.toggle('active');
});

// Navbar 스크롤
window.addEventListener('DOMContentLoaded', () => {
  const header = document.querySelector('header');
  const checkScroll = () => {
    if (window.scrollY > 50) header.classList.add('scrolled');
    else header.classList.remove('scrolled');
  };
  window.addEventListener('scroll', checkScroll);
  checkScroll();
});

// 뉴스 썸네일 (필요 시 상대경로 주의)
const mainNews = document.getElementById('news-display');
const mainLink = document.getElementById('news-main-link');
const thumbs = document.querySelectorAll('#news-thumbnails img');
thumbs.forEach(thumb => {
  thumb.addEventListener('click', () => {
    mainNews.src = thumb.src;
    mainLink.href = thumb.dataset.link;
  });
});
