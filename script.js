(function () {
  const navToggle = document.querySelector('.nav-toggle');
  const navList = document.querySelector('.nav-list');
  const navLinks = document.querySelectorAll('a[href^="#"]');
  const yearSpan = document.getElementById('year');
  const fadeElements = document.querySelectorAll('.fade-in');

  if (yearSpan) {
    yearSpan.textContent = new Date().getFullYear();
  }

  const setBodyNavState = (isOpen) => {
    document.body.classList.toggle('nav-open', isOpen);
    if (navToggle) {
      navToggle.setAttribute('aria-expanded', String(isOpen));
    }
  };

  const closeNavMenu = () => {
    if (navList) {
      navList.classList.remove('open');
    }
    setBodyNavState(false);
  };

  if (navToggle && navList) {
    navToggle.addEventListener('click', () => {
      const expanded = navToggle.getAttribute('aria-expanded') === 'true';
      const willOpen = !expanded;
      setBodyNavState(willOpen);
      navList.classList.toggle('open', willOpen);
    });

    document.addEventListener('click', (event) => {
      if (!navList.classList.contains('open')) {
        return;
      }

      const target = event.target;
      if (
        target instanceof Node &&
        (navList.contains(target) || navToggle.contains(target))
      ) {
        return;
      }

      closeNavMenu();
    });
  }

  navLinks.forEach((link) => {
    link.addEventListener('click', (event) => {
      const targetId = link.getAttribute('href');
      if (targetId && targetId.startsWith('#')) {
        const section = document.querySelector(targetId);
        if (section) {
          event.preventDefault();
          section.scrollIntoView({ behavior: 'smooth' });
          if (navList && navList.classList.contains('open')) {
            closeNavMenu();
          }
        }
      }
    });
  });

  if (navList) {
    window.addEventListener('resize', () => {
      if (window.innerWidth > 768 && navList.classList.contains('open')) {
        closeNavMenu();
      }
    });
  }

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: '0px 0px -10% 0px',
      }
    );

    fadeElements.forEach((el) => observer.observe(el));
  } else {
    fadeElements.forEach((el) => el.classList.add('visible'));
  }

  const projectPage = document.querySelector('.project-page');
  if (projectPage) {
    const projectImages = projectPage.querySelectorAll('img');

    if (projectImages.length) {
      const overlay = document.createElement('div');
      overlay.className = 'lightbox-overlay';
      overlay.setAttribute('role', 'dialog');
      overlay.setAttribute('aria-modal', 'true');
      overlay.setAttribute('aria-hidden', 'true');

      overlay.innerHTML = `
        <div class="lightbox-content">
          <button type="button" class="lightbox-close" aria-label="Close image preview">&times;</button>
          <img class="lightbox-media" alt="" />
          <p class="lightbox-caption"></p>
        </div>
      `;

      document.body.appendChild(overlay);

      const overlayImage = overlay.querySelector('.lightbox-media');
      const overlayCaption = overlay.querySelector('.lightbox-caption');
      const closeButton = overlay.querySelector('.lightbox-close');
      let lastFocusedElement = null;

      const closeOverlay = () => {
        overlay.classList.remove('active');
        overlay.setAttribute('aria-hidden', 'true');
        document.body.style.removeProperty('overflow');
        if (lastFocusedElement) {
          lastFocusedElement.focus();
          lastFocusedElement = null;
        }
      };

      const openOverlay = (image, captionText) => {
        lastFocusedElement = document.activeElement;
        overlayImage.src = image.src;
        overlayImage.alt = image.alt || '';

        if (captionText) {
          overlayCaption.textContent = captionText;
          overlayCaption.hidden = false;
        } else if (image.alt) {
          overlayCaption.textContent = image.alt;
          overlayCaption.hidden = false;
        } else {
          overlayCaption.textContent = '';
          overlayCaption.hidden = true;
        }

        overlay.classList.add('active');
        overlay.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
        closeButton.focus();
      };

      const boundTriggers = new WeakSet();

      const getCaption = (imageEl) => {
        if (!imageEl) {
          return '';
        }

        const figure = imageEl.closest('figure');
        if (figure) {
          const caption = figure.querySelector('figcaption');
          if (caption) {
            return caption.textContent.trim();
          }
        }

        return '';
      };

      const bindTrigger = (trigger, resolveImage, labelSource) => {
        if (!trigger || boundTriggers.has(trigger)) {
          return;
        }

        const sampleImage = labelSource || resolveImage();
        const labelText = sampleImage ? getCaption(sampleImage) || sampleImage.alt : '';

        trigger.classList.add('lightbox-trigger');
        trigger.setAttribute('tabindex', '0');
        trigger.setAttribute('role', 'button');
        trigger.setAttribute('aria-haspopup', 'dialog');
        trigger.setAttribute(
          'aria-label',
          labelText ? `Expand image: ${labelText}` : 'Expand image'
        );

        const handleOpen = (event) => {
          if (event && event.type === 'keydown' && event.key !== 'Enter' && event.key !== ' ') {
            return;
          }

          if (event && event.type === 'keydown') {
            event.preventDefault();
          }

          const imageToShow = resolveImage(event);
          if (!imageToShow) {
            return;
          }

          openOverlay(imageToShow, getCaption(imageToShow));
        };

        trigger.addEventListener('click', handleOpen);
        trigger.addEventListener('keydown', handleOpen);

        if (trigger instanceof HTMLElement) {
          trigger.dataset.lightboxBound = 'true';
        }

        boundTriggers.add(trigger);
      };

      projectImages.forEach((img) => {
        const figure = img.closest('figure');
        const figureImages = figure ? figure.querySelectorAll('img') : null;
        const hasMultipleImages = figureImages ? figureImages.length > 1 : false;

        if (hasMultipleImages) {
          bindTrigger(
            img,
            (event) => {
              if (event && event.currentTarget instanceof HTMLImageElement) {
                return event.currentTarget;
              }
              return img;
            },
            img
          );
          return;
        }

        if (figure) {
          bindTrigger(
            figure,
            () => img,
            img
          );
          return;
        }

        bindTrigger(
          img,
          (event) => {
            if (event && event.currentTarget instanceof HTMLImageElement) {
              return event.currentTarget;
            }
            return img;
          },
          img
        );
      });

      closeButton.addEventListener('click', closeOverlay);

      overlay.addEventListener('click', (event) => {
        if (event.target === overlay) {
          closeOverlay();
        }
      });

      document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && overlay.classList.contains('active')) {
          closeOverlay();
        }
      });
    }
  }
})();
