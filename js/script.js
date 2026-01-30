// 뉴스 썸네일 클릭
const mainFrame = document.getElementById('mainNews');
document.querySelectorAll('.news-thumbnails iframe').forEach(frame => {
  frame.addEventListener('click', () => {
    mainFrame.src = frame.dataset.large;
  });
});

// 햄버거 메뉴 토글
const hamburger = document.querySelector('.hamburger');
const navLinks = document.querySelector('.nav-links');
hamburger.addEventListener('click', () => {
  navLinks.classList.toggle('active');
});
