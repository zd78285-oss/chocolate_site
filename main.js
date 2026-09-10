/* ═══════════════════════════════════════════════
   ШОКОЛАД · main.js
═══════════════════════════════════════════════ */

(() => {
  'use strict';

  const qs  = (sel, ctx = document) => ctx.querySelector(sel);
  const qsa = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const lerp  = (a, b, t)   => a + (b - a) * t;

  /* ════════════════════════════════════════════
     1. ШАПКА
  ════════════════════════════════════════════ */
  const header = qs('.site-header');

  function updateHeader() {
    if (!header) return;
    header.classList.toggle('is-scrolled', window.scrollY > 8);
  }
  window.addEventListener('scroll', updateHeader, { passive: true });
  updateHeader();

  const sections = qsa('section[id]');
  const navLinks  = qsa('.nav__link');

  const sectionObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const id = entry.target.id;
          navLinks.forEach((a) => {
            a.classList.toggle('is-active', a.getAttribute('href') === `#${id}`);
          });
        }
      });
    },
    { rootMargin: '-40% 0px -55% 0px' }
  );
  sections.forEach((s) => sectionObserver.observe(s));

  /* ════════════════════════════════════════════
     2. МОБИЛЬНОЕ МЕНЮ
  ════════════════════════════════════════════ */
  const burger    = qs('.burger');
  const mobileNav = qs('.mobile-nav');

  if (burger && mobileNav) {
    burger.addEventListener('click', () => {
      const open = burger.getAttribute('aria-expanded') === 'true';
      burger.setAttribute('aria-expanded', String(!open));
      mobileNav.hidden = open;
    });

    qsa('.mobile-nav__link, .mobile-nav__cta').forEach((a) => {
      a.addEventListener('click', () => {
        burger.setAttribute('aria-expanded', 'false');
        mobileNav.hidden = true;
      });
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && burger.getAttribute('aria-expanded') === 'true') {
        burger.setAttribute('aria-expanded', 'false');
        mobileNav.hidden = true;
        burger.focus();
      }
    });
  }

  /* ════════════════════════════════════════════
     3. SCROLL-EXPAND — Hero
  ════════════════════════════════════════════ */
  const heroWrap    = qs('.hero-wrap');
  const heroFrame   = qs('#hero-frame');
  const heroMedia   = qs('#hero-media');
  const heroScrim   = qs('#hero-scrim');
  const heroOverlay = qs('#hero-overlay');
  const heroTitle   = qs('#hero-title');
  const heroHint    = qs('#hero-hint');

  if (heroWrap && heroFrame && heroMedia) {
    const CLIP_IN  = { top: 21, right: 29, bottom: 21, left: 29 };
    const CLIP_OUT = { top: 0,  right: 0,  bottom: 0,  left: 0  };
    const RADIUS_IN  = 24;
    const RADIUS_OUT = 0;

    function setHeroProgress(p) {
      const t  = CLIP_IN.top    + (CLIP_OUT.top    - CLIP_IN.top)    * p;
      const r  = CLIP_IN.right  + (CLIP_OUT.right  - CLIP_IN.right)  * p;
      const b  = CLIP_IN.bottom + (CLIP_OUT.bottom - CLIP_IN.bottom) * p;
      const l  = CLIP_IN.left   + (CLIP_OUT.left   - CLIP_IN.left)   * p;
      const rd = RADIUS_IN + (RADIUS_OUT - RADIUS_IN) * p;

      heroFrame.style.clipPath =
        `inset(${t}% ${r}% ${b}% ${l}% round ${rd}px)`;

      const scale = 1.08 - 0.08 * p;
      heroMedia.style.transform = `scale(${scale})`;

      if (heroScrim)   heroScrim.style.opacity   = String(p * 0.85);
      if (heroOverlay) heroOverlay.style.opacity = String(clamp(p * 2 - 1, 0, 1));

      if (heroTitle) {
        const titleOpacity = clamp(1 - p * 2.5, 0, 1);
        heroTitle.style.opacity   = String(titleOpacity);
        heroTitle.style.transform = `translateY(${p * -40}px)`;
      }
      if (heroHint) heroHint.style.opacity = String(clamp(1 - p * 5, 0, 1));
    }

    function onScroll() {
      const rect = heroWrap.getBoundingClientRect();
      const vh   = window.innerHeight;
      const raw  = clamp(-rect.top / vh, 0, 1);
      setHeroProgress(raw);
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    setHeroProgress(0);
  }

  /* ════════════════════════════════════════════
     4. DRIFT-WALL
  ════════════════════════════════════════════ */
  const driftWall  = qs('#driftWall');
  const driftPlane = qs('#driftPlane');

  if (driftWall && driftPlane) {
    const tracks = qsa('.drift-wall__track', driftWall);
    const cols   = qsa('.drift-wall__col', driftWall);

    function readTileH() {
      const cs = getComputedStyle(driftWall);
      const h = parseFloat(cs.getPropertyValue('--dw-tile-h')) || 225;
      const g = parseFloat(cs.getPropertyValue('--dw-gap'))     || 20;
      return h + g;
    }
    let TILE_H = readTileH();

    // Дублируем плитки для бесшовного зацикливания
    let originalTilesPerTrack = 0;
    tracks.forEach((track) => {
      const originals = [...track.querySelectorAll('.drift-wall__tile')];
      if (!originalTilesPerTrack) originalTilesPerTrack = originals.length;
      originals.forEach((tile) => {
        const clone = tile.cloneNode(true);
        clone.setAttribute('aria-hidden', 'true');
        clone.removeAttribute('tabindex');
        track.appendChild(clone);
      });
    });

    if (originalTilesPerTrack > 0) {
      driftPlane.style.height = `${originalTilesPerTrack * TILE_H}px`;
      driftPlane.style.alignItems = 'flex-start';
    }

    // Центрируем плоскость
    driftPlane.style.transform = 'translate(-50%, -50%)';
    driftPlane.style.transformOrigin = '50% 50%';

    // Пауза колонны при наведении
    const paused = cols.map(() => false);
    cols.forEach((col, i) => {
      col.addEventListener('mouseenter', () => { paused[i] = true;  });
      col.addEventListener('mouseleave', () => { paused[i] = false; });
    });

    const SPEED_FACTOR = 0.07;
    const trackOffsets = tracks.map(() => 0);
    const periods      = tracks.map(() => 0);

    function recalcPeriods() {
      tracks.forEach((track, i) => {
        const totalTiles = track.querySelectorAll('.drift-wall__tile').length;
        periods[i] = (totalTiles / 2) * TILE_H;
      });
      if (originalTilesPerTrack > 0) {
        driftPlane.style.height = `${originalTilesPerTrack * TILE_H}px`;
      }
    }
    recalcPeriods();

    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        TILE_H = readTileH();
        recalcPeriods();
        trackOffsets.forEach((_, i) => { trackOffsets[i] = 0; });
      }, 150);
    }, { passive: true });

    let isVisible = false;
    const wallObserver = new IntersectionObserver(
      ([entry]) => { isVisible = entry.isIntersecting; },
      { threshold: 0.1 }
    );
    wallObserver.observe(driftWall);

    let lastTime = null;
    let rafId;

    function tick(now) {
      rafId = requestAnimationFrame(tick);
      if (!isVisible) return;

      const dt = lastTime ? Math.min(now - lastTime, 50) : 16;
      lastTime = now;

      tracks.forEach((track, i) => {
        if (paused[i]) return;

        const speed  = parseFloat(track.dataset.speed ?? '1');
        const pixels = speed * SPEED_FACTOR * dt;
        trackOffsets[i] += pixels;

        const period = periods[i] || 1;
        if (trackOffsets[i] < 0) {
          trackOffsets[i] += period;
        } else if (trackOffsets[i] >= period) {
          trackOffsets[i] -= period;
        }

        track.style.transform = `translateY(${-trackOffsets[i]}px)`;
      });
    }

    rafId = requestAnimationFrame(tick);

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      cancelAnimationFrame(rafId);
      tracks.forEach((t) => (t.style.transform = 'none'));
    }
  }

  /* ════════════════════════════════════════════
     5. ФОРМА ЗАПИСИ
  ════════════════════════════════════════════ */
  const bookingForm = qs('#bookingForm');
  if (bookingForm) {
    bookingForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const nameEl  = qs('#name',  bookingForm);
      const phoneEl = qs('#phone', bookingForm);

      let ok = true;
      [nameEl, phoneEl].forEach((el) => {
        if (!el || !el.value.trim()) {
          if (el) el.style.borderColor = 'oklch(70% 0.15 25)';
          ok = false;
        } else {
          el.style.borderColor = '';
        }
      });

      if (ok) {
        const btn = qs('.form-submit', bookingForm);
        if (btn) {
          btn.textContent = 'Заявка отправлена ✓';
          btn.disabled = true;
          btn.style.opacity = '0.7';
        }
      }
    });
  }

  /* ════════════════════════════════════════════
     6. ПЛАВНЫЙ СКРОЛЛ ПО ЯКОРЯМ
  ════════════════════════════════════════════ */
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const id = a.getAttribute('href').slice(1);
    const target = id ? document.getElementById(id) : document.body;
    if (!target) return;
    e.preventDefault();
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

})();