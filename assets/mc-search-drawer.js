(function () {
  const triggers = document.querySelectorAll('[data-mc-search-trigger]');
  const drawer = document.getElementById('mc-search-drawer');
  if (!triggers.length || !drawer) return;

  const closes = drawer.querySelectorAll('[data-mc-search-close]');
  const panel = drawer.querySelector('.mc-search-panel');
  const input = drawer.querySelector('.mc-search-form__input');
  const results = drawer.querySelector('[data-mc-search-results]');
  const queriesBlock = drawer.querySelector('[data-mc-search-block="queries"]');
  const productsBlock = drawer.querySelector('[data-mc-search-block="products"]');
  const conciergeBlock = drawer.querySelector('[data-mc-search-block="concierge"]');
  const queriesList = drawer.querySelector('[data-mc-search-queries]');
  const productsList = drawer.querySelector('[data-mc-search-products]');

  const showConcierge = results && results.dataset.showConcierge === 'true';
  const MIN_CHARS = 2;
  const DEBOUNCE_MS = 200;
  const MAX_QUERIES = 3;
  const MAX_PRODUCTS = 6;

  let debounceTimer = null;
  let abortCtrl = null;
  let lastQuery = '';

  const priceFormatter = new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: (window.Shopify && window.Shopify.currency && window.Shopify.currency.active) || 'EUR',
    maximumFractionDigits: 0,
  });

  function setHeaderOffset() {
    const headerEl = document.querySelector('.mc-hd-wrap');
    if (!headerEl) return;
    headerEl.classList.remove('mc-hd-wrap--hidden');
    drawer.style.setProperty('--mc-header-height', headerEl.offsetHeight + 'px');
  }

  function isOpen() {
    return drawer.getAttribute('data-state') === 'open';
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
    if (abortCtrl) { abortCtrl.abort(); abortCtrl = null; }
  }

  function toggleDrawer() {
    if (isOpen()) closeDrawer();
    else openDrawer();
  }

  function resetResults() {
    if (queriesList) queriesList.innerHTML = '';
    if (productsList) productsList.innerHTML = '';
    if (queriesBlock) queriesBlock.hidden = true;
    if (productsBlock) productsBlock.hidden = true;
    if (conciergeBlock) conciergeBlock.hidden = true;
    if (results) results.hidden = true;
  }

  function highlightMatch(text, query) {
    const span = document.createElement('span');
    if (!query) { span.textContent = text; return span; }
    const lowerText = text.toLowerCase();
    const lowerQuery = query.toLowerCase();
    const idx = lowerText.indexOf(lowerQuery);
    if (idx === -1) { span.textContent = text; return span; }
    span.appendChild(document.createTextNode(text.slice(0, idx)));
    const mark = document.createElement('mark');
    mark.textContent = text.slice(idx, idx + query.length);
    span.appendChild(mark);
    span.appendChild(document.createTextNode(text.slice(idx + query.length)));
    return span;
  }

  function formatPrice(rawPrice) {
    if (rawPrice == null || rawPrice === '') return '';
    const num = typeof rawPrice === 'number' ? rawPrice : parseFloat(String(rawPrice).replace(',', '.'));
    if (!isFinite(num)) return '';
    try { return priceFormatter.format(num); }
    catch (e) { return num.toLocaleString('fr-FR') + ' €'; }
  }

  function renderQueries(queries, query) {
    if (!queriesList || !queriesBlock) return;
    queriesList.innerHTML = '';
    if (!queries || !queries.length) { queriesBlock.hidden = true; return; }
    queries.slice(0, MAX_QUERIES).forEach(q => {
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.className = 'mc-search-suggestion';
      a.href = q.url || ('/search?q=' + encodeURIComponent(q.text || ''));
      a.appendChild(highlightMatch(q.text || '', query));
      li.appendChild(a);
      queriesList.appendChild(li);
    });
    queriesBlock.hidden = false;
  }

  function renderProducts(products) {
    if (!productsList || !productsBlock) return;
    productsList.innerHTML = '';
    if (!products || !products.length) { productsBlock.hidden = true; return; }
    products.slice(0, MAX_PRODUCTS).forEach(p => {
      const li = document.createElement('li');
      li.className = 'mc-search-product';

      const a = document.createElement('a');
      a.className = 'mc-search-product__link';
      a.href = p.url || '#';

      const imgWrap = document.createElement('span');
      imgWrap.className = 'mc-search-product__image';
      if (p.image) {
        const img = document.createElement('img');
        img.src = p.image;
        img.alt = p.title || '';
        img.loading = 'lazy';
        imgWrap.appendChild(img);
      }

      const body = document.createElement('span');
      body.className = 'mc-search-product__body';
      const title = document.createElement('span');
      title.className = 'mc-search-product__title';
      title.textContent = p.title || '';
      body.appendChild(title);

      const metaText = (p.product_type && p.product_type.trim()) || (p.vendor && p.vendor.trim()) || '';
      if (metaText) {
        const meta = document.createElement('span');
        meta.className = 'mc-search-product__meta';
        meta.textContent = metaText;
        body.appendChild(meta);
      }

      const price = document.createElement('span');
      price.className = 'mc-search-product__price';
      price.textContent = formatPrice(p.price);

      a.appendChild(imgWrap);
      a.appendChild(body);
      a.appendChild(price);
      li.appendChild(a);
      productsList.appendChild(li);
    });
    productsBlock.hidden = false;
  }

  function showNoResults() {
    if (!showConcierge || !conciergeBlock) {
      if (results) results.hidden = true;
      return;
    }
    conciergeBlock.hidden = false;
    if (results) results.hidden = false;
  }

  async function runSearch(query) {
    if (abortCtrl) abortCtrl.abort();
    abortCtrl = new AbortController();
    const url = '/search/suggest.json'
      + '?q=' + encodeURIComponent(query)
      + '&resources[type]=product,query'
      + '&resources[limit]=' + MAX_PRODUCTS
      + '&resources[options][unavailable_products]=last'
      + '&resources[options][fields]=title,product_type,vendor,tags';
    try {
      const res = await fetch(url, { signal: abortCtrl.signal, headers: { 'Accept': 'application/json' } });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const data = await res.json();
      if (query !== lastQuery) return;
      const r = (data && data.resources && data.resources.results) || {};
      const queries = r.queries || [];
      const products = r.products || [];

      renderQueries(queries, query);
      renderProducts(products);

      if (queries.length === 0 && products.length === 0) {
        showNoResults();
      } else if (conciergeBlock) {
        conciergeBlock.hidden = true;
      }

      if (results) {
        const anyVisible = (queries.length > 0) || (products.length > 0) || (showConcierge && queries.length === 0 && products.length === 0);
        results.hidden = !anyVisible;
      }
    } catch (err) {
      if (err.name === 'AbortError') return;
      console.warn('[mc-search] suggest error', err);
    }
  }

  function onInput() {
    const query = (input.value || '').trim();
    lastQuery = query;
    if (debounceTimer) clearTimeout(debounceTimer);
    if (query.length < MIN_CHARS) {
      if (abortCtrl) { abortCtrl.abort(); abortCtrl = null; }
      resetResults();
      return;
    }
    debounceTimer = setTimeout(() => runSearch(query), DEBOUNCE_MS);
  }

  triggers.forEach(t => t.addEventListener('click', toggleDrawer));
  closes.forEach(c => c.addEventListener('click', closeDrawer));
  if (input) input.addEventListener('input', onInput);

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && !drawer.hidden) closeDrawer();
  });
})();
