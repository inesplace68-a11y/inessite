(function () {
  const triggers = document.querySelectorAll('[data-mc-search-trigger]');
  const drawer = document.getElementById('mc-search-drawer');
  if (!triggers.length || !drawer) return;

  const closes = drawer.querySelectorAll('[data-mc-search-close]');
  const input = drawer.querySelector('.mc-search-form__input');
  const panel = drawer.querySelector('.mc-search-panel');

  function setHeaderOffset() {
    const headerEl = document.querySelector('.mc-hd-wrap');
    if (!headerEl) return;
    headerEl.classList.remove('mc-hd-wrap--hidden');
    drawer.style.setProperty('--mc-header-height', headerEl.offsetHeight + 'px');
  }

  function openDrawer() {
    setHeaderOffset();
    drawer.hidden = false;
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(() => {
      drawer.setAttribute('data-state', 'open');
    });
    setTimeout(() => { if (input) input.focus(); }, 80);
  }

  function closeDrawer() {
    drawer.removeAttribute('data-state');
    document.body.style.overflow = '';
    if (panel) {
      panel.addEventListener('transitionend', () => { drawer.hidden = true; }, { once: true });
    } else {
      drawer.hidden = true;
    }
  }

  triggers.forEach(t => t.addEventListener('click', openDrawer));
  closes.forEach(c => c.addEventListener('click', closeDrawer));
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && !drawer.hidden) closeDrawer();
  });
})();
