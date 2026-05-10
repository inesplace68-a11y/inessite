(function () {
  'use strict';

  var STORAGE_KEY = 'mc_wishlist';
  var PULSE_MS = 400;

  /* ---------- Storage ---------- */
  function read() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      var parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  }

  function write(list) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    } catch (e) { /* quota / private mode : silent */ }
  }

  function indexOfId(list, id) {
    for (var i = 0; i < list.length; i++) {
      if (String(list[i].id) === String(id)) return i;
    }
    return -1;
  }

  function snapshotFromButton(btn) {
    return {
      id: btn.getAttribute('data-product-id'),
      handle: btn.getAttribute('data-product-handle'),
      title: btn.getAttribute('data-product-title'),
      image: btn.getAttribute('data-product-image'),
      price: btn.getAttribute('data-product-price'),
      url: btn.getAttribute('data-product-url')
    };
  }

  /* ---------- Visual sync ---------- */
  function syncHeartButtons(list) {
    var ids = {};
    for (var i = 0; i < list.length; i++) ids[String(list[i].id)] = true;
    var btns = document.querySelectorAll('[data-mc-heart]');
    btns.forEach(function (btn) {
      var pid = btn.getAttribute('data-product-id');
      var active = !!ids[String(pid)];
      btn.setAttribute('data-active', active ? 'true' : 'false');
      btn.setAttribute('aria-pressed', active ? 'true' : 'false');
      btn.setAttribute(
        'aria-label',
        active ? 'Retirer des favoris' : 'Ajouter aux favoris'
      );
    });
  }

  function syncHeaderHeart(list) {
    var headerHeart = document.querySelector('[data-mc-header-heart]');
    if (!headerHeart) return;
    headerHeart.setAttribute('data-active', list.length > 0 ? 'true' : 'false');
  }

  function pulse(el) {
    if (!el) return;
    el.classList.remove('is-pulsing');
    // force reflow for restart
    void el.offsetWidth;
    el.classList.add('is-pulsing');
    setTimeout(function () { el.classList.remove('is-pulsing'); }, PULSE_MS);
  }

  /* ---------- Toggle ---------- */
  function toggle(btn) {
    var snapshot = snapshotFromButton(btn);
    if (!snapshot.id) return;
    var list = read();
    var idx = indexOfId(list, snapshot.id);
    if (idx >= 0) {
      list.splice(idx, 1);
    } else {
      list.push(snapshot);
    }
    write(list);
    syncHeartButtons(list);
    syncHeaderHeart(list);
    pulse(btn);
    var headerHeart = document.querySelector('[data-mc-header-heart]');
    if (headerHeart) pulse(headerHeart);
    renderFavorisPage(list);
  }

  /* ---------- Page /pages/favoris ---------- */
  function escapeHtml(str) {
    if (str == null) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function buildCardHtml(item) {
    var imgHtml = item.image
      ? '<img src="' + escapeHtml(item.image) + '" alt="' + escapeHtml(item.title) + '" loading="lazy" class="motion-reduce">'
      : '';
    return (
      '<li class="grid__item">' +
        '<div class="card-wrapper product-card-wrapper underline-links-hover" data-product-id="' + escapeHtml(item.id) + '">' +
          '<button type="button" class="mc-product-heart mc-product-heart--card" ' +
            'data-mc-heart ' +
            'data-product-id="' + escapeHtml(item.id) + '" ' +
            'data-product-handle="' + escapeHtml(item.handle) + '" ' +
            'data-product-title="' + escapeHtml(item.title) + '" ' +
            'data-product-image="' + escapeHtml(item.image) + '" ' +
            'data-product-price="' + escapeHtml(item.price) + '" ' +
            'data-product-url="' + escapeHtml(item.url) + '" ' +
            'data-active="true" aria-pressed="true" aria-label="Retirer des favoris">' +
            '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
              'stroke-width="0.85" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' +
              '<path d="M12 20.5s-7.5-4.8-9.5-10C1 6 5.5 2.5 9 4.5c1.3.7 2.4 1.8 3 3 .6-1.2 1.7-2.3 3-3 3.5-2 8 1.5 6.5 6-2 5.2-9.5 10-9.5 10z"/>' +
            '</svg>' +
          '</button>' +
          '<div class="card card--standard card--media">' +
            '<div class="card__inner ratio" style="--ratio-percent: 100%;">' +
              '<div class="card__media">' +
                '<div class="media media--transparent media--hover-effect">' + imgHtml + '</div>' +
              '</div>' +
            '</div>' +
            '<div class="card__content">' +
              '<div class="card__information">' +
                '<h3 class="card__heading h5">' +
                  '<a href="' + escapeHtml(item.url) + '" class="full-unstyled-link">' + escapeHtml(item.title) + '</a>' +
                '</h3>' +
                '<div class="card-information">' +
                  '<div class="price">' +
                    '<div class="price__container">' +
                      '<div class="price__regular">' +
                        '<span class="price-item price-item--regular">' + escapeHtml(item.price) + '</span>' +
                      '</div>' +
                    '</div>' +
                  '</div>' +
                '</div>' +
              '</div>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</li>'
    );
  }

  function renderFavorisPage(list) {
    var root = document.querySelector('[data-mc-favoris-root]');
    if (!root) return;

    var emptyEl = root.querySelector('[data-mc-favoris-empty]');
    var gridWrap = root.querySelector('[data-mc-favoris-grid-wrap]');
    var gridEl = root.querySelector('[data-mc-favoris-grid]');
    var countEl = root.querySelector('[data-mc-favoris-count]');

    if (list.length === 0) {
      if (emptyEl) emptyEl.hidden = false;
      if (gridWrap) gridWrap.hidden = true;
      if (countEl) { countEl.hidden = true; countEl.textContent = ''; }
      return;
    }

    if (emptyEl) emptyEl.hidden = true;
    if (gridWrap) gridWrap.hidden = false;
    if (countEl) {
      countEl.hidden = false;
      countEl.textContent = list.length + (list.length > 1 ? ' pièces' : ' pièce');
    }

    if (gridEl) {
      var html = '';
      for (var i = 0; i < list.length; i++) html += buildCardHtml(list[i]);
      gridEl.innerHTML = html;
    }
  }

  /* ---------- Init ---------- */
  function init() {
    var list = read();
    syncHeartButtons(list);
    syncHeaderHeart(list);
    renderFavorisPage(list);

    document.addEventListener('click', function (e) {
      var btn = e.target.closest && e.target.closest('[data-mc-heart]');
      if (!btn) return;
      e.preventDefault();
      e.stopPropagation();
      toggle(btn);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
