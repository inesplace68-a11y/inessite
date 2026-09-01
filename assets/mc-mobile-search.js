/**
 * MC — Recherche mobile inline.
 * La barre crème du header EST le champ de saisie : on tape dedans, les
 * suggestions (requêtes + produits) apparaissent dans un menu déroulant juste
 * en dessous, au fil de la frappe. Aucun overlay, aucune seconde barre.
 * Isolé du drawer desktop (mc-search-drawer.js) : mobile uniquement.
 * Modèle de fetch/rendu identique au drawer pour un comportement cohérent.
 */
(function () {
  const form = document.querySelector('[data-mc-msearch]');
  if (!form) return;

  const input = form.querySelector('[data-mc-msearch-input]');
  const clearBtn = form.querySelector('[data-mc-msearch-clear]');
  const results = form.querySelector('[data-mc-msearch-results]');
  const queriesBlock = form.querySelector('[data-mc-msearch-block="queries"]');
  const productsBlock = form.querySelector('[data-mc-msearch-block="products"]');
  const queriesList = form.querySelector('[data-mc-msearch-queries]');
  const productsList = form.querySelector('[data-mc-msearch-products]');
  if (!input || !results) return;

  const MIN_CHARS = 2;
  const DEBOUNCE_MS = 200;
  const MAX_QUERIES = 3;
  const MAX_PRODUCTS = 6;
  const PREDICTIVE_BASE = (form.dataset.predictiveSearchUrl || '/search/suggest').replace(/\.json$/, '');

  let debounceTimer = null;
  let abortCtrl = null;
  let lastQuery = '';

  const priceFormatter = new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: (window.Shopify && window.Shopify.currency && window.Shopify.currency.active) || 'EUR',
    maximumFractionDigits: 0,
  });

  function syncClearVisibility() {
    if (clearBtn) clearBtn.hidden = !input.value;
  }

  function resetResults() {
    if (queriesList) queriesList.innerHTML = '';
    if (productsList) productsList.innerHTML = '';
    if (queriesBlock) queriesBlock.hidden = true;
    if (productsBlock) productsBlock.hidden = true;
    results.hidden = true;
  }

  function clearInput() {
    input.value = '';
    lastQuery = '';
    if (debounceTimer) { clearTimeout(debounceTimer); debounceTimer = null; }
    if (abortCtrl) { abortCtrl.abort(); abortCtrl = null; }
    resetResults();
    syncClearVisibility();
    input.focus();
  }

  function highlightMatch(text, query) {
    const span = document.createElement('span');
    if (!query) { span.textContent = text; return span; }
    const idx = text.toLowerCase().indexOf(query.toLowerCase());
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

  async function runSearch(query) {
    if (abortCtrl) abortCtrl.abort();
    abortCtrl = new AbortController();
    const signal = abortCtrl.signal;

    const productsUrl = PREDICTIVE_BASE + '.json'
      + '?q=' + encodeURIComponent(query)
      + '&resources[type]=product'
      + '&resources[limit]=' + MAX_PRODUCTS
      + '&resources[options][unavailable_products]=last';
    const queriesUrl = PREDICTIVE_BASE + '.json'
      + '?q=' + encodeURIComponent(query)
      + '&resources[type]=query'
      + '&resources[limit]=' + MAX_QUERIES;

    const fetchResource = (url) => fetch(url, { signal: signal, headers: { 'Accept': 'application/json' } })
      .then(res => (res.ok ? res.json() : null))
      .catch(err => { if (err && err.name === 'AbortError') throw err; return null; });

    let productsData, queriesData;
    try {
      [productsData, queriesData] = await Promise.all([fetchResource(productsUrl), fetchResource(queriesUrl)]);
    } catch (err) {
      if (err && err.name === 'AbortError') return;
      return;
    }

    if (query !== lastQuery) return;

    const productsRes = (productsData && productsData.resources && productsData.resources.results) || {};
    const queriesRes = (queriesData && queriesData.resources && queriesData.resources.results) || {};
    const products = productsRes.products || [];
    const queries = queriesRes.queries || [];

    renderQueries(queries, query);
    renderProducts(products);

    const anyVisible = queries.length > 0 || products.length > 0;
    results.hidden = !anyVisible;
  }

  function onInput() {
    const query = (input.value || '').trim();
    lastQuery = query;
    syncClearVisibility();
    if (debounceTimer) clearTimeout(debounceTimer);
    if (query.length < MIN_CHARS) {
      if (abortCtrl) { abortCtrl.abort(); abortCtrl = null; }
      resetResults();
      return;
    }
    debounceTimer = setTimeout(() => runSearch(query), DEBOUNCE_MS);
  }

  input.addEventListener('input', onInput);
  input.addEventListener('search', onInput);
  // Ré-affiche les suggestions au focus si une requête est déjà saisie.
  input.addEventListener('focus', () => {
    if ((input.value || '').trim().length >= MIN_CHARS && (
      (queriesBlock && !queriesBlock.hidden) || (productsBlock && !productsBlock.hidden)
    )) {
      results.hidden = false;
    }
  });
  if (clearBtn) clearBtn.addEventListener('click', clearInput);

  // Empêche l'affichage permanent : ferme les suggestions au clic extérieur ou Échap.
  document.addEventListener('click', (e) => {
    if (!form.contains(e.target)) results.hidden = true;
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { results.hidden = true; input.blur(); }
  });

  // Soumission : laisse le navigateur naviguer vers /search?q=… (form GET natif).
  form.addEventListener('submit', () => { results.hidden = true; });
})();
