// Hamburger 메뉴 토글
const hamburger = document.querySelector('.hamburger');
const navLinks = document.querySelector('.nav-links');

hamburger.addEventListener('click', () => {
    navLinks.classList.toggle('active');
});

// Navbar 스크롤 효과
window.addEventListener('DOMContentLoaded', () => {
  const header = document.querySelector('header');
  const hero = document.getElementById('hero-grid');

  if (!header || !hero) return;

  // hero-grid가 화면에 "조금이라도" 보이면 투명(= scrolled 제거)
  // hero-grid가 화면에서 완전히 사라지면 배경 적용(= scrolled 추가)
  const observer = new IntersectionObserver(
    ([entry]) => {
      if (entry.isIntersecting) {
        header.classList.remove('scrolled');
      } else {
        header.classList.add('scrolled');
      }
    },
    {
      root: null,
      threshold: 0.01, // 1%라도 보이면 isIntersecting=true
    }
  );

  observer.observe(hero);
});


//뉴스

const mainNews = document.getElementById('news-display');
const mainLink = document.getElementById('news-main-link');
const thumbs = document.querySelectorAll('#news-thumbnails img');

thumbs.forEach(thumb => {
  thumb.addEventListener('click', () => {
    // 메인 이미지 변경
    mainNews.src = thumb.src;
    // 메인 링크도 업데이트
    mainLink.href = thumb.dataset.link;
  });
});

