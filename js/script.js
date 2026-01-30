// Hamburger toggle
const hamburger = document.querySelector('.hamburger');
const navLinks = document.querySelector('.nav-links');
hamburger.addEventListener('click', () => { navLinks.classList.toggle('active'); });

// News thumbnails 클릭 시 main 이미지 변경
const newsDisplay = document.getElementById('news-display');
const thumbnails = document.querySelectorAll('#news-thumbnails img');

thumbnails.forEach(img => {
  img.addEventListener('click', () => {
    newsDisplay.src = img.src;
  });
});
