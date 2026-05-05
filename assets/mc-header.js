(function() {
  'use strict';

  const header = document.querySelector('.mc-hd-wrap');
  if (!header) return;

  let lastScrollY = window.scrollY;
  let ticking = false;
  const threshold = 80;

  function update() {
    const currentScrollY = window.scrollY;

    if (currentScrollY < threshold) {
      header.classList.remove('mc-hd-wrap--hidden');
      lastScrollY = currentScrollY;
      ticking = false;
      return;
    }

    if (currentScrollY > lastScrollY) {
      header.classList.add('mc-hd-wrap--hidden');
    } else if (currentScrollY < lastScrollY) {
      header.classList.remove('mc-hd-wrap--hidden');
    }

    lastScrollY = currentScrollY;
    ticking = false;
  }

  window.addEventListener('scroll', function() {
    if (!ticking) {
      window.requestAnimationFrame(update);
      ticking = true;
    }
  }, { passive: true });
})();
