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
        test.onload = () => resolve(test);
        test.onerror = () => reject(new Error('Không tải được ảnh hoa'));
        test.src = src;
      });
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

    /**
     * Vẽ postcard ra canvas 1080x1350 (tỉ lệ 4:5 — Instagram-friendly).
     * Trả về Promise<HTMLCanvasElement>.
     */
    async function renderPostcardToCanvas() {
      const W = 1080;
      const H = 1700;
      const canvas = document.createElement('canvas');
      canvas.width = W;
      canvas.height = H;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Trình duyệt không hỗ trợ Canvas');

      const name = getRecipientName();

      // Đợi fonts sẵn sàng
      await Promise.all([
        ensureFontLoaded(FONT_DISPLAY),
        ensureFontLoaded(FONT_SCRIPT),
        ensureFontLoaded(FONT_BODY),
      ]);

      const imgSrc = img.src || img.dataset.src;
      if (!imgSrc) throw new Error('Không tìm thấy ảnh hoa');
      const bouquetImg = await ensureImageReady(imgSrc);

      // ---- Bước 1: Nền pastel gradient ----------------------------------
      const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
      bgGrad.addColorStop(0, '#fff8f5');
      bgGrad.addColorStop(0.5, '#fff0f5');
      bgGrad.addColorStop(1, '#fbe6ee');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, W, H);

      // ---- Bước 2: Khung postcard (bo tròn) ----------------------------
      const outerX = 40, outerY = 40, outerR = 50;
      const outerW = W - 80;
      const outerH = H - 80;

      // Outer card (gradient đậm hơn)
      const cardGrad = ctx.createLinearGradient(0, outerY, 0, outerY + outerH);
      cardGrad.addColorStop(0, '#ffeaf0');
      cardGrad.addColorStop(1, '#fbdde6');
      roundRect(ctx, outerX, outerY, outerW, outerH, outerR);
      ctx.fillStyle = cardGrad;
      ctx.fill();

      // Viền dashed
      ctx.save();
      ctx.lineWidth = 3;
      ctx.setLineDash([10, 12]);
      ctx.strokeStyle = 'rgba(198, 58, 114, 0.55)';
      const innerX = outerX + 28, innerY = outerY + 28;
      const innerW = outerW - 56, innerH = outerH - 56;
      roundRect(ctx, innerX, innerY, innerW, innerH, 36);
      ctx.stroke();
      ctx.restore();

      // 4 góc hoa ✿
      drawCornerDeco(ctx, '✿', innerX + 24, innerY + 24);
      drawCornerDeco(ctx, '✿', innerX + innerW - 24, innerY + 24, { align: 'right' });
      drawCornerDeco(ctx, '✿', innerX + 24, innerY + innerH - 24, { baseline: 'bottom' });
      drawCornerDeco(ctx, '✿', innerX + innerW - 24, innerY + innerH - 24, { align: 'right', baseline: 'bottom' });

      // ---- Bước 3: Header -----------------------------------------------
      const headerY = outerY + 80;
      const headerH = 90;

      // Stamp trái (gradient + hoa hồng emoji)
      const stampX = innerX + 50;
      const stampY = headerY;
      const stampSize = 96;
      const stampGrad = ctx.createLinearGradient(stampX, stampY, stampX + stampSize, stampY + stampSize);
      stampGrad.addColorStop(0, '#ffd6e0');
      stampGrad.addColorStop(1, '#ffb3c8');
      ctx.save();
      ctx.translate(stampX + stampSize / 2, stampY + stampSize / 2);
      ctx.rotate(-6 * Math.PI / 180);
      ctx.translate(-(stampX + stampSize / 2), -(stampY + stampSize / 2));
      roundRect(ctx, stampX, stampY, stampSize, stampSize, 18);
      ctx.fillStyle = stampGrad;
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font = '60px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🌹', stampX + stampSize / 2, stampY + stampSize / 2 + 4);
      ctx.restore();

      // Meta text giữa
      ctx.fillStyle = '#b7306a';
      ctx.font = `600 30px ${FONT_DISPLAY}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText("Happy Vietnamese Women's Day", innerX + innerW / 2, headerY + 36);

      ctx.fillStyle = '#c63a72';
      ctx.font = `700 38px ${FONT_DISPLAY}`;
      ctx.fillText('20 . 10 . 2026', innerX + innerW / 2, headerY + 76);

      // Đường gạch chân header
      ctx.save();
      ctx.setLineDash([]);
      ctx.strokeStyle = 'rgba(198, 58, 114, 0.25)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(innerX + 200, headerY + 130);
      ctx.lineTo(innerX + innerW - 200, headerY + 130);
      ctx.stroke();
      ctx.restore();

      // Tag đỏ góc phải
      const tagText = 'SPECIAL DAY';
      ctx.font = `700 26px ${FONT_DISPLAY}`;
      const tagW = ctx.measureText(tagText).width + 36;
      const tagH = 44;
      const tagX = innerX + innerW - 50 - tagW;
      const tagY = headerY + 20;
      const tagGrad = ctx.createLinearGradient(tagX, tagY, tagX, tagY + tagH);
      tagGrad.addColorStop(0, '#c63a72');
      tagGrad.addColorStop(1, '#a02e5b');
      roundRect(ctx, tagX, tagY, tagW, tagH, 10);
      ctx.fillStyle = tagGrad;
      ctx.fill();
      // Dot trắng
      ctx.beginPath();
      ctx.arc(tagX + 14, tagY + tagH / 2, 5, 0, Math.PI * 2);
      ctx.fillStyle = '#ffd6e0';
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'left';
      ctx.font = `700 24px ${FONT_DISPLAY}`;
      ctx.fillText(tagText, tagX + 28, tagY + tagH / 2 + 1);

      // ---- Bước 4: Ảnh bó hoa ------------------------------------------
      const photoX = innerX + 80;
      const photoY = headerY + 180;
      const photoW = innerW - 200;
      const photoSize = photoW; // vuông
      // Inner border trắng (khung trắng bao quanh ảnh)
      ctx.save();
      roundRect(ctx, photoX - 12, photoY - 12, photoSize + 24, photoSize + 24, 22);
      ctx.fillStyle = '#fff';
      ctx.fill();
      ctx.restore();

      // Tô nền pastel đẹp cho ảnh (phòng khi ảnh contain không lấp đầy khung)
      ctx.save();
      roundRect(ctx, photoX, photoY, photoSize, photoSize, 14);
      ctx.fillStyle = '#fff5f7';
      ctx.fill();
      ctx.restore();

      // Clip ảnh theo rounded rect, chừa border trắng
      ctx.save();
      roundRect(ctx, photoX + 4, photoY + 4, photoSize - 8, photoSize - 8, 10);
      ctx.clip();
      drawCoverImage(ctx, bouquetImg, photoX + 4, photoY + 4, photoSize - 8, photoSize - 8);
      ctx.restore();

      // Overlay caption "Một bó hoa được kết từ rất nhiều yêu thương"
      const captionText = 'Một bó hoa được kết từ rất nhiều yêu thương';
      ctx.font = `italic 500 30px ${FONT_SCRIPT}`;
      const capW = ctx.measureText(captionText).width + 80;
      const capH = 56;
      const capX = photoX + photoSize / 2 - capW / 2;
      const capY = photoY + photoSize - capH - 22;
      ctx.save();
      roundRect(ctx, capX, capY, capW, capH, capH / 2);
      ctx.fillStyle = 'rgba(40, 12, 25, 0.62)';
      ctx.fill();
      // ✦ ✦
      ctx.fillStyle = '#ffd6e0';
      ctx.font = '24px serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('✦', capX + 22, capY + capH / 2);
      ctx.fillText('✦', capX + capW - 22, capY + capH / 2);
      // Text
      ctx.fillStyle = '#fff5f7';
      ctx.font = `italic 500 30px ${FONT_SCRIPT}`;
      ctx.fillText(captionText, capX + capW / 2, capY + capH / 2 + 2);
      ctx.restore();

      // ---- Bước 5: Lời chúc -------------------------------------------
      const msgY = photoY + photoSize + 60;
      // "— Gửi đến —"
      ctx.fillStyle = '#c47190';
      ctx.font = `italic 500 38px ${FONT_SCRIPT}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText('— Gửi đến —', innerX + innerW / 2, msgY);

      // Tên người nhận (to đậm, viền pill vàng)
      ctx.font = `700 76px ${FONT_DISPLAY}`;
      const nameW = ctx.measureText(name).width;
      const nameBoxW = Math.min(Math.max(nameW + 100, innerW - 200), innerW - 80);
      const nameBoxH = 110;
      const nameBoxX = innerX + innerW / 2 - nameBoxW / 2;
      const nameBoxY = msgY + 58;
      const nameGrad = ctx.createLinearGradient(0, nameBoxY, 0, nameBoxY + nameBoxH);
      nameGrad.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
      nameGrad.addColorStop(1, 'rgba(255, 246, 240, 0.95)');
      roundRect(ctx, nameBoxX, nameBoxY, nameBoxW, nameBoxH, 22);
      ctx.fillStyle = nameGrad;
      ctx.fill();
      ctx.strokeStyle = '#f4d35e';
      ctx.lineWidth = 4;
      ctx.stroke();
      // Tên
      ctx.fillStyle = '#c63a72';
      ctx.font = `700 64px ${FONT_DISPLAY}`;
      ctx.textBaseline = 'middle';
      ctx.fillText(name, innerX + innerW / 2, nameBoxY + nameBoxH / 2);

      // Lời chúc với 🌷 hai bên
      const wishText1 = '🌷  Chúc ' + name + ' một ngày 20/10';
      const wishText2 = 'thật ý nghĩa, tràn đầy hoa và yêu thương  🌷';
      ctx.font = `italic 500 38px ${FONT_SCRIPT}`;
      ctx.fillStyle = '#5a3045';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      const wishY = nameBoxY + nameBoxH + 44;
      // Đo từng dòng — nếu dài, wrap đơn giản
      const maxWishWidth = innerW - 180;
      const lines1 = wrapLines(ctx, wishText1, maxWishWidth);
      const lines2 = wrapLines(ctx, wishText2, maxWishWidth);
      const wishLineHeight = 56;
      let lineY = wishY;
      lines1.forEach((ln) => { ctx.fillText(ln, innerX + innerW / 2, lineY); lineY += wishLineHeight; });
      lines2.forEach((ln) => { ctx.fillText(ln, innerX + innerW / 2, lineY); lineY += wishLineHeight; });
      // wishTotalHeight = (số dòng thực tế) * wishLineHeight, sau lineY
      const wishActualHeight = lineY - wishY;

      // ---- Bước 6: Footer ----------------------------------------------
      // Footer đặt SAU wish text với buffer đủ lớn — không bao giờ đè lên
      // wish hay nameBox. Nếu thiếu chỗ, đẩy footer xuống (không bao giờ lên).
      const wishEnd = wishY + wishActualHeight;
      const footerGap = 70;
      const footerY = wishEnd + footerGap;
      // Đảm bảo footer vẫn nằm gọn trong postcard (buffer dưới 60px)
      const maxFooterY = H - 100;
      const safeFooterY = Math.min(footerY, maxFooterY);

      // Hai gạch ngang hai bên
      const footText = 'Với tất cả yêu thương & trân trọng';
      ctx.font = `italic 500 32px ${FONT_SCRIPT}`;
      const ftW = ctx.measureText(footText).width;
      const lineLen = 60;
      const gap = 24; // khoảng cách giữa line và text
      const totalW = lineLen * 2 + gap * 2 + ftW;

      ctx.save();
      ctx.strokeStyle = 'rgba(198, 58, 114, 0.5)';
      ctx.lineWidth = 2;
      const startX = innerX + innerW / 2 - totalW / 2;
      const lineMid = safeFooterY + 18;
      ctx.beginPath();
      ctx.moveTo(startX, lineMid);
      ctx.lineTo(startX + lineLen, lineMid);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(startX + lineLen + gap * 2 + ftW, lineMid);
      ctx.lineTo(startX + lineLen + gap * 2 + ftW + lineLen, lineMid);
      ctx.stroke();
      ctx.restore();

      // Text baseline middle, vẽ đúng vị trí
      ctx.fillStyle = '#8a5a72';
      ctx.font = `italic 500 32px ${FONT_SCRIPT}`;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(footText, startX + lineLen + gap, lineMid);

      return canvas;
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
    async function downloadPostcard() {
      try {
        const canvas = await renderPostcardToCanvas();
        const dataUrl = canvas.toDataURL('image/png');
        const name = document.getElementById('recipient-name')?.value || '';
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
      try {
        const canvas = await renderPostcardToCanvas();
        const name = document.getElementById('recipient-name')?.value || '';
        const text = shareText(name);

        if (canvas.toBlob && navigator.canShare && navigator.share) {
          const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
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