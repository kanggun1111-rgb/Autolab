// Hamburger 메뉴 토글
const hamburger = document.querySelector('.hamburger');
const navLinks = document.querySelector('.nav-links');

hamburger.addEventListener('click', () => {
    navLinks.classList.toggle('active');
});

// Navbar 스크롤 효과
window.addEventListener('DOMContentLoaded', () => {
  const header = document.querySelector('header');

  const checkScroll = () => {
    if (window.scrollY > 50) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  };

  window.addEventListener('scroll', checkScroll);
  checkScroll(); // 초기 로딩 시 상태 확인
});



// 뉴스 썸네일 클릭 시 메인 이미지 변경
const mainNews = document.getElementById('news-display');
const thumbs = document.querySelectorAll('#news-thumbnails img');

thumbs.forEach(thumb => {
    thumb.addEventListener('click', () => {
        mainNews.src = thumb.src;
    });
});

// Hero 비디오 강제 재생 (브라우저 정책 대비)
const heroVideo = document.querySelector('.bg-video');
heroVideo.muted = true;
heroVideo.play().catch(err => console.warn("Video autoplay prevented:", err));
