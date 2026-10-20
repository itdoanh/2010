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
  // 3.5 POSTCARD — xử lý Share / Download tấm postcard ra PNG
  // ============================================================
  function initPostcardActions() {
    const postcard = document.getElementById('postcard');
    const img = document.getElementById('bouquet-img');
    if (!postcard || !img) return;

    // Bảo đảm ảnh hoa tải xong trước khi cho phép export
    function ensureImageReady(src) {
      return new Promise((resolve) => {
        const test = new Image();
        test.onload = () => resolve(true);
        test.onerror = () => resolve(false);
        test.src = src;
      });
    }

    // Sinh tên file an toàn từ tên người nhận
    function safeFilename(name) {
      const cleaned = (name || 'thu-20-10')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9_\- ]+/g, '')
        .trim()
        .replace(/\s+/g, '-')
        .slice(0, 40) || 'thu-20-10';
      return `postcard-20-10-${cleaned}.png`;
    }

    // Sinh tên chia sẻ
    function shareText(name) {
      const n = (name || '').trim();
      return n
        ? `💐 ${n} ơi, dành cho bạn đó! — Chúc mừng 20.10.2026 🌹`
        : `💐 Gửi đến bạn! — Chúc mừng 20.10.2026 🌹`;
    }

    function toast(msg, icon = '✓') {
      let el = document.querySelector('.postcard-toast');
      if (!el) {
        el = document.createElement('div');
        el.className = 'postcard-toast';
        el.setAttribute('role', 'status');
        document.body.appendChild(el);
      }
      el.innerHTML = `<span class="toast-icon">${icon}</span><span>${msg}</span>`;
      el.classList.add('show');
      clearTimeout(el._t);
      el._t = setTimeout(() => el.classList.remove('show'), 2400);
    }

    async function capturePostcard() {
      // Đợi ảnh hoa thật sự load xong (tránh html2canvas vẽ ra ảnh trống)
      const src = img.src || img.dataset.src;
      if (!src) throw new Error('Không tìm thấy ảnh hoa');
      await ensureImageReady(src);

      // Tạm tắt animation để ảnh chụp không bị nhòe
      postcard.classList.add('export-mode');

      const html2canvas = window.html2canvas;
      if (typeof html2canvas !== 'function') {
        postcard.classList.remove('export-mode');
        throw new Error('html2canvas chưa sẵn sàng');
      }

      try {
        const canvas = await html2canvas(postcard, {
          backgroundColor: '#fff8f5',
          scale: window.devicePixelRatio > 1 ? 2 : 2,
          useCORS: true,
          allowTaint: false,
          logging: false,
          windowWidth: postcard.scrollWidth,
          windowHeight: postcard.scrollHeight,
        });
        return canvas;
      } finally {
        postcard.classList.remove('export-mode');
      }
    }

    async function downloadPostcard() {
      const name = document.getElementById('recipient-name')?.value || '';
      try {
        const canvas = await capturePostcard();
        const dataUrl = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = safeFilename(name);
        link.href = dataUrl;
        document.body.appendChild(link);
        link.click();
        link.remove();
        toast('Đã lưu ảnh thành công!', '📥');
        markSuccess();
      } catch (err) {
        console.error('Download error:', err);
        toast('Không thể lưu ảnh, thử lại nhé', '⚠');
      }
    }

    async function sharePostcard() {
      const name = document.getElementById('recipient-name')?.value || '';
      const text = shareText(name);
      const url = location.href;
      let shared = false;

      // Ưu tiên Web Share API (mobile, có file)
      if (navigator.canShare && navigator.share) {
        try {
          const canvas = await capturePostcard();
          canvas.toBlob(async (blob) => {
            if (!blob) {
              shareFallback(text, url);
              return;
            }
            const file = new File([blob], safeFilename(name), { type: 'image/png' });
            if (navigator.canShare({ files: [file] })) {
              await navigator.share({ files: [file], title: '20.10.2026', text });
              shared = true;
              toast('Đã mở bảng chia sẻ!', '📤');
              markSuccess();
            } else {
              shareFallback(text, url);
            }
          }, 'image/png');
          return;
        } catch (err) {
          console.warn('Web Share file failed:', err);
        }
      }

      shareFallback(text, url);
    }

    function shareFallback(text, url) {
      // Copy link + text vào clipboard
      const full = `${text}\n${url}`;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(full).then(
          () => {
            toast('Đã sao chép lời chúc — dán đi chia sẻ thôi!', '📋');
            markSuccess();
          },
          () => toast('Không thể sao chép, hãy chụp màn hình nhé', '⚠')
        );
      } else {
        // Fallback cũ
        const ta = document.createElement('textarea');
        ta.value = full;
        document.body.appendChild(ta);
        ta.select();
        try {
          document.execCommand('copy');
          toast('Đã sao chép lời chúc — dán đi chia sẻ thôi!', '📋');
          markSuccess();
        } catch {
          toast('Hãy chụp màn hình chia sẻ nhé 💕', '💕');
        }
        ta.remove();
      }
    }

    function flashButtonSuccess(btn) {
      if (!btn) return;
      btn.classList.add('is-success');
      setTimeout(() => btn.classList.remove('is-success'), 1600);
    }

    function markSuccess() {
      flashButtonSuccess(document.getElementById('btn-download'));
      flashButtonSuccess(document.getElementById('btn-download-2'));
      flashButtonSuccess(document.getElementById('btn-share'));
      flashButtonSuccess(document.getElementById('btn-share-2'));
    }

    // Gắn sự kiện cho cả cặp nút (desktop + mobile)
    [
      ['btn-download', 'btn-download-2'],
      ['btn-share', 'btn-share-2'],
    ].forEach((pair) => {
      const [top, bottom] = pair;
      const action = pair[0].startsWith('btn-download') ? downloadPostcard : sharePostcard;
      [top, bottom].forEach((id) => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('click', (e) => {
          e.preventDefault();
          action();
        });
      });
    });

    // Đợi ảnh sẵn sàng rồi thông báo nhẹ
    if (img.complete && img.naturalWidth > 0) {
      // ok
    } else {
      img.addEventListener('load', () => {
        // ok
      }, { once: true });
    }
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
    initPostcardActions();

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