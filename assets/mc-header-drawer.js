(function () {
  var drawer = document.getElementById('mc-hd-drawer');
  if (!drawer) return;

  var panel = drawer.querySelector('.mc-hd-drawer__panel');
  var triggers = document.querySelectorAll('[data-mc-drawer-trigger]');
  var closers = drawer.querySelectorAll('[data-mc-drawer-close]');

  function open() {
    drawer.hidden = false;
    requestAnimationFrame(function () { drawer.classList.add('is-open'); });
    document.body.style.overflow = 'hidden';
    triggers.forEach(function (t) { t.setAttribute('aria-expanded', 'true'); });
    if (panel) panel.focus();
  }

  function close() {
    drawer.classList.remove('is-open');
    document.body.style.overflow = '';
    triggers.forEach(function (t) { t.setAttribute('aria-expanded', 'false'); });
    setTimeout(function () { drawer.hidden = true; }, 300);
  }

  triggers.forEach(function (t) { t.addEventListener('click', open); });
  closers.forEach(function (c) { c.addEventListener('click', close); });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && drawer.classList.contains('is-open')) close();
  });
})();
