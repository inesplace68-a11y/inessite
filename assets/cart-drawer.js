/* ============================================================
   Maison Coeur — Tiroir panier (cart drawer)
   Web component <cart-drawer> autonome (Vanilla JS).
   Compatible avec product-form.js (renderContents / setActiveElement).
   ============================================================ */

(function () {
  'use strict';

  const SELECTORS = {
    overlay: '[data-mc-cd-overlay]',
    close: '[data-mc-cd-close]',
    qtyBtn: '[data-mc-cd-qty]',
    qtyValue: '[data-mc-cd-qty-value]',
    remove: '[data-mc-cd-remove]',
    line: '[data-mc-cd-line]',
    lines: '[data-mc-cd-lines]',
    body: '[data-mc-cd-body]',
    footer: '[data-mc-cd-footer]',
    panel: '.mc-cd__panel',
    trigger: '[data-mc-cart-trigger]',
    badge: '[data-mc-cart-count]',
  };

  const FOCUSABLE_SELECTOR = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
  ].join(',');

  function fetchJson() {
    return {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    };
  }

  class CartDrawer extends HTMLElement {
    constructor() {
      super();
      this.activeElement = null;
      this._isOpen = false;
      this._onKeydown = this._onKeydown.bind(this);
      this._onClick = this._onClick.bind(this);
      this._onCartOpen = () => this.open();
      this._onCartClose = () => this.close();
    }

    connectedCallback() {
      this.removeAttribute('hidden');

      this.addEventListener('click', this._onClick);
      document.addEventListener('keydown', this._onKeydown);
      window.addEventListener('cart:open', this._onCartOpen);
      window.addEventListener('cart:close', this._onCartClose);
    }

    disconnectedCallback() {
      this.removeEventListener('click', this._onClick);
      document.removeEventListener('keydown', this._onKeydown);
      window.removeEventListener('cart:open', this._onCartOpen);
      window.removeEventListener('cart:close', this._onCartClose);
    }

    _onClick(event) {
      const target = event.target;

      if (target.closest(SELECTORS.overlay) || target.closest(SELECTORS.close)) {
        event.preventDefault();
        this.close();
        return;
      }

      const qtyBtn = target.closest(SELECTORS.qtyBtn);
      if (qtyBtn) {
        event.preventDefault();
        const direction = qtyBtn.dataset.mcCdQty;
        const lineEl = qtyBtn.closest(SELECTORS.line);
        if (!lineEl) return;
        const idx = parseInt(lineEl.dataset.lineIndex, 10);
        const valueEl = lineEl.querySelector(SELECTORS.qtyValue);
        const current = parseInt((valueEl && valueEl.textContent.trim()) || '0', 10);
        const next = direction === 'increment' ? current + 1 : Math.max(0, current - 1);
        if (next === current) return;
        if (next === 0) {
          this.removeLine(idx, lineEl);
        } else {
          this.changeLine(idx, next, lineEl);
        }
        return;
      }

      const removeBtn = target.closest(SELECTORS.remove);
      if (removeBtn) {
        event.preventDefault();
        const lineEl = removeBtn.closest(SELECTORS.line);
        if (!lineEl) return;
        const idx = parseInt(lineEl.dataset.lineIndex, 10);
        this.removeLine(idx, lineEl);
        return;
      }
    }

    _onKeydown(event) {
      if (!this._isOpen) return;
      if (event.key === 'Escape') {
        event.preventDefault();
        this.close();
        return;
      }
      if (event.key === 'Tab') this._trapFocus(event);
    }

    _trapFocus(event) {
      const panel = this.querySelector(SELECTORS.panel);
      if (!panel) return;
      const focusables = Array.from(panel.querySelectorAll(FOCUSABLE_SELECTOR)).filter(
        (el) => el.offsetParent !== null
      );
      if (focusables.length === 0) {
        event.preventDefault();
        panel.focus();
        return;
      }
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement;
      if (event.shiftKey && (active === first || active === panel)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    }

    /* ----------------------------------------------------------
       Open / Close
       ---------------------------------------------------------- */

    open(triggeredBy) {
      if (triggeredBy) this.activeElement = triggeredBy;
      this._isOpen = true;
      this.classList.add('is-active');
      document.body.classList.add('mc-cd-open');

      const panel = this.querySelector(SELECTORS.panel);
      requestAnimationFrame(() => {
        if (panel) panel.focus({ preventScroll: true });
      });

      window.dispatchEvent(new CustomEvent('cart:opened', { detail: { drawer: this } }));
    }

    close() {
      if (!this._isOpen) return;
      this._isOpen = false;
      this.classList.remove('is-active');
      document.body.classList.remove('mc-cd-open');
      if (this.activeElement && typeof this.activeElement.focus === 'function') {
        try { this.activeElement.focus(); } catch (e) { /* noop */ }
      }
      window.dispatchEvent(new CustomEvent('cart:closed', { detail: { drawer: this } }));
    }

    setActiveElement(element) {
      this.activeElement = element;
    }

    /* ----------------------------------------------------------
       Compatibilité product-form.js (Dawn)
       ---------------------------------------------------------- */

    getSectionsToRender() {
      return [{ id: 'cart-drawer', selector: 'cart-drawer' }];
    }

    renderContents(parsedState) {
      const html = parsedState && parsedState.sections && parsedState.sections['cart-drawer'];
      if (html) this._replaceFromSectionHTML(html);
      this._updateBadge(parsedState.item_count);
      this.classList.toggle('is-empty', parsedState.item_count === 0);
      this.open();
    }

    /* ----------------------------------------------------------
       AJAX cart updates
       ---------------------------------------------------------- */

    changeLine(lineIndex, quantity, lineEl) {
      this._setLineLoading(lineEl, true);
      const body = JSON.stringify({
        line: lineIndex,
        quantity: quantity,
        sections: 'cart-drawer',
        sections_url: window.location.pathname,
      });
      return fetch(`${window.routes.cart_change_url}`, { ...fetchJson(), body })
        .then((response) => response.json())
        .then((parsedState) => {
          if (parsedState.errors) {
            this._announce(parsedState.description || parsedState.message || '');
            return;
          }
          if (parsedState.sections && parsedState.sections['cart-drawer']) {
            this._replaceFromSectionHTML(parsedState.sections['cart-drawer']);
          }
          this._updateBadge(parsedState.item_count);
          this.classList.toggle('is-empty', parsedState.item_count === 0);
          window.dispatchEvent(new CustomEvent('cart:updated', { detail: { cart: parsedState } }));
        })
        .catch((e) => { console.error(e); })
        .finally(() => { this._setLineLoading(lineEl, false); });
    }

    removeLine(lineIndex, lineEl) {
      if (lineEl) {
        lineEl.classList.add('is-removing');
        return new Promise((resolve) => {
          setTimeout(() => {
            this.changeLine(lineIndex, 0, null).then(resolve);
          }, 180);
        });
      }
      return this.changeLine(lineIndex, 0, null);
    }

    /* ----------------------------------------------------------
       DOM helpers
       ---------------------------------------------------------- */

    _replaceFromSectionHTML(htmlString) {
      const doc = new DOMParser().parseFromString(htmlString, 'text/html');
      const incoming = doc.querySelector('cart-drawer');
      if (!incoming) return;

      // Conserver l'état d'ouverture (classe is-active) pendant la mise à jour.
      const wasActive = this.classList.contains('is-active');

      // Remplacer le contenu interne (overlay + panel + style).
      this.innerHTML = incoming.innerHTML;

      // Re-synchroniser les attributs (data-empty, etc.) depuis le markup serveur.
      ['data-empty', 'data-shipping-threshold-enabled', 'data-shipping-threshold-amount']
        .forEach((attr) => {
          const value = incoming.getAttribute(attr);
          if (value != null) this.setAttribute(attr, value);
        });

      this.classList.toggle('is-empty', incoming.dataset.empty === 'true');
      if (wasActive) this.classList.add('is-active');
      this.classList.add('is-ready');

      window.dispatchEvent(new CustomEvent('cart:rendered', { detail: { drawer: this } }));
    }

    _setLineLoading(lineEl, loading) {
      if (!lineEl) return;
      lineEl.classList.toggle('is-loading', !!loading);
      lineEl.querySelectorAll('button').forEach((b) => {
        if (loading) b.setAttribute('disabled', 'disabled');
        else b.removeAttribute('disabled');
      });
    }

    _updateBadge(count) {
      const empty = !count || count === 0;
      document.querySelectorAll(SELECTORS.badge).forEach((el) => {
        el.textContent = empty ? '' : String(count);
        el.dataset.empty = empty ? 'true' : 'false';
      });
    }

    _announce(message) {
      const live = this.querySelector('[data-mc-cd-live]');
      if (!live) return;
      live.textContent = '';
      // Force le re-trigger lecteur d'écran
      requestAnimationFrame(() => { live.textContent = message; });
    }
  }

  if (!customElements.get('cart-drawer')) {
    customElements.define('cart-drawer', CartDrawer);
  }

  /* ============================================================
     Délégation d'événement globale.
     Gère l'ouverture du tiroir indépendamment de l'upgrade du
     custom element : le clic sur n'importe quel [data-mc-cart-trigger]
     déclenche cart:open, peu importe le timing de connectedCallback.
     ============================================================ */
  function openDrawer(trigger) {
    const drawer = document.querySelector('cart-drawer');
    if (!drawer) return;
    if (typeof drawer.open === 'function') {
      drawer.open(trigger);
    } else {
      // Fallback si le custom element n'est pas encore upgradé.
      drawer.classList.add('is-active');
      document.body.classList.add('mc-cd-open');
    }
  }

  document.addEventListener('click', function (event) {
    const trigger = event.target.closest('[data-mc-cart-trigger]');
    if (!trigger) return;
    event.preventDefault();
    openDrawer(trigger);
  });
})();
