if (!customElements.get('product-modal')) {
  customElements.define(
    'product-modal',
    class ProductModal extends ModalDialog {
      constructor() {
        super();
        if (this.classList.contains('product-media-modal--vt')) {
          this.initVerticalThumbnailsMode();
        }
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
