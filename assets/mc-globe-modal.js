(function () {
  const triggers = document.querySelectorAll('[data-mc-globe-trigger]');
  const modal = document.getElementById('mc-globe-modal');
  if (!triggers.length || !modal) return;

  const closes = modal.querySelectorAll('[data-mc-globe-close]');

  function openModal() {
    modal.hidden = false;
    document.body.style.overflow = 'hidden';
  }
  function closeModal() {
    modal.hidden = true;
    document.body.style.overflow = '';
  }

  triggers.forEach(t => t.addEventListener('click', openModal));
  closes.forEach(c => c.addEventListener('click', closeModal));
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && !modal.hidden) closeModal();
  });
})();
