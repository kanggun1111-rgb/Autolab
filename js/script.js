// Hamburger toggle
const hamburger = document.querySelector(".hamburger");
const navLinks = document.querySelector(".nav-links");
hamburger.addEventListener("click", () => {
  navLinks.classList.toggle("active");
});

// Smooth scroll for navbar
document.querySelectorAll('nav a').forEach(link => {
  link.addEventListener('click', e => {
    e.preventDefault();
    const target = document.querySelector(link.getAttribute('href'));
    target.scrollIntoView({ behavior: 'smooth' });
    if (navLinks.classList.contains('active')) navLinks.classList.remove('active');
  });
});

// News thumbnail click + Instagram latest
const thumbnailsContainer = document.getElementById("news-thumbnails");
const mainImage = document.getElementById("news-display");

// Instagram 최신 이미지 배열
const instagramImages = [
  "https://www.instagram.com/p/ZDNlZDc0MzIxNw/media/?size=l",
  "https://www.instagram.com/p/XXXXX/media/?size=l",
  "https://www.instagram.com/p/YYYYY/media/?size=l"
];

// 썸네일 생성
instagramImages.forEach(src => {
  const img = document.createElement("img");
  img.src = src;
  img.alt = "News Thumbnail";
  img.addEventListener("click", () => {
    mainImage.src = src;
  });
  thumbnailsContainer.appendChild(img);
});

// 초기 메인 이미지
if (instagramImages.length > 0) mainImage.src = instagramImages[0];
