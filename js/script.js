// Hamburger toggle
const hamburger = document.querySelector(".hamburger");
const navLinks = document.querySelector(".nav-links");

hamburger.addEventListener("click", () => {
  navLinks.classList.toggle("active");
});

// News thumbnail click
const thumbnails = document.querySelectorAll(".news-thumbnails img");
const mainImage = document.getElementById("news-display");

thumbnails.forEach(thumb => {
  thumb.addEventListener("click", () => {
    mainImage.src = thumb.src;
  });
});
