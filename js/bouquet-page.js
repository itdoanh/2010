/* ==========================================================================
   js/bouquet-page.js
   ==========================================================================
   Trang điều khiển UI cho bouquet-stage.html:
   - Theme picker (4 themes)
   - Toggle 3 hiệu ứng (breeze, lights, petals)
   - Thiệp chúc (input + sample button)
   - Shuffle button + day-of-year hint
   - Canvas effects: cánh hoa rơi, spark burst khi click hoa
   - Click bloom-all button (nếu có)
   ========================================================================== */

(function () {
  'use strict';

  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  const SAMPLE_WISHES = [
    "Gửi ngàn lời yêu thương & rạng rỡ nhất!",
    "Chúc bạn luôn xinh đẹp & rạng ngời như đóa hoa này!",
    "Chúc mừng ngày 20/10! Luôn ngập tràn hạnh phúc nhé 💖",
    "Cảm ơn vì đã luôn dịu dàng và ấm áp bên nhau 🌸",
    "Mỗi ngày trôi qua đều là một mùa hoa nở rộ niềm vui!"
  ];
  let wishIndex = 0;

  /* ============================================================
     PANEL OPEN/CLOSE
     ============================================================ */
  const panel = $('#config-panel');
  const overlay = $('#panel-overlay');
  const fab = $('#btn-config-toggle');
  const closeBtn = $('#btn-config-close');

  function openPanel() {
    panel.classList.remove('hidden');
    overlay.classList.remove('hidden');
  }
  function closePanel() {
    panel.classList.add('hidden');
    overlay.classList.add('hidden');
  }

  if (fab) fab.addEventListener('click', openPanel);
  if (closeBtn) closeBtn.addEventListener('click', closePanel);
  if (overlay) overlay.addEventListener('click', closePanel);

  // ESC to close
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closePanel();
  });

  /* ============================================================
     THEME BUTTONS
     ============================================================ */
  const themeButtons = $$('.theme-btn');
  themeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const key = btn.getAttribute('data-theme');
      if (!key) return;

      // Visual selection
      themeButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      // Apply theme
      if (window.BouquetEngine) BouquetEngine.setTheme(key);
    });
  });

  /* ============================================================
     TOGGLES
     ============================================================ */
  const tBreeze = $('#toggle-breeze');
  const tLice = $('#toggle-lights');
  const tPetals = $('#toggle-petals');

  if (tBreeze) {
    tBreeze.addEventListener('change', () => {
      BouquetEngine.setBreeze(tBreeze.checked);
    });
  }
  if (tLice) {
    tLice.addEventListener('change', () => {
      BouquetEngine.setLights(tLice.checked);
    });
  }
  if (tPetals) {
    tPetals.addEventListener('change', () => {
      BouquetEngine.setPetals(tPetals.checked);
    });
  }

  /* ============================================================
     WISH INPUT
     ============================================================ */
  const wishInput = $('#card-input');
  const wishDisplay = $('#card-display-text');

  if (wishInput && wishDisplay) {
    function updateWish() {
      const v = wishInput.value.trim();
      if (v) wishDisplay.textContent = v;
    }
    wishInput.addEventListener('input', updateWish);
    wishInput.addEventListener('change', updateWish);
  }

  const btnSample = $('#btn-sample-wish');
  if (btnSample) {
    btnSample.addEventListener('click', () => {
      wishIndex = (wishIndex + 1) % SAMPLE_WISHES.length;
      const w = SAMPLE_WISHES[wishIndex];
      wishInput.value = w;
      wishDisplay.textContent = w;
    });
  }

  // Click card to randomize
  const card = $('#floating-card');
  if (card) {
    card.addEventListener('click', () => {
      btnSample && btnSample.click();
    });
  }

  /* ============================================================
     SHUFFLE BUTTON
     ============================================================ */
  const btnShuffle = $('#btn-shuffle');
  const bouquetIndexEl = $('#bouquet-index');

  function updateIndexHint() {
    if (!bouquetIndexEl) return;
    const seed = BouquetEngine.getCurrentSeed();
    bouquetIndexEl.textContent = String(Math.abs(seed) % 999 + 1);
  }
  updateIndexHint();

  if (btnShuffle) {
    btnShuffle.addEventListener('click', () => {
      BouquetEngine.shuffle();
      updateIndexHint();
      // burst từ giữa bouquet
      window.dispatchEvent(new CustomEvent('flower-burst', {
        detail: { x: window.innerWidth / 2, y: window.innerHeight / 2, themeKey: BouquetEngine.getCurrentTheme(), big: true }
      }));
    });
  }

  /* ============================================================
     BLOOM ALL BUTTON (nếu có)
     ============================================================ */
  const btnBloomAll = $('#btn-bloom-all');
  if (btnBloomAll) {
    btnBloomAll.addEventListener('click', () => {
      const flowers = document.querySelectorAll('.flower-hit .flower-anim');
      flowers.forEach((anim, i) => {
        setTimeout(() => {
          anim.classList.remove('bloom-active');
          void anim.offsetWidth;
          anim.classList.add('bloom-active');
        }, i * 60);
      });
      // big burst
      window.dispatchEvent(new CustomEvent('flower-burst', {
        detail: { x: window.innerWidth / 2, y: window.innerHeight / 2, themeKey: BouquetEngine.getCurrentTheme(), big: true }
      }));
    });
  }

  /* ============================================================
     CANVAS: cánh hoa rơi + firework bursts
     ============================================================ */
  const canvas = $('#fx-canvas');
  const ctx = canvas ? canvas.getContext('2d') : null;
  let fallingPetals = [];
  let burstParticles = [];
  let petalsEnabled = true;

  function resizeCanvas() {
    if (!canvas) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  // Petal factory
  function createFallingPetal(randomY = false) {
    const theme = BouquetEngine.THEMES[BouquetEngine.getCurrentTheme()];
    const colors = theme.petalFall || ['#fbcfe8'];
    return {
      x: Math.random() * canvas.width,
      y: randomY ? Math.random() * canvas.height : -25,
      size: 7 + Math.random() * 9,
      speedY: 0.7 + Math.random() * 1.3,
      speedX: -0.5 + Math.random() * 1.2,
      angle: Math.random() * Math.PI * 2,
      spin: (Math.random() - 0.5) * 0.03,
      swayAmp: 0.4 + Math.random() * 0.8,
      swayStep: Math.random() * 100,
      color: colors[Math.floor(Math.random() * colors.length)],
      opacity: 0.55 + Math.random() * 0.35
    };
  }
  for (let i = 0; i < 28; i++) fallingPetals.push(createFallingPetal(true));

  // Burst factory
  function spawnSparkleBurst(clientX, clientY, big = false) {
    const theme = BouquetEngine.THEMES[BouquetEngine.getCurrentTheme()];
    const colors = (theme.petalFall || []).concat(['#fde047', '#ffffff', '#fb7185']);
    const count = big ? 50 : 22;
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.3;
      const speed = (big ? 3 : 2) + Math.random() * 5.5;
      burstParticles.push({
        x: clientX,
        y: clientY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - (big ? 2 : 1),
        size: 4 + Math.random() * 5,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 1,
        decay: 0.018 + Math.random() * 0.015,
        gravity: 0.06
      });
    }
  }

  window.addEventListener('flower-burst', (e) => {
    if (e.detail) spawnSparkleBurst(e.detail.x, e.detail.y, e.detail.big);
  });

  window.addEventListener('petals-toggle', (e) => {
    petalsEnabled = e.detail;
  });

  // Render loop
  function animate() {
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Falling petals
    if (petalsEnabled) {
      for (let i = fallingPetals.length - 1; i >= 0; i--) {
        const p = fallingPetals[i];
        p.swayStep += 1;
        p.x += p.speedX + Math.sin(p.swayStep * 0.012) * p.swayAmp;
        p.y += p.speedY;
        p.angle += p.spin;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.angle);
        ctx.globalAlpha = p.opacity;
        // Draw petal shape
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.ellipse(0, 0, p.size * 0.55, p.size, 0, 0, Math.PI * 2);
        ctx.fill();
        // Highlight
        ctx.fillStyle = 'rgba(255,255,255,0.55)';
        ctx.beginPath();
        ctx.ellipse(-p.size * 0.18, -p.size * 0.25, p.size * 0.2, p.size * 0.4, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        if (p.y > canvas.height + 30) {
          fallingPetals.splice(i, 1);
          fallingPetals.push(createFallingPetal(false));
        }
      }
    }

    // Burst particles
    for (let i = burstParticles.length - 1; i >= 0; i--) {
      const b = burstParticles[i];
      b.x += b.vx;
      b.y += b.vy;
      b.vy += b.gravity;
      b.alpha -= b.decay;

      if (b.alpha <= 0) {
        burstParticles.splice(i, 1);
        continue;
      }

      ctx.save();
      ctx.globalAlpha = b.alpha;
      ctx.fillStyle = b.color;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    requestAnimationFrame(animate);
  }
  animate();

})();