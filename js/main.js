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
  // 3.5 POSTCARD — xuất PNG bằng Canvas API thuần (không cần lib ngoài)
  // ============================================================
  function initPostcardActions() {
    const img = document.getElementById('bouquet-img');
    if (!img) return;

    // Style hiện tại cho PNG (user chọn qua .style-chip)
    let currentStyle = 'magazine';

    // ---- Helpers --------------------------------------------------------
    const FONT_DISPLAY = '"Cormorant Garamond", "Times New Roman", serif';
    const FONT_SCRIPT = '"Dancing Script", "Brush Script MT", cursive';
    const FONT_BODY = '"Be Vietnam Pro", "Segoe UI", system-ui, sans-serif';

    function ensureFontLoaded(fontFamily) {
      // Trả về Promise — hầu như luôn resolved vì Google Fonts đã load sẵn
      if (document.fonts && document.fonts.ready) {
        return document.fonts.ready.then(() => document.fonts.load(`16px ${fontFamily}`)).catch(() => null);
      }
      return Promise.resolve(null);
    }

    function ensureImageReady(src) {
      return new Promise((resolve, reject) => {
        const test = new Image();
        // Bắt buộc set crossOrigin TRƯỚC khi gán src, nếu không canvas sẽ bị
        // "tainted" và toDataURL/toBlob ném SecurityError.
        test.crossOrigin = 'anonymous';
        test.onload = () => resolve(test);
        test.onerror = () => reject(new Error('Không tải được ảnh hoa'));
        test.src = src;
      });
    }

    // Load ảnh cho canvas: thử crossOrigin (để export PNG được), nếu server
    // không trả CORS header thì fallback về load thường (canvas vẫn vẽ được,
    // chỉ kém khả năng export). Ưu tiên URL tương đối từ attribute.
    function loadCanvasSafeImage(el) {
      const raw =
        (el && el.getAttribute && el.getAttribute('src')) ||
        (el && el.dataset && el.dataset.src) ||
        (el && el.src) ||
        '';
      if (!raw) return Promise.reject(new Error('Không tìm thấy ảnh hoa'));

      const tryLoad = (withCors) =>
        new Promise((resolve, reject) => {
          const im = new Image();
          if (withCors) im.crossOrigin = 'anonymous';
          im.onload = () => resolve(im);
          im.onerror = () => reject(new Error('Ảnh lỗi'));
          im.src = raw;
        });

      return tryLoad(true)
        .catch(() => tryLoad(false));
    }

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

/* ============================================================
       Postcard canvas — 3 style (magazine / romantic / minimal)
       Dùng "vertical box flow": mỗi box đo chiều cao thực tế rồi
       xếp nối xuống dưới, nên không bao giờ có chữ chồng nhau.
       ============================================================ */

    // Chạy 1 chuỗi box dọc: cursorY bắt đầu từ startY, mỗi box cách
    // box trước đúng gap của nó và trả về chiều cao đã dùng.
    function flowBoxes(ctx, boxes, x, startY, w) {
      let cursorY = startY;
      for (const box of boxes) {
        if (box.gap) cursorY += typeof box.gap === 'function' ? box.gap() : box.gap;
        cursorY += box.render(ctx, x, cursorY, w);
      }
      return cursorY;
    }

    // Đo tổng chiều cao một chuỗi box mà KHÔNG vẽ gì lên canvas.
    // Dùng để biết trước nội dung có vừa khung không, rồi mới quyết định co.
    function measureBoxes(boxes, availableH) {
      let total = 0;
      for (const box of boxes) {
        if (box.gap) total += typeof box.gap === 'function' ? box.gap() : box.gap;
        total += box.measure(availableH);
      }
      return total;
    }

    // Canvas ẩn dùng riêng cho việc đo chữ (không vẽ ra màn hình).
    // Tách riêng để phép đo không phụ thuộc font/state của canvas chính.
    let measureCtx = null;
    function getMeasureCtx() {
      if (!measureCtx) {
        measureCtx = document.createElement('canvas').getContext('2d');
      }
      return measureCtx;
    }

    // Nền + tấm card trung tâm (dùng chung cho magazine & vintage)
    function paintCard(ctx, theme) {
      const W = ctx.canvas.width, H = ctx.canvas.height;
      const bg = ctx.createLinearGradient(0, 0, 0, H);
      bg.addColorStop(0, theme.bgTop);
      bg.addColorStop(0.5, theme.bgMid);
      bg.addColorStop(1, theme.bgBot);
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);

      ctx.save();
      ctx.shadowColor = theme.card.shadow;
      ctx.shadowBlur = theme.card.shadowBlur;
      ctx.shadowOffsetY = theme.card.shadowOffsetY;
      roundRect(ctx, theme.outerX, theme.outerY, theme.outerW, theme.outerH, theme.card.radius);
      const cg = ctx.createLinearGradient(0, theme.outerY, 0, theme.outerY + theme.outerH);
      cg.addColorStop(0, theme.card.top);
      cg.addColorStop(1, theme.card.bot);
      ctx.fillStyle = cg;
      ctx.fill();
      ctx.restore();
    }

    /**
     * Vẽ postcard ra canvas theo style hiện tại.
     * Trả về Promise<HTMLCanvasElement>.
     */
    async function renderPostcardToCanvas() {
      await Promise.all([
        ensureFontLoaded(FONT_DISPLAY),
        ensureFontLoaded(FONT_SCRIPT),
        ensureFontLoaded(FONT_BODY),
      ]);
      const bouquetImg = await loadCanvasSafeImage(img);
      const name = getRecipientName();

      if (currentStyle === 'romantic') return renderRomantic(bouquetImg, name);
      if (currentStyle === 'minimal') return renderMinimal(bouquetImg, name);
      return renderMagazine(bouquetImg, name);
    }

    /* ============================================================
       STYLE 1 — TẠP CHÍ SANG TRỌNG (Magazine)
       ============================================================ */
    function renderMagazine(bouquetImg, name) {
      const W = 1080, H = 1920;
      const canvas = document.createElement('canvas');
      canvas.width = W; canvas.height = H;
      const ctx = canvas.getContext('2d');

      const theme = {
        bgTop: '#fff6f8', bgMid: '#ffeef3', bgBot: '#fde0ea',
        outerX: 50, outerY: 50, outerW: W - 100, outerH: H - 100,
        card: { top: '#ffffff', bot: '#fff7fa', radius: 64, shadow: 'rgba(190, 60, 110, 0.18)', shadowBlur: 60, shadowOffsetY: 20 },
      };
      paintCard(ctx, theme);
      drawSoftBlob(ctx, 120, -60, 480, '#ffd6e7', 0.55);
      drawSoftBlob(ctx, W - 60, H - 80, 520, '#ffc1d4', 0.45);

      // Viền dashed
      const innerPad = 32;
      const innerX = theme.outerX + innerPad;
      const innerY = theme.outerY + innerPad;
      const innerW = theme.outerW - innerPad * 2;
      const innerH = theme.outerH - innerPad * 2;
      ctx.save();
      ctx.setLineDash([6, 10]);
      ctx.lineWidth = 2;
      ctx.strokeStyle = 'rgba(198, 58, 114, 0.5)';
      roundRect(ctx, innerX, innerY, innerW, innerH, 48);
      ctx.stroke();
      ctx.restore();

      const x = innerX + 30;
      const w = innerW - 60;
      const top = innerY + 44;
      const availH = innerY + innerH - top - 40;

      // Hệ số co — tính sau khi có boxes, áp dụng cho mọi kích thước bên dưới
      let K = 1;
      const S = (v) => Math.round(v * K);

      const boxes = [
        // "— dành tặng bạn —"
        {
          measure: () => S(44),
          render: (c, bx, by, bw) => {
            const h = S(44);
            c.font = 'italic 500 ' + S(34) + 'px ' + FONT_SCRIPT;
            c.fillStyle = '#c47190';
            c.textAlign = 'center';
            c.textBaseline = 'middle';
            c.fillText('— dành tặng bạn —', bx + bw / 2, by + h / 2);
            return h;
          },
        },
        // Title 2 dòng
        {
          gap: () => S(38),
          measure: () => S(82) * 2,
          render: (c, bx, by, bw) => {
            const lh = S(82);
            c.font = 'italic 600 ' + S(62) + 'px ' + FONT_DISPLAY;
            c.fillStyle = '#b7306a';
            c.textAlign = 'center';
            c.textBaseline = 'middle';
            c.fillText('Happy Vietnamese', bx + bw / 2, by + lh / 2);
            c.fillText("Women's Day", bx + bw / 2, by + lh + lh / 2);
            return lh * 2;
          },
        },
        // Date lớn + gạch chân
        {
          gap: () => S(34),
          measure: () => S(132) + S(34),
          render: (c, bx, by, bw) => {
            const dateH = S(132);
            c.font = '700 ' + S(118) + 'px ' + FONT_DISPLAY;
            c.fillStyle = '#c63a72';
            c.textAlign = 'center';
            c.textBaseline = 'middle';
            c.save();
            c.shadowColor = 'rgba(198, 58, 114, 0.22)';
            c.shadowBlur = 26 * K;
            c.fillText('20 . 10 . 2026', bx + bw / 2, by + dateH / 2);
            c.restore();
            const lineY = by + dateH + S(16);
            const g = c.createLinearGradient(bx + 60, 0, bx + bw - 60, 0);
            g.addColorStop(0, 'rgba(232, 90, 140, 0)');
            g.addColorStop(0.5, 'rgba(232, 90, 140, 0.8)');
            g.addColorStop(1, 'rgba(232, 90, 140, 0)');
            c.save();
            c.strokeStyle = g;
            c.lineWidth = Math.max(2, 3 * K);
            c.beginPath();
            c.moveTo(bx + 60, lineY);
            c.lineTo(bx + bw - 60, lineY);
            c.stroke();
            c.restore();
            return dateH + S(34);
          },
        },
        // SPECIAL DAY badge
        {
          gap: () => S(34),
          measure: () => S(54),
          render: (c, bx, by, bw) => {
            const text = 'SPECIAL DAY';
            c.font = '700 ' + S(30) + 'px ' + FONT_DISPLAY;
            const tw = c.measureText(text).width + S(56);
            const th = S(54);
            const tx = bx + bw / 2 - tw / 2;
            const g = c.createLinearGradient(tx, by, tx + tw, by + th);
            g.addColorStop(0, '#c63a72');
            g.addColorStop(1, '#a02e5b');
            roundRect(c, tx, by, tw, th, th / 2);
            c.fillStyle = g;
            c.fill();
            c.fillStyle = '#fff';
            c.textAlign = 'center';
            c.textBaseline = 'middle';
            c.font = '700 ' + S(28) + 'px ' + FONT_DISPLAY;
            c.fillText(text, bx + bw / 2, by + th / 2 + 1);
            return th;
          },
        },
        // Ảnh hoa vuông + caption pill bên dưới
        {
          gap: () => S(40),
          measure: () => Math.min(w, S(620)) + S(18) + S(58),
          render: (c, bx, by, bw) => {
            // Ảnh vuông, co theo bề rộng
            const size = Math.min(bw, S(620));
            const px = bx + bw / 2 - size / 2;
            c.save();
            c.shadowColor = 'rgba(0, 0, 0, 0.16)';
            c.shadowBlur = 36 * K;
            c.shadowOffsetY = 12 * K;
            roundRect(c, px, by, size, size, 30 * K);
            c.fillStyle = '#fff';
            c.fill();
            c.restore();
            c.save();
            roundRect(c, px, by, size, size, 30 * K);
            c.strokeStyle = '#f4d35e';
            c.lineWidth = Math.max(3, 6 * K);
            c.stroke();
            c.restore();
            c.save();
            roundRect(c, px + 10, by + 10, size - 20, size - 20, 22 * K);
            c.clip();
            drawCoverImage(c, bouquetImg, px + 10, by + 10, size - 20, size - 20);
            c.restore();
            const capText = 'Một bó hoa kết từ rất nhiều yêu thương';
            c.font = 'italic 500 ' + S(30) + 'px ' + FONT_SCRIPT;
            const capW = c.measureText(capText).width + S(72);
            const capH = S(58);
            const capX = bx + bw / 2 - capW / 2;
            const capY = by + size + S(18);
            c.save();
            roundRect(c, capX, capY, capW, capH, capH / 2);
            const cg = c.createLinearGradient(capX, capY, capX, capY + capH);
            cg.addColorStop(0, 'rgba(60, 20, 38, 0.9)');
            cg.addColorStop(1, 'rgba(40, 12, 25, 0.82)');
            c.fillStyle = cg;
            c.fill();
            c.fillStyle = '#ffd6e0';
            c.font = S(22) + 'px serif';
            c.textAlign = 'center';
            c.textBaseline = 'middle';
            c.fillText('✦', capX + S(20), capY + capH / 2);
            c.fillText('✦', capX + capW - S(20), capY + capH / 2);
            c.fillStyle = '#fff5f7';
            c.font = 'italic 500 ' + S(30) + 'px ' + FONT_SCRIPT;
            c.fillText(capText, capX + capW / 2, capY + capH / 2 + 2);
            c.restore();
            return size + S(18) + capH;
          },
        },
        // Lời chúc
        {
          gap: () => S(46),
          measure: () => {
            const ctx2 = getMeasureCtx();
            ctx2.font = 'italic 500 ' + S(36) + 'px ' + FONT_SCRIPT;
            const labelH = S(52);
            const nameH = S(96) + S(22);
            const wf = S(40);
            ctx2.font = 'italic 500 ' + wf + 'px ' + FONT_SCRIPT;
            const lh = wf * 1.45;
            const lines = wrapLines(ctx2, 'Chúc ' + name + ' một ngày 20/10 thật ý nghĩa, tràn đầy hoa và yêu thương', w - S(10));
            return labelH + nameH + lh * lines.length;
          },
          render: (c, bx, by, bw) => {
            let cur = by;
            c.font = 'italic 500 ' + S(36) + 'px ' + FONT_SCRIPT;
            c.fillStyle = '#c47190';
            c.textAlign = 'center';
            c.textBaseline = 'middle';
            c.fillText('— Gửi đến —', bx + bw / 2, cur + S(22));
            cur += S(52);
            // Tên — tự co nếu quá dài
            const nameH = S(96);
            let nf = S(78);
            c.font = '700 ' + nf + 'px ' + FONT_DISPLAY;
            while (c.measureText(name).width > bw && nf > S(28)) {
              nf -= 4;
              c.font = '700 ' + nf + 'px ' + FONT_DISPLAY;
            }
            const nGrad = c.createLinearGradient(0, cur, 0, cur + nameH);
            nGrad.addColorStop(0, '#c63a72');
            nGrad.addColorStop(1, '#a02e5b');
            c.fillStyle = nGrad;
            c.fillText(name, bx + bw / 2, cur + nameH / 2);
            cur += nameH + S(22);
            // Lời chúc — wrap theo font thực tế
            const wf = S(40);
            const lh = wf * 1.45;
            c.font = 'italic 500 ' + wf + 'px ' + FONT_SCRIPT;
            c.fillStyle = '#5a3045';
            const lines = wrapLines(c, 'Chúc ' + name + ' một ngày 20/10 thật ý nghĩa, tràn đầy hoa và yêu thương', bw - S(10));
            for (const ln of lines) {
              c.fillText(ln, bx + bw / 2, cur + lh / 2);
              cur += lh;
            }
            return cur - by;
          },
        },
        // Footer
        {
          gap: () => S(44),
          measure: () => S(44),
          render: (c, bx, by, bw) => {
            const h = S(44);
            const footText = 'Với tất cả yêu thương & trân trọng';
            c.font = 'italic 500 ' + S(36) + 'px ' + FONT_SCRIPT;
            const ftW = c.measureText(footText).width;
            const lineLen = S(62);
            const gap = S(24);
            const totalW = lineLen * 2 + gap * 2 + ftW;
            const sx = bx + bw / 2 - totalW / 2;
            const mid = by + h / 2;
            c.save();
            c.strokeStyle = 'rgba(198, 58, 114, 0.5)';
            c.lineWidth = Math.max(2, 2 * K);
            c.beginPath();
            c.moveTo(sx, mid);
            c.lineTo(sx + lineLen, mid);
            c.stroke();
            c.beginPath();
            c.moveTo(sx + lineLen + gap * 2 + ftW, mid);
            c.lineTo(sx + lineLen + gap * 2 + ftW + lineLen, mid);
            c.stroke();
            c.restore();
            c.fillStyle = '#8a5a72';
            c.textAlign = 'left';
            c.textBaseline = 'middle';
            c.fillText(footText, sx + lineLen + gap, mid);
            return h;
          },
        },
      ];

      // 2-pass: đo ở K=1, tính K để vừa khung, đo lại xác nhận.
      // Vòng lặp tối đa 6 lần để hội tụ (measure có phụ thuộc K).
      for (let pass = 0; pass < 6; pass++) {
        const total = measureBoxes(boxes, availH);
        if (total <= availH) break;
        K = Math.max(0.55, K * (availH / total));
      }

      flowBoxes(ctx, boxes, x, top, w);

      drawCornerDeco(ctx, '✿', innerX + 34, innerY + innerH - 34, { baseline: 'bottom' });
      drawCornerDeco(ctx, '✿', innerX + innerW - 34, innerY + innerH - 34, { align: 'right', baseline: 'bottom' });

      return canvas;
    }

    /* ============================================================
       STYLE 2 — LÃNG MẠN CỐ ĐIỂN (Vintage)
       ============================================================ */
    function renderRomantic(bouquetImg, name) {
      const W = 1080, H = 1920;
      const canvas = document.createElement('canvas');
      canvas.width = W; canvas.height = H;
      const ctx = canvas.getContext('2d');

      const theme = {
        bgTop: '#fbf0e6', bgMid: '#f6e3d3', bgBot: '#efd2c0',
        outerX: 60, outerY: 60, outerW: W - 120, outerH: H - 120,
        card: { top: '#fff7ec', bot: '#f8e4d2', radius: 56, shadow: 'rgba(140, 80, 50, 0.25)', shadowBlur: 50, shadowOffsetY: 14 },
      };
      paintCard(ctx, theme);
      // Texture giấy, clip trong card
      ctx.save();
      roundRect(ctx, theme.outerX, theme.outerY, theme.outerW, theme.outerH, theme.card.radius);
      ctx.clip();
      for (let i = 0; i < 700; i++) {
        ctx.fillStyle = 'rgba(160, 100, 70, ' + Math.random() * 0.045 + ')';
        ctx.fillRect(
          theme.outerX + Math.random() * theme.outerW,
          theme.outerY + Math.random() * theme.outerH,
          2, 2
        );
      }
      ctx.restore();
      // Viền ren
      ctx.save();
      ctx.strokeStyle = 'rgba(140, 70, 50, 0.65)';
      ctx.lineWidth = 4;
      roundRect(ctx, theme.outerX + 30, theme.outerY + 30, theme.outerW - 60, theme.outerH - 60, 44);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(140, 70, 50, 0.35)';
      ctx.lineWidth = 1.5;
      roundRect(ctx, theme.outerX + 44, theme.outerY + 44, theme.outerW - 88, theme.outerH - 88, 36);
      ctx.stroke();
      ctx.restore();
      // Decor góc
      drawVintageCorner(ctx, theme.outerX + 74, theme.outerY + 74);
      drawVintageCorner(ctx, theme.outerX + theme.outerW - 74, theme.outerY + 74, { flipX: true });
      drawVintageCorner(ctx, theme.outerX + 74, theme.outerY + theme.outerH - 74, { flipY: true });
      drawVintageCorner(ctx, theme.outerX + theme.outerW - 74, theme.outerY + theme.outerH - 74, { flipX: true, flipY: true });

      const x = theme.outerX + 86;
      const w = theme.outerW - 172;

      const boxes = [
        // Ribbon date
        {
          render: (c, bx, by, bw) => {
            const rh = 104;
            const rw = bw - 40;
            const rx = bx + 20;
            const g = c.createLinearGradient(0, by, 0, by + rh);
            g.addColorStop(0, '#8b3a52');
            g.addColorStop(1, '#6b2738');
            c.save();
            c.fillStyle = g;
            drawRibbon(c, rx, by, rw, rh);
            c.restore();
            c.fillStyle = '#fff5ec';
            c.font = 'italic 600 54px ' + FONT_DISPLAY;
            c.textAlign = 'center';
            c.textBaseline = 'middle';
            c.fillText('20  ·  10  ·  2026', rx + rw / 2, by + rh / 2);
            return rh + 10;
          },
        },
        // Subtitle
        {
          gap: 26,
          render: (c, bx, by, bw) => {
            const h = 40;
            c.font = 'italic 500 36px ' + FONT_SCRIPT;
            c.fillStyle = '#8b3a52';
            c.textAlign = 'center';
            c.textBaseline = 'middle';
            c.fillText("— Vietnamese Women's Day —", bx + bw / 2, by + h / 2);
            return h;
          },
        },
        // Polaroid nghiêng, caption nằm trong phần trắng dưới ảnh
        {
          gap: 44,
          render: (c, bx, by, bw) => {
            const pad = 26;
            const capH = 48;
            const size = Math.min(bw - 70, 580);
            const frameH = size + pad * 2 + capH;
            const px = bx + bw / 2 - size / 2;
            const frameY = by;
            const cx = px + size / 2;
            const cy = frameY + pad + size / 2;
            const tilt = -3 * Math.PI / 180;
            c.save();
            c.translate(cx, cy);
            c.rotate(tilt);
            c.translate(-cx, -cy);
            c.shadowColor = 'rgba(80, 40, 30, 0.32)';
            c.shadowBlur = 30;
            c.shadowOffsetY = 12;
            roundRect(c, px - pad, frameY, size + pad * 2, frameH, 6);
            c.fillStyle = '#fffaf0';
            c.fill();
            c.restore();
            c.save();
            c.translate(cx, cy);
            c.rotate(tilt);
            c.translate(-cx, -cy);
            roundRect(c, px - pad + 4, frameY + 4, size + pad * 2 - 8, frameH - 8, 4);
            c.strokeStyle = 'rgba(140, 70, 50, 0.32)';
            c.lineWidth = 1.5;
            c.stroke();
            roundRect(c, px, frameY + pad, size, size, 3);
            c.clip();
            drawCoverImage(c, bouquetImg, px, frameY + pad, size, size);
            c.restore();
            c.save();
            c.translate(cx, cy);
            c.rotate(tilt);
            c.translate(-cx, -cy);
            c.fillStyle = '#8b3a52';
            c.font = 'italic 500 30px ' + FONT_SCRIPT;
            c.textAlign = 'center';
            c.textBaseline = 'middle';
            c.fillText('~ một bó hoa, một tấm chân tình ~', cx, frameY + pad + size + capH / 2);
            c.restore();
            return frameH + 14;
          },
        },
        // Lời chúc
        {
          gap: 48,
          render: (c, bx, by, bw) => {
            let cur = by;
            c.font = 'italic 500 36px ' + FONT_SCRIPT;
            c.fillStyle = '#6b2738';
            c.textAlign = 'center';
            c.textBaseline = 'middle';
            c.fillText('— Gửi đến —', bx + bw / 2, cur + 22);
            cur += 54;
            // Tên — tự co nếu dài
            const nameH = 96;
            let nf = 84;
            c.font = '700 ' + nf + 'px ' + FONT_DISPLAY;
            while (c.measureText(name).width > bw && nf > 40) {
              nf -= 4;
              c.font = '700 ' + nf + 'px ' + FONT_DISPLAY;
            }
            const nGrad = c.createLinearGradient(0, cur, 0, cur + nameH);
            nGrad.addColorStop(0, '#8b3a52');
            nGrad.addColorStop(1, '#6b2738');
            c.fillStyle = nGrad;
            c.fillText(name, bx + bw / 2, cur + nameH / 2);
            cur += nameH + 22;
            const wf = 40;
            const lh = wf * 1.45;
            c.font = 'italic 500 ' + wf + 'px ' + FONT_SCRIPT;
            c.fillStyle = '#5a2030';
            const lines = wrapLines(c, 'Chúc ' + name + ' một ngày 20/10 thật ý nghĩa, tràn đầy hoa và yêu thương', bw - 10);
            for (const ln of lines) {
              c.fillText(ln, bx + bw / 2, cur + lh / 2);
              cur += lh;
            }
            return cur - by;
          },
        },
        // Ribbon footer
        {
          gap: 48,
          render: (c, bx, by, bw) => {
            const rh = 76;
            const rw = bw - 60;
            const rx = bx + 30;
            const g = c.createLinearGradient(0, by, 0, by + rh);
            g.addColorStop(0, '#8b3a52');
            g.addColorStop(1, '#6b2738');
            c.save();
            c.fillStyle = g;
            drawRibbon(c, rx, by, rw, rh);
            c.restore();
            c.fillStyle = '#fff5ec';
            c.font = 'italic 500 36px ' + FONT_SCRIPT;
            c.textAlign = 'center';
            c.textBaseline = 'middle';
            c.fillText('Với tất cả yêu thương & trân trọng', rx + rw / 2, by + rh / 2);
            return rh + 10;
          },
        },
      ];

      flowBoxes(ctx, boxes, x, theme.outerY + 92, w);

      return canvas;
    }

    /* ============================================================
       STYLE 3 — TỐI GIẢN HIỆN ĐẠI (Minimal)
       ============================================================ */
    function renderMinimal(bouquetImg, name) {
      const W = 1080, H = 1920;
      const canvas = document.createElement('canvas');
      canvas.width = W; canvas.height = H;
      const ctx = canvas.getContext('2d');

      ctx.fillStyle = '#fbfbfb';
      ctx.fillRect(0, 0, W, H);
      const ag = ctx.createLinearGradient(0, 0, 0, H);
      ag.addColorStop(0, '#e85a8c');
      ag.addColorStop(1, '#c63a72');
      ctx.fillStyle = ag;
      ctx.fillRect(0, 0, 12, H);

      const x = 108;
      const w = W - 108 - 92;
      const top = 136;

      const boxes = [
        // Eyebrow
        {
          render: (c, bx, by, bw) => {
            const h = 30;
            c.font = '600 26px ' + FONT_BODY;
            c.fillStyle = '#e85a8c';
            c.textAlign = 'left';
            c.textBaseline = 'middle';
            c.fillText('20 . 10 . 2026 · SPECIAL DAY', bx, by + h / 2);
            return h;
          },
        },
        // Title 3 dòng — cỡ chữ to
        {
          gap: 34,
          render: (c, bx, by, bw) => {
            const tSize = 98;
            const lh = tSize * 1.22;
            c.textAlign = 'left';
            c.textBaseline = 'middle';
            c.fillStyle = '#1a1a1a';
            c.font = '700 ' + tSize + 'px ' + FONT_DISPLAY;
            c.fillText('Happy', bx, by + lh * 0.5);
            c.fillStyle = '#e85a8c';
            c.font = 'italic 700 ' + tSize + 'px ' + FONT_DISPLAY;
            c.fillText("Vietnamese Women's", bx, by + lh * 1.5);
            c.fillStyle = '#1a1a1a';
            c.font = '700 ' + tSize + 'px ' + FONT_DISPLAY;
            c.fillText('Day.', bx, by + lh * 2.5);
            return lh * 3;
          },
        },
        // Ảnh hoa landscape
        {
          gap: 40,
          render: (c, bx, by, bw) => {
            const ph = 620;
            c.save();
            c.shadowColor = 'rgba(0, 0, 0, 0.1)';
            c.shadowBlur = 26;
            c.shadowOffsetY = 8;
            roundRect(c, bx, by, bw, ph, 20);
            c.fillStyle = '#fff';
            c.fill();
            c.restore();
            c.save();
            roundRect(c, bx + 8, by + 8, bw - 16, ph - 16, 14);
            c.clip();
            drawCoverImage(c, bouquetImg, bx + 8, by + 8, bw - 16, ph - 16);
            c.restore();
            return ph;
          },
        },
        // Caption
        {
          gap: 24,
          render: (c, bx, by, bw) => {
            const h = 32;
            c.font = 'italic 400 28px ' + FONT_SCRIPT;
            c.fillStyle = '#8b8b8b';
            c.textAlign = 'left';
            c.textBaseline = 'middle';
            c.fillText('~ Một bó hoa kết từ rất nhiều yêu thương ~', bx, by + h / 2);
            return h;
          },
        },
        // Lời chúc
        {
          gap: 46,
          render: (c, bx, by, bw) => {
            let cur = by;
            c.font = '600 24px ' + FONT_BODY;
            c.fillStyle = '#e85a8c';
            c.textAlign = 'left';
            c.textBaseline = 'middle';
            c.fillText('— GỬI ĐẾN —', bx, cur + 16);
            cur += 48;
            // Tên — tự co nếu dài
            const nameH = 92;
            let nf = 80;
            c.font = '700 ' + nf + 'px ' + FONT_DISPLAY;
            while (c.measureText(name).width > bw && nf > 36) {
              nf -= 4;
              c.font = '700 ' + nf + 'px ' + FONT_DISPLAY;
            }
            c.fillStyle = '#1a1a1a';
            c.fillText(name, bx, cur + nameH / 2);
            cur += nameH + 20;
            const wf = 42;
            const lh = wf * 1.5;
            c.font = 'italic 500 ' + wf + 'px ' + FONT_SCRIPT;
            c.fillStyle = '#4a4a4a';
            const lines = wrapLines(c, 'Chúc ' + name + ' một ngày 20/10 thật ý nghĩa, tràn đầy hoa và yêu thương', bw);
            for (const ln of lines) {
              c.fillText(ln, bx, cur + lh / 2);
              cur += lh;
            }
            return cur - by;
          },
        },
        // Footer
        {
          gap: 44,
          render: (c, bx, by, bw) => {
            let cur = by;
            c.save();
            c.strokeStyle = '#e85a8c';
            c.lineWidth = 3;
            c.beginPath();
            c.moveTo(bx, cur);
            c.lineTo(bx + 90, cur);
            c.stroke();
            c.restore();
            cur += 20;
            const h = 28;
            c.font = '600 22px ' + FONT_BODY;
            c.fillStyle = '#e85a8c';
            c.textAlign = 'left';
            c.textBaseline = 'middle';
            c.fillText('VỚI TẤT CẢ YÊU THƯƠNG & TRÂN TRỌNG', bx, cur + h / 2);
            return 20 + h;
          },
        },
      ];

      flowBoxes(ctx, boxes, x, top, w);

      return canvas;
    }

    /* ====== Helpers đặc thù cho style ====== */
    function drawSoftBlob(ctx, cx, cy, size, color, alpha) {
      ctx.save();
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, size);
      g.addColorStop(0, color);
      g.addColorStop(0.5, color.replace(')', `, ${alpha * 0.4})`).replace('rgb', 'rgba'));
      g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(cx, cy, size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    function drawRibbon(ctx, x, y, w, h) {
      // Ribbon có đuôi (chevron)
      const tail = 30;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + tail, y - 20);
      ctx.lineTo(x + tail + 10, y);
      ctx.lineTo(x + w - tail - 10, y);
      ctx.lineTo(x + w - tail, y - 20);
      ctx.lineTo(x + w, y);
      ctx.lineTo(x + w, y + h);
      ctx.lineTo(x + w - tail, y + h + 20);
      ctx.lineTo(x + w - tail - 10, y + h);
      ctx.lineTo(x + tail + 10, y + h);
      ctx.lineTo(x + tail, y + h + 20);
      ctx.lineTo(x, y + h);
      ctx.closePath();
      ctx.fill();
    }

    function drawVintageCorner(ctx, x, y, opts = {}) {
      ctx.save();
      ctx.translate(x, y);
      if (opts.flipX) ctx.scale(-1, 1);
      if (opts.flipY) ctx.scale(1, -1);
      ctx.strokeStyle = 'rgba(140, 70, 50, 0.75)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, 40);
      ctx.quadraticCurveTo(0, 0, 40, 0);
      ctx.stroke();
      // Hoa nhỏ
      ctx.fillStyle = '#8b3a52';
      ctx.font = '34px serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText('❀', 8, 8);
      ctx.restore();
    }

    // ---- Helpers vẽ ---------------------------------------------------
    function roundRect(ctx, x, y, w, h, r) {
      const radius = Math.min(r, Math.min(w, h) / 2);
      ctx.beginPath();
      ctx.moveTo(x + radius, y);
      ctx.lineTo(x + w - radius, y);
      ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
      ctx.lineTo(x + w, y + h - radius);
      ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
      ctx.lineTo(x + radius, y + h);
      ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
      ctx.lineTo(x, y + radius);
      ctx.quadraticCurveTo(x, y, x + radius, y);
      ctx.closePath();
    }

    function drawCoverImage(ctx, src, dx, dy, dw, dh) {
      const iw = src.width || src.naturalWidth;
      const ih = src.height || src.naturalHeight;
      if (!iw || !ih) return;
      // Contain — giữ nguyên tỉ lệ, không cắt (ảnh sẽ vừa vặn vào khung)
      const scale = Math.min(dw / iw, dh / ih);
      const sw = dw / scale;
      const sh = dh / scale;
      const sx = (iw - sw) / 2;
      const sy = (ih - sh) / 2;
      ctx.drawImage(src, sx, sy, sw, sh, dx, dy, dw, dh);
    }

    function drawCornerDeco(ctx, ch, x, y, opts = {}) {
      ctx.save();
      ctx.fillStyle = 'rgba(198, 58, 114, 0.85)';
      ctx.font = '34px serif';
      ctx.textAlign = opts.align || 'left';
      ctx.textBaseline = opts.baseline || 'top';
      if (opts.align === 'right') {
        ctx.fillText(ch, x, y);
      } else {
        ctx.fillText(ch, x, y);
      }
      ctx.restore();
    }

    function wrapLines(ctx, text, maxWidth) {
      const words = text.split(' ');
      const lines = [];
      let line = '';
      for (const w of words) {
        const trial = line ? line + ' ' + w : w;
        if (ctx.measureText(trial).width > maxWidth && line) {
          lines.push(line);
          line = w;
        } else {
          line = trial;
        }
      }
      if (line) lines.push(line);
      return lines;
    }

    // ---- Actions -------------------------------------------------------
    // Xuất canvas → PNG blob. Bọc riêng để bắt lỗi canvas bị "tainted"
    // (SecurityError) và trả về thông báo dễ hiểu cho người dùng.
    async function canvasToPngBlob(canvas) {
      try {
        const blob = await new Promise((resolve, reject) => {
          try {
            canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob rỗng'))), 'image/png');
          } catch (e) {
            reject(e);
          }
        });
        return blob;
      } catch (err) {
        if (err && err.name === 'SecurityError') {
          const friendly = new Error(
            'CANVAS_TAINTED'
          );
          friendly.cause = err;
          throw friendly;
        }
        throw err;
      }
    }

    function handleCanvasTaint() {
      // Nguyên nhân: mở file bằng file:// hoặc ảnh nằm khác domain mà server
      // không trả CORS header → canvas bị taint, không xuất được PNG.
      console.warn(
        '[Postcard] Canvas bị taint — không thể xuất PNG. ' +
          'Hãy mở web qua http://localhost (vd: python -m http.server 8765) thay vì file://'
      );
      toast('Ảnh không xuất được trên file:// — hãy chạy qua localhost nhé', '⚠');
    }

    async function downloadPostcard() {
      try {
        const canvas = await renderPostcardToCanvas();
        const blob = await canvasToPngBlob(canvas);
        const name = document.getElementById('recipient-name')?.value || '';
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = safeFilename(name);
        link.href = url;
        document.body.appendChild(link);
        link.click();
        link.remove();
        // Nhả bộ nhớ blob sau khi trình duyệt bắt đầu tải
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        toast('Đã lưu ảnh thành công!', '📥');
        markSuccess();
      } catch (err) {
        if (err && err.message === 'CANVAS_TAINTED') {
          handleCanvasTaint();
          return;
        }
        console.error('Download error:', err);
        toast('Không thể lưu ảnh, thử lại nhé', '⚠');
      }
    }

    async function sharePostcard() {
      try {
        const canvas = await renderPostcardToCanvas();
        const name = document.getElementById('recipient-name')?.value || '';
        const text = shareText(name);

        if (canvas.toBlob && navigator.canShare && navigator.share) {
          let blob = null;
          try {
            blob = await canvasToPngBlob(canvas);
          } catch (e) {
            if (e && e.message === 'CANVAS_TAINTED') throw e;
            blob = null;
          }
          if (blob) {
            const file = new File([blob], safeFilename(name), { type: 'image/png' });
            if (navigator.canShare({ files: [file] })) {
              await navigator.share({ files: [file], title: '20.10.2026', text });
              toast('Đã mở bảng chia sẻ!', '📤');
              markSuccess();
              return;
            }
          }
        }
        shareFallback(text);
      } catch (err) {
        if (err && err.name === 'AbortError') {
          // User hủy chia sẻ, không báo lỗi
          return;
        }
        if (err && err.message === 'CANVAS_TAINTED') {
          handleCanvasTaint();
          return;
        }
        console.warn('Web Share file failed:', err);
        const text = shareText(document.getElementById('recipient-name')?.value || '');
        shareFallback(text);
      }
    }

    function shareFallback(text) {
      const url = location.href;
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

    // ---- Bind events --------------------------------------------------
    [
      ['btn-download', 'btn-download-2'],
      ['btn-share', 'btn-share-2'],
    ].forEach((pair) => {
      const action = pair[0].startsWith('btn-download') ? downloadPostcard : sharePostcard;
      pair.forEach((id) => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('click', (e) => {
          e.preventDefault();
          action();
        });
      });
    });

    // ---- Style picker --------------------------------------------------
    // Cho phép user chọn phong cách postcard PNG (chỉ ảnh hưởng tới ảnh xuất,
    // không ảnh hưởng postcard HTML hiển thị trên web).
    const postcardEl = document.getElementById('postcard');
    document.querySelectorAll('.style-chip').forEach((chip) => {
      chip.addEventListener('click', () => {
        const style = chip.dataset.style || 'magazine';
        currentStyle = style;
        document.querySelectorAll('.style-chip').forEach((c) => {
          const isActive = c === chip;
          c.classList.toggle('is-active', isActive);
          c.setAttribute('aria-pressed', isActive ? 'true' : 'false');
        });
        // Đổi class trên #postcard để preview thay đổi ngay trên web
        if (postcardEl) {
          postcardEl.classList.remove('postcard--magazine', 'postcard--romantic', 'postcard--minimal');
          postcardEl.classList.add('postcard--' + style);
        }
        const name = (style === 'magazine' && 'Tạp chí') ||
                     (style === 'romantic' && 'Vintage') ||
                     (style === 'minimal' && 'Minimal');
        toast(`Phong cách: ${name}`, '🎨');
      });
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
  // 5. RECIPIENT NAME INPUT SYNC + BOQUET PICKER
  // ============================================================

  // Helper lấy tên người nhận — nếu user chưa nhập thì fallback nhẹ nhàng
  function getRecipientName(input) {
    if (!input) input = document.getElementById('recipient-name');
    const v = (input?.value || '').trim();
    return v || 'Một người phụ nữ tuyệt vời';
  }

  function bindRecipientInput() {
    const input = $('#recipient-name');
    const display = $('#recipient-display');
    if (!input || !display) return;

    function update() {
      const name = (input.value || '').trim() || 'Một người phụ nữ tuyệt vời';
      display.textContent = name;
    }

    // Cập nhật ban đầu
    update();

    input.addEventListener('input', update);
    input.addEventListener('change', update);
  }

  function bindBouquetPicker() {
    const grid = document.getElementById('bouquet-gallery-grid');
    const img = document.getElementById('bouquet-img');
    if (!grid || !img) return;

    const thumbs = Array.from(grid.querySelectorAll('.bouquet-thumb'));

    function setActive(thumb) {
      thumbs.forEach((t) => {
        const isActive = t === thumb;
        t.classList.toggle('is-active', isActive);
        t.setAttribute('aria-pressed', isActive ? 'true' : 'false');
      });
    }

    thumbs.forEach((thumb) => {
      thumb.setAttribute('aria-pressed', thumb.classList.contains('is-active') ? 'true' : 'false');

      thumb.addEventListener('click', () => {
        const newSrc = thumb.getAttribute('data-src');
        if (!newSrc) return;

        // Đổi src ảnh bouquet trên postcard
        img.src = newSrc;

        // Đánh dấu active
        setActive(thumb);

        // Toast nhỏ cho biết đã chọn
        const name = thumb.getAttribute('data-name') || 'Bó hoa';
        if (typeof toast === 'function') {
          toast(`Đã chọn ${name}`, '💐');
        }
      });

      thumb.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          thumb.click();
        }
      });
    });
  }

  // ============================================================
  // 6. KHỞI TẠO
  // ============================================================
  function init() {
    addBackgroundFlowers();
    startPetalRain();
    startSparkleLayer();
    bindRecipientInput();
    bindBouquetPicker();
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