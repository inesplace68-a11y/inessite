if (!customElements.get('product-modal')) {
  customElements.define(
    'product-modal',
    class ProductModal extends ModalDialog {
      constructor() {
        super();
        if (this.classList.contains('product-media-modal--vt')) {
          this.initVerticalThumbnailsMode();
        }
        this.initNavArrows();
        this.initZoomPan();
      }

      initNavArrows() {
        this.querySelectorAll('[data-modal-nav]').forEach((button) => {
          button.addEventListener('click', (event) => {
            event.preventDefault();
            event.stopPropagation();
            this.navigate(button.dataset.modalNav);
          });
          button.addEventListener('pointerup', (event) => event.stopPropagation());
        });
      }

      navigate(direction) {
        const items = Array.from(
          this.querySelectorAll('.product-media-modal__content > [data-media-id]')
        );
        if (items.length < 2) return;
        const activeIndex = items.findIndex((el) =>
          this.classList.contains('product-media-modal--vt')
            ? el.classList.contains('active')
            : el.classList.contains('active') || el === items[0]
        );
        const currentIndex = activeIndex === -1 ? 0 : activeIndex;
        const nextIndex =
          direction === 'next'
            ? (currentIndex + 1) % items.length
            : (currentIndex - 1 + items.length) % items.length;
        const targetId = items[nextIndex].dataset.mediaId;
        this.activateMediaById(targetId);
        const matchingThumb = this.querySelector(
          `.product-media-modal__thumb[data-modal-thumb-target="${targetId}"]`
        );
        if (matchingThumb) this.setActiveThumb(matchingThumb);
        this.resetZoom();
      }

      initZoomPan() {
        this.zoomLevel = parseFloat(this.dataset.modalZoomLevel) || 2.5;
        this.panEnabled = this.dataset.modalPanEnabled !== 'false';
        this.zoomState = { scale: 1, x: 0, y: 0, dragging: false, startX: 0, startY: 0 };

        const content = this.querySelector('.product-media-modal__content');
        if (!content) return;

        content.addEventListener('click', (event) => {
          if (event.target.closest('[data-modal-nav]')) return;
          const img = this.getActiveImage();
          if (!img) return;
          if (event.target !== img && !img.contains(event.target)) return;
          if (this.zoomState.dragMoved) {
            this.zoomState.dragMoved = false;
            return;
          }
          event.preventDefault();
          if (this.zoomState.scale > 1) {
            this.resetZoom();
          } else {
            this.applyZoom(img, event.clientX, event.clientY, this.zoomLevel);
          }
        });

        content.addEventListener('pointerdown', (event) => {
          if (!this.panEnabled || this.zoomState.scale <= 1) return;
          const img = event.target.closest('img');
          if (!img || !img.classList.contains('mc-zoomed')) return;
          event.preventDefault();
          this.zoomState.dragging = true;
          this.zoomState.dragMoved = false;
          this.zoomState.startX = event.clientX - this.zoomState.x;
          this.zoomState.startY = event.clientY - this.zoomState.y;
          img.style.cursor = 'grabbing';
          img.setPointerCapture(event.pointerId);
        });

        content.addEventListener('pointermove', (event) => {
          if (!this.zoomState.dragging) return;
          const img = event.target.closest('img');
          if (!img) return;
          this.zoomState.x = event.clientX - this.zoomState.startX;
          this.zoomState.y = event.clientY - this.zoomState.startY;
          if (Math.abs(this.zoomState.x) > 2 || Math.abs(this.zoomState.y) > 2) {
            this.zoomState.dragMoved = true;
          }
          this.updateZoomTransform(img);
        });

        const endDrag = (event) => {
          if (!this.zoomState.dragging) return;
          this.zoomState.dragging = false;
          const img = event.target.closest('img');
          if (img) img.style.cursor = 'grab';
        };
        content.addEventListener('pointerup', endDrag);
        content.addEventListener('pointercancel', endDrag);
        content.addEventListener('pointerleave', endDrag);

        content.addEventListener('wheel', (event) => {
          const img = event.target.closest('img.mc-zoomed');
          if (!img) return;
          event.preventDefault();
          const delta = event.deltaY > 0 ? -0.25 : 0.25;
          const newScale = Math.min(5, Math.max(1, this.zoomState.scale + delta));
          if (newScale === 1) {
            this.resetZoom();
            return;
          }
          this.zoomState.scale = newScale;
          this.updateZoomTransform(img);
        }, { passive: false });
      }

      applyZoom(img, clientX, clientY, scale) {
        const rect = img.getBoundingClientRect();
        const originX = ((clientX - rect.left) / rect.width) * 100;
        const originY = ((clientY - rect.top) / rect.height) * 100;
        this.zoomState.scale = scale;
        this.zoomState.x = 0;
        this.zoomState.y = 0;
        img.style.transformOrigin = `${originX}% ${originY}%`;
        img.style.cursor = this.panEnabled ? 'grab' : 'zoom-out';
        img.classList.add('mc-zoomed');
        this.updateZoomTransform(img);
      }

      updateZoomTransform(img) {
        img.style.transform = `translate(${this.zoomState.x}px, ${this.zoomState.y}px) scale(${this.zoomState.scale})`;
      }

      getActiveImage() {
        return this.querySelector(
          '.product-media-modal__content > img.active, .product-media-modal__content > .active img'
        );
      }

      resetZoom() {
        const zoomed = this.querySelectorAll('img.mc-zoomed');
        zoomed.forEach((img) => {
          img.style.transform = '';
          img.style.transformOrigin = '';
          img.style.cursor = '';
          img.classList.remove('mc-zoomed');
        });
        this.zoomState = { scale: 1, x: 0, y: 0, dragging: false, startX: 0, startY: 0 };
      }

      initVerticalThumbnailsMode() {
        const content = this.querySelector('.product-media-modal__content');
        if (content) {
          content.addEventListener('pointerup', (event) => {
            event.stopPropagation();
          });
        }

        this.querySelectorAll('.product-media-modal__thumb').forEach((thumb) => {
          thumb.addEventListener('pointerup', (event) => {
            event.stopPropagation();
          });
          thumb.addEventListener('click', (event) => {
            event.preventDefault();
            const targetId = thumb.dataset.modalThumbTarget;
            this.activateMediaById(targetId);
            this.setActiveThumb(thumb);
          });
        });
      }

      activateMediaById(mediaId) {
        const items = this.querySelectorAll('.product-media-modal__content > [data-media-id]');
        items.forEach((el) => el.classList.remove('active'));
        const target = this.querySelector(`.product-media-modal__content > [data-media-id="${mediaId}"]`);
        if (target) {
          target.classList.add('active');
          if (!this.classList.contains('product-media-modal--vt')) {
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
          if (target.nodeName === 'DEFERRED-MEDIA') {
            const tpl = target.querySelector('template');
            if (tpl && tpl.content.querySelector('.js-youtube')) target.loadContent();
          }
        }
      }

      setActiveThumb(activeThumb) {
        this.querySelectorAll('.product-media-modal__thumb').forEach((t) =>
          t.removeAttribute('aria-current')
        );
        if (activeThumb) activeThumb.setAttribute('aria-current', 'true');
      }

      hide() {
        this.resetZoom();
        super.hide();
      }

      show(opener) {
        super.show(opener);
        this.showActiveMedia();

        if (this.classList.contains('product-media-modal--vt')) {
          const openedMediaId = opener && opener.getAttribute('data-media-id');
          if (openedMediaId) {
            const matchingThumb = this.querySelector(
              `.product-media-modal__thumb[data-modal-thumb-target="${openedMediaId}"]`
            );
            this.setActiveThumb(matchingThumb);
          }
        }
      }

      showActiveMedia() {
        this.querySelectorAll(
          `[data-media-id]:not([data-media-id="${this.openedBy.getAttribute('data-media-id')}"])`
        ).forEach((element) => {
          element.classList.remove('active');
        });
        const activeMedia = this.querySelector(`[data-media-id="${this.openedBy.getAttribute('data-media-id')}"]`);
        const activeMediaTemplate = activeMedia.querySelector('template');
        const activeMediaContent = activeMediaTemplate ? activeMediaTemplate.content : null;
        activeMedia.classList.add('active');
        activeMedia.scrollIntoView();

        const container = this.querySelector('[role="document"]');
        container.scrollLeft = (activeMedia.width - container.clientWidth) / 2;

        if (
          activeMedia.nodeName == 'DEFERRED-MEDIA' &&
          activeMediaContent &&
          activeMediaContent.querySelector('.js-youtube')
        )
          activeMedia.loadContent();
      }
    }
  );
}
