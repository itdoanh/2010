/* ==========================================================================
   js/main.js — SIMPLIFIED
   Controller chính cho trang Chúc Mừng 20/10:
   - Splash timer (3s → stage 2)
   - Petal rain animation
   - Sparkle layer
   - Stage navigation
   - Recipient name input sync
   ========================================================================== */

(function () {
  'use strict';

  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  function rand(min, max) { return Math.random() * (max - min) + min; }

  // ============================================================
  // 1. PETAL RAIN — cánh hoa rơi liên tục trên toàn trang
  // ============================================================
  const PETAL_TYPES = ['rose', 'tulip', 'peach', 'gold', 'white', 'lavender'];
  function startPetalRain() {
    const layer = $('#petals-layer');
    if (!layer) return;

    let activePetals = 0;
    const MAX = 40;

    function spawnPetal() {
      if (activePetals >= MAX || document.hidden) return;

      const type = PETAL_TYPES[Math.floor(Math.random() * PETAL_TYPES.length)];
      const p = document.createElement('div');
      p.className = `petal petal-${type}`;

      const startX = Math.random() * window.innerWidth;
      const duration = 8 + Math.random() * 12;
      const drift = (Math.random() - 0.5) * 200;
      const size = 0.6 + Math.random() * 0.7;
      const delay = Math.random() * 2;

      p.style.left = startX + 'px';
      p.style.transform = `scale(${size})`;
      p.style.setProperty('--drift', `${drift}px`);
      p.style.animationDuration = `${duration}s`;
      p.style.animationDelay = `${delay}s`;
      p.style.opacity = 0.7 + Math.random() * 0.3;
      p.style.filter = `drop-shadow(0 1px 2px rgba(0,0,0,0.15)) hue-rotate(${Math.floor(Math.random() * 40 - 20)}deg)`;

      layer.appendChild(p);
      activePetals++;

      p.addEventListener('animationend', () => {
        p.remove();
        activePetals--;
      });
    }

    for (let i = 0; i < 20; i++) {
      setTimeout(spawnPetal, i * 200);
    }
    setInterval(spawnPetal, 350);
  }

  // ============================================================
  // 2. SPARKLE LAYER — sao tỏa sáng background
  // ============================================================
  function startSparkleLayer() {
    const layer = $('#sparkles-layer');
    if (!layer) return;

    function spawnSparkle() {
      const s = document.createElement('div');
      s.className = 'sparkle';
      s.style.left = Math.random() * 100 + 'vw';
      s.style.top = Math.random() * 100 + 'vh';
      s.style.animationDelay = Math.random() * 2 + 's';
      s.style.animationDuration = 1.8 + Math.random() * 1.6 + 's';

      const size = 4 + Math.random() * 6;
      s.style.width = size + 'px';
      s.style.height = size + 'px';

      layer.appendChild(s);

      setTimeout(() => s.remove(), 4500);
    }

    setInterval(spawnSparkle, 400);
    for (let i = 0; i < 15; i++) {
      setTimeout(spawnSparkle, i * 100);
    }
  }

  // ============================================================
  // 3. BACKGROUND FLOWERS — 5-7 hoa nền góc
  // ============================================================
  function addBackgroundFlowers() {
    const layer = $('.bg-flowers');
    if (!layer) return;
    const positions = [
      { top: '5%', left: '8%', size: 200 },
      { top: '70%', left: '85%', size: 220 },
      { top: '40%', left: '5%', size: 180 },
      { top: '15%', right: '10%', size: 180 },
      { top: '80%', left: '20%', size: 160 },
      { top: '30%', right: '15%', size: 200 }
    ];

    const variants = ['pink', 'gold', 'rose', 'lavender'];
    positions.forEach((p, i) => {
      const f = document.createElement('div');
      f.className = 'extra-flower';
      const variant = variants[i % variants.length];
      const colorSets = {
        pink: '#f9b9d0',
        gold: '#f4d35e',
        rose: '#e85a8c',
        lavender: '#c5a3ff'
      };
      const color1 = colorSets[variant];
      const color2 = variant === 'gold' ? '#ffd166' : '#ff85b3';
      f.style.backgroundImage = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'%3E%3Cg fill='${color1}'%3E%3Ccircle cx='40' cy='40' r='38'/%3E%3Ccircle cx='80' cy='60' r='30'/%3E%3Ccircle cx='110' cy='30' r='28'/%3E%3Ccircle cx='60' cy='90' r='25'/%3E%3C/g%3E%3Cg fill='${color2}' opacity='0.6'%3E%3Ccircle cx='40' cy='40' r='15'/%3E%3Ccircle cx='80' cy='60' r='12'/%3E%3C/g%3E%3C/svg%3E")`;
      f.style.width = p.size + 'px';
      f.style.height = p.size + 'px';
      if (p.top) f.style.top = p.top;
      if (p.left) f.style.left = p.left;
      if (p.right) f.style.right = p.right;
      f.style.animation = `bgFlowerFloat ${10 + i % 4 * 2}s ease-in-out ${i * 0.3}s infinite`;
      layer.appendChild(f);
    });
  }

  // ============================================================
  // 4. STAGE NAVIGATION
  // ============================================================
  function goToStage(stageId) {
    const current = document.querySelector('.stage-screen.active');
    const next = document.getElementById(stageId);
    if (!next || current === next) return;

    if (current) {
      current.classList.add('exiting');
      setTimeout(() => {
        current.classList.remove('active', 'exiting');
        next.classList.add('active');
        if (stageId === 'stage-3' || stageId === 'stage-4') {
          next.scrollTop = 0;
        }
      }, 580);
    } else {
      next.classList.add('active');
    }
  }

  // ============================================================
  // 5. RECIPIENT NAME INPUT SYNC
  // ============================================================
  function bindRecipientInput() {
    const input = $('#recipient-name');
    const display = $('#recipient-display');
    if (!input || !display) return;

    function update() {
      const name = input.value.trim() || 'Người phụ nữ tuyệt vời';
      display.textContent = name;
    }

    input.addEventListener('input', update);
    input.addEventListener('change', update);
  }

  // ============================================================
  // 6. KHỞI TẠO
  // ============================================================
  function init() {
    addBackgroundFlowers();
    startPetalRain();
    startSparkleLayer();
    bindRecipientInput();

    setTimeout(() => goToStage('stage-2'), 3200);

    const btn3 = $('#btn-to-stage-3');
    if (btn3) {
      btn3.addEventListener('click', () => goToStage('stage-3'));
    }

    const btn4 = $('#btn-to-stage-4');
    if (btn4) {
      btn4.addEventListener('click', () => goToStage('stage-4'));
    }

    const btnRestart = $('#btn-restart');
    if (btnRestart) {
      btnRestart.addEventListener('click', () => {
        goToStage('stage-1');
        setTimeout(() => goToStage('stage-2'), 3200);
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();