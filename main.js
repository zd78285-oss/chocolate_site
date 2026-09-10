/* ═══════════════════════════════════════════════
   ШОКОЛАД · main.js
   - Шапка: тень при скролле + активная ссылка
   - Мобильное меню (бургер)
   - scroll-expand: hero раскрывается при скролле
   - drift-wall: автоскролл колонок + hover-эффект
═══════════════════════════════════════════════ */

(() => {
  'use strict';

  /* ── Утилиты ──────────────────────────────── */
  const qs  = (sel, ctx = document) => ctx.querySelector(sel);
  const qsa = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const lerp  = (a, b, t)   => a + (b - a) * t;

  /* ════════════════════════════════════════════
     1. ШАПКА — тень + активная ссылка
  ════════════════════════════════════════════ */
  const header = qs('.site-header');

  function updateHeader() {
    header.classList.toggle('is-scrolled', window.scrollY > 8);
  }
  window.addEventListener('scroll', updateHeader, { passive: true });
  updateHeader();

  // Подсвечивать активную ссылку по позиции скролла
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

    // Закрывать при клике на ссылку
    qsa('.mobile-nav__link, .mobile-nav__cta').forEach((a) => {
      a.addEventListener('click', () => {
        burger.setAttribute('aria-expanded', 'false');
        mobileNav.hidden = true;
      });
    });

    // Закрывать по Escape
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
  const heroWrap  = qs('.hero-wrap');
  const heroFrame = qs('#hero-frame');
  const heroMedia = qs('#hero-media');
  const heroScrim = qs('#hero-scrim');
  const heroOverlay = qs('#hero-overlay');
  const heroTitle = qs('#hero-title');
  const heroHint  = qs('#hero-hint');

  if (heroFrame && heroMedia) {
    // Начальные значения clip-path
    const CLIP_IN  = { top: 21, right: 29, bottom: 21, left: 29 };
    const CLIP_OUT = { top: 0,  right: 0,  bottom: 0,  left: 0  };
    const RADIUS_IN  = 24;
    const RADIUS_OUT = 0;

    function setHeroProgress(p) {
      // p = 0..1  (0 = свёрнут, 1 = полностью раскрыт)
      const t  = CLIP_IN.top    + (CLIP_OUT.top    - CLIP_IN.top)    * p;
      const r  = CLIP_IN.right  + (CLIP_OUT.right  - CLIP_IN.right)  * p;
      const b  = CLIP_IN.bottom + (CLIP_OUT.bottom - CLIP_IN.bottom) * p;
      const l  = CLIP_IN.left   + (CLIP_OUT.left   - CLIP_IN.left)   * p;
      const rd = RADIUS_IN + (RADIUS_OUT - RADIUS_IN) * p;

      heroFrame.style.clipPath =
        `inset(${t}% ${r}% ${b}% ${l}% round ${rd}px)`;

      // Лёгкое масштабирование фона
      const scale = 1.08 - 0.08 * p;
      heroMedia.style.transform = `scale(${scale})`;

      // Оверлей, скрим
      heroScrim.style.opacity   = String(p * 0.85);
      heroOverlay.style.opacity = String(clamp(p * 2 - 1, 0, 1));

      // Заголовок — исчезает в середине
      const titleOpacity = clamp(1 - p * 2.5, 0, 1);
      heroTitle.style.opacity   = String(titleOpacity);
      heroTitle.style.transform = `translateY(${p * -40}px)`;

      // Подсказка «прокрутите»
      heroHint.style.opacity = String(clamp(1 - p * 5, 0, 1));
    }

    // Отслеживаем скролл страницы — секция hero занимает 100vh
    function onScroll() {
      if (!heroWrap) return;
      const rect = heroWrap.getBoundingClientRect();
      const vh   = window.innerHeight;
      // от 0 (hero сверху) до 1 (hero ушёл за верхний край)
      const raw  = clamp(-rect.top / vh, 0, 1);
      setHeroProgress(raw);
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll(); // инициализация

    // Начальное состояние
    setHeroProgress(0);
  }

  /* ════════════════════════════════════════════
     4. DRIFT-WALL — автоскролл колонок
  ════════════════════════════════════════════ */
  const driftWall  = qs('#driftWall');
  const driftPlane = qs('#driftPlane');

  if (driftWall && driftPlane) {
    const tracks = qsa('.drift-wall__track', driftWall);
    const cols   = qsa('.drift-wall__col', driftWall);

    // Высота одной ячейки с учётом отступа (--dw-tile-h + --dw-gap)
    const TILE_H = 132 + 18;

    // ── 1. Дублируем плитки для бесшовного зацикливания ──
    let originalTilesPerTrack = 0;
    tracks.forEach((track) => {
      const originals = [...track.querySelectorAll('.drift-wall__tile')];
      if (!originalTilesPerTrack) originalTilesPerTrack = originals.length;
      originals.forEach((tile) => {
        const clone = tile.cloneNode(true);
        clone.setAttribute('aria-hidden', 'true');
        clone.removeAttribute('tabindex');           // клон не должен ловить фокус
        track.appendChild(clone);
      });
    });

    // Фиксируем высоту плоскости по исходному набору плиток
    if (originalTilesPerTrack > 0) {
      driftPlane.style.height = `${originalTilesPerTrack * TILE_H}px`;
      driftPlane.style.alignItems = 'flex-start';
    }

    // Центрируем плоскость (без наклона — плоскость ровная, стабильная)
    driftPlane.style.transform = 'translate(-50%, -50%)';
    driftPlane.style.transformOrigin = '50% 50%';

    // ── 2. Пауза колонны при наведении (на уровне колонны целиком) ──
    // Слушаем на .drift-wall__col — площадь стабильная, дребезга нет.
    const paused = cols.map(() => false);
    cols.forEach((col, i) => {
      col.addEventListener('mouseenter', () => { paused[i] = true;  });
      col.addEventListener('mouseleave', () => { paused[i] = false; });
    });

    // ── 3. Автоскролл с бесшовным зацикливанием ──
    const SPEED_FACTOR = 0.07;               // было 0.14 → на 50% медленнее
    const trackOffsets = tracks.map(() => 0);

    const periods = tracks.map((track) => {
      const totalTiles = track.querySelectorAll('.drift-wall__tile').length;
      return (totalTiles / 2) * TILE_H;
    });

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
        if (paused[i]) return;               // ⏸ колонна стоит

        const speed  = parseFloat(track.dataset.speed ?? '1');
        const pixels = speed * SPEED_FACTOR * dt;
        trackOffsets[i] += pixels;

        const period = periods[i];
        if (trackOffsets[i] < 0) {
          trackOffsets[i] += period;
        } else if (trackOffsets[i] >= period) {
          trackOffsets[i] -= period;
        }

        track.style.transform = `translateY(${-trackOffsets[i]}px)`;
      });
    }

    rafId = requestAnimationFrame(tick);

    // Пауза при prefers-reduced-motion
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      cancelAnimationFrame(rafId);
      tracks.forEach((t) => (t.style.transform = 'none'));
    }
  }

  /* ════════════════════════════════════════════
     5. ФОРМА ЗАПИСИ — простая валидация
  ════════════════════════════════════════════ */
  const bookingForm = qs('#bookingForm');
  if (bookingForm) {
    bookingForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const nameEl  = qs('#name',  bookingForm);
      const phoneEl = qs('#phone', bookingForm);

      let ok = true;
      [nameEl, phoneEl].forEach((el) => {
        if (!el.value.trim()) {
          el.style.borderColor = 'oklch(70% 0.15 25)';
          ok = false;
        } else {
          el.style.borderColor = '';
        }
      });

      if (ok) {
        const btn = qs('.form-submit', bookingForm);
        btn.textContent = 'Заявка отправлена ✓';
        btn.disabled = true;
        btn.style.opacity = '0.7';
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
