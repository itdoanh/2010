/* ==========================================================================
   js/bouquet-engine.js
   ==========================================================================
   ENGINE render bó hoa nghệ thuật cao cấp.
   - 8 loại hoa SVG: Hồng Ohara, Mẫu đơn Peony, Hướng dương, Cẩm tú cầu,
     Mao lương Ranunculus, Tulip Hà Lan, Hoa Baby, Lá Khuynh diệp Eucalyptus
   - 4 themes (palette gradient)
   - 38 bông hoa/cành sắp xếp 7 lớp (giấy sau, lá nền, hoa nền,
     hoa trung tâm, hoa tiền cảnh, giấy trước + nơ, fairy lights)
   - Random arrangement từ seed hôm nay (365 mẫu)
   - Hỗ trợ shuffle & rebuild on theme change

   Public API: window.BouquetEngine
     .build(opts)            // render bó hoa với theme/seed hiện tại
     .setTheme(key)          // đổi theme, rebuild
     .shuffle(seed)          // random lại
     .setBreeze(on)          // bật/tắt gió
     .setLights(on)          // bật/tắt fairy lights
     .setPetals(on)          // bật/tắt mưa cánh hoa
   ========================================================================== */

(function () {
  'use strict';

  /* ============================================================
     1. THEMES — 4 palette màu
     ============================================================ */
  const THEMES = {
    pastelPink: {
      bg1: '#fff5f7', bg2: '#fce7f3', bg3: '#f3e8ff',
      paperOuter: ['#fbcfe8', '#f472b6'],
      paperMiddle: ['#fce7f3', '#f9a8d4'],
      paperInner: ['#fffbfc', '#ffe4e6'],
      goldTrim: '#f59e0b',
      ribbon: ['#ec4899', '#9d174d', '#fbcfe8'],
      rose1: ['#fff1f2', '#fda4af', '#f43f5e', '#881337'],
      rose2: ['#fdf2f8', '#f9a8d4', '#db2777', '#701a45'],
      peony: ['#fff0f6', '#fbcfe8', '#ec4899', '#9d174d'],
      ranunculus: ['#fff1f2', '#fecdd3', '#fb7185', '#be123c'],
      hydrangea1: ['#e0e7ff', '#a5b4fc', '#6366f1'],
      hydrangea2: ['#fce7f3', '#f9a8d4', '#ec4899'],
      tulip: ['#ffe4e6', '#fb7185', '#be123c'],
      sunflower: ['#fef08a', '#facc15', '#ca8a04', '#451a03'],
      petalFall: ['#fbcfe8', '#fda4af', '#f9a8d4', '#ffe4e6']
    },
    rubyRed: {
      bg1: '#fff1f2', bg2: '#ffe4e6', bg3: '#fecdd3',
      paperOuter: ['#27272a', '#09090b'],
      paperMiddle: ['#450a0a', '#7f1d1d'],
      paperInner: ['#fff1f2', '#fecdd3'],
      goldTrim: '#fbbf24',
      ribbon: ['#dc2626', '#7f1d1d', '#fca5a5'],
      rose1: ['#ffe4e6', '#f43f5e', '#dc2626', '#450a0a'],
      rose2: ['#fecdd3', '#fb7185', '#be123c', '#4c0519'],
      peony: ['#fff1f2', '#fda4af', '#e11d48', '#881337'],
      ranunculus: ['#fef3c7', '#fca5a5', '#ef4444', '#7f1d1d'],
      hydrangea1: ['#fef3c7', '#fde68a', '#d97706'],
      hydrangea2: ['#ffe4e6', '#fda4af', '#be123c'],
      tulip: ['#fee2e2', '#ef4444', '#991b1b'],
      sunflower: ['#fef08a', '#f59e0b', '#b45309', '#3b0764'],
      petalFall: ['#ef4444', '#dc2626', '#fda4af', '#fecdd3']
    },
    sunshineGold: {
      bg1: '#fefce8', bg2: '#fef3c7', bg3: '#ffedd5',
      paperOuter: ['#fde68a', '#f59e0b'],
      paperMiddle: ['#fef3c7', '#fbbf24'],
      paperInner: ['#fffbeb', '#fef3c7'],
      goldTrim: '#b45309',
      ribbon: ['#d97706', '#78350f', '#fde68a'],
      rose1: ['#fef9c3', '#fde047', '#eab308', '#713f12'],
      rose2: ['#ffedd5', '#fdba74', '#f97316', '#7c2d12'],
      peony: ['#fffbeb', '#fde68a', '#fb923c', '#c2410c'],
      ranunculus: ['#fef08a', '#fdba74', '#ea580c', '#7c2d12'],
      hydrangea1: ['#ecfccb', '#bef264', '#65a30d'],
      hydrangea2: ['#fef3c7', '#fcd34d', '#d97706'],
      tulip: ['#ffedd5', '#fb923c', '#c2410c'],
      sunflower: ['#fef08a', '#facc15', '#ca8a04', '#422006'],
      petalFall: ['#fde047', '#fdba74', '#fef08a', '#fed7aa']
    },
    dreamyPurple: {
      bg1: '#faf5ff', bg2: '#f3e8ff', bg3: '#e0e7ff',
      paperOuter: ['#c4b5fd', '#7c3aed'],
      paperMiddle: ['#e9d5ff', '#a855f7'],
      paperInner: ['#faf5ff', '#f3e8ff'],
      goldTrim: '#f59e0b',
      ribbon: ['#9333ea', '#4c1d95', '#e9d5ff'],
      rose1: ['#f5f3ff', '#c4b5fd', '#8b5cf6', '#3b0764'],
      rose2: ['#fdf4ff', '#f0abfc', '#c026d3', '#4a044e'],
      peony: ['#faf5ff', '#e9d5ff', '#a855f7', '#581c87'],
      ranunculus: ['#fce7f3', '#e879f9', '#9333ea', '#3b0764'],
      hydrangea1: ['#e0e7ff', '#a5b4fc', '#4f46e5'],
      hydrangea2: ['#fae8ff', '#e879f9', '#86198f'],
      tulip: ['#f3e8ff', '#c084fc', '#6b21a8'],
      sunflower: ['#fef9c3', '#fde047', '#ca8a04', '#3b0764'],
      petalFall: ['#d8b4fe', '#c4b5fd', '#f0abfc', '#ede9fe']
    }
  };

  /* ============================================================
     2. SEEDED RNG (mulberry32) - cho random có kiểm soát
     ============================================================ */
  function seededRNG(seed) {
    let s = (seed >>> 0) || 1;
    return function () {
      s = (s + 0x6D2B79F5) >>> 0;
      let t = s;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function dayOfYear() {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    const diff = now - start;
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  }

  /* ============================================================
     3. SVG DEFS — Gradient + filter definitions
     ============================================================ */
  function buildDefs(theme) {
    return `
      <filter id="drop-flower" x="-25%" y="-25%" width="150%" height="150%">
        <feDropShadow dx="0" dy="7" stdDeviation="6" flood-color="#280517" flood-opacity="0.24"/>
      </filter>
      <filter id="drop-petal" x="-15%" y="-15%" width="130%" height="130%">
        <feDropShadow dx="0" dy="1.5" stdDeviation="1.5" flood-color="#280517" flood-opacity="0.16"/>
      </filter>
      <filter id="drop-paper" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="10" stdDeviation="10" flood-color="#280517" flood-opacity="0.18"/>
      </filter>

      <linearGradient id="grad-paper-outer" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${theme.paperOuter[0]}"/>
        <stop offset="100%" stop-color="${theme.paperOuter[1]}"/>
      </linearGradient>
      <linearGradient id="grad-paper-mid" x1="0%" y1="0%" x2="100%" y2="80%">
        <stop offset="0%" stop-color="${theme.paperMiddle[0]}"/>
        <stop offset="100%" stop-color="${theme.paperMiddle[1]}"/>
      </linearGradient>
      <linearGradient id="grad-paper-inner" x1="0%" y1="0%" x2="50%" y2="100%">
        <stop offset="0%" stop-color="${theme.paperInner[0]}"/>
        <stop offset="100%" stop-color="${theme.paperInner[1]}"/>
      </linearGradient>

      <linearGradient id="grad-ribbon" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${theme.ribbon[2]}"/>
        <stop offset="45%" stop-color="${theme.ribbon[0]}"/>
        <stop offset="100%" stop-color="${theme.ribbon[1]}"/>
      </linearGradient>

      <radialGradient id="grad-rose-1" cx="50%" cy="45%" r="55%">
        <stop offset="0%" stop-color="${theme.rose1[3]}"/>
        <stop offset="35%" stop-color="${theme.rose1[2]}"/>
        <stop offset="75%" stop-color="${theme.rose1[1]}"/>
        <stop offset="100%" stop-color="${theme.rose1[0]}"/>
      </radialGradient>
      <radialGradient id="grad-rose-2" cx="50%" cy="45%" r="55%">
        <stop offset="0%" stop-color="${theme.rose2[3]}"/>
        <stop offset="38%" stop-color="${theme.rose2[2]}"/>
        <stop offset="78%" stop-color="${theme.rose2[1]}"/>
        <stop offset="100%" stop-color="${theme.rose2[0]}"/>
      </radialGradient>
      <radialGradient id="grad-peony" cx="50%" cy="50%" r="55%">
        <stop offset="0%" stop-color="${theme.peony[3]}"/>
        <stop offset="35%" stop-color="${theme.peony[2]}"/>
        <stop offset="72%" stop-color="${theme.peony[1]}"/>
        <stop offset="100%" stop-color="${theme.peony[0]}"/>
      </radialGradient>
      <radialGradient id="grad-ranunculus" cx="50%" cy="50%" r="55%">
        <stop offset="0%" stop-color="${theme.ranunculus[3]}"/>
        <stop offset="40%" stop-color="${theme.ranunculus[2]}"/>
        <stop offset="78%" stop-color="${theme.ranunculus[1]}"/>
        <stop offset="100%" stop-color="${theme.ranunculus[0]}"/>
      </radialGradient>
      <linearGradient id="grad-sunflower-petal" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="${theme.sunflower[0]}"/>
        <stop offset="60%" stop-color="${theme.sunflower[1]}"/>
        <stop offset="100%" stop-color="${theme.sunflower[2]}"/>
      </linearGradient>
      <radialGradient id="grad-sunflower-center" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="#1c1917"/>
        <stop offset="65%" stop-color="${theme.sunflower[3]}"/>
        <stop offset="88%" stop-color="#b45309"/>
        <stop offset="100%" stop-color="#f59e0b"/>
      </radialGradient>
      <radialGradient id="grad-hydrangea-1" cx="50%" cy="50%" r="55%">
        <stop offset="0%" stop-color="${theme.hydrangea1[2]}"/>
        <stop offset="55%" stop-color="${theme.hydrangea1[1]}"/>
        <stop offset="100%" stop-color="${theme.hydrangea1[0]}"/>
      </radialGradient>
      <radialGradient id="grad-hydrangea-2" cx="50%" cy="50%" r="55%">
        <stop offset="0%" stop-color="${theme.hydrangea2[2]}"/>
        <stop offset="55%" stop-color="${theme.hydrangea2[1]}"/>
        <stop offset="100%" stop-color="${theme.hydrangea2[0]}"/>
      </radialGradient>
      <linearGradient id="grad-tulip" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="${theme.tulip[0]}"/>
        <stop offset="55%" stop-color="${theme.tulip[1]}"/>
        <stop offset="100%" stop-color="${theme.tulip[2]}"/>
      </linearGradient>
      <linearGradient id="grad-leaf-euca" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#6ee7b7"/>
        <stop offset="50%" stop-color="#059669"/>
        <stop offset="100%" stop-color="#064e3b"/>
      </linearGradient>
      <linearGradient id="grad-leaf-sage" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#a7f3d0"/>
        <stop offset="60%" stop-color="#10b981"/>
        <stop offset="100%" stop-color="#047857"/>
      </linearGradient>
    `;
  }

  /* ============================================================
     4. CÁC HÀM VẼ TỪNG LOÀI HOA
     (Mỗi loài có 1 hàm riêng trả về SVG string)
     ============================================================ */

  // 4.1. Hoa Hồng Ohara Đa Tầng Cánh Xoáy
  function createRoseSVG(cx, cy, radius, gradId = 'grad-rose-1', rotation = 0) {
    let petals = '';
    const layers = [
      { count: 9, dist: radius * 0.62, rx: radius * 0.46, ry: radius * 0.34, rotOffset: 0 },
      { count: 8, dist: radius * 0.46, rx: radius * 0.38, ry: radius * 0.28, rotOffset: 22 },
      { count: 7, dist: radius * 0.31, rx: radius * 0.30, ry: radius * 0.22, rotOffset: 45 },
      { count: 6, dist: radius * 0.18, rx: radius * 0.21, ry: radius * 0.16, rotOffset: 15 },
      { count: 4, dist: radius * 0.07, rx: radius * 0.13, ry: radius * 0.10, rotOffset: 60 }
    ];

    layers.forEach((layer) => {
      for (let i = 0; i < layer.count; i++) {
        const angle = (i * 360 / layer.count) + layer.rotOffset;
        const rad = (angle * Math.PI) / 180;
        const px = Math.cos(rad) * layer.dist;
        const py = Math.sin(rad) * layer.dist;
        const w = layer.rx;
        const h = layer.ry;
        const d = `
          M ${-w} 0
          C ${-w} ${-h * 1.15}, ${-w * 0.2} ${-h * 1.35}, 0 ${-h * 1.15}
          C ${w * 0.2} ${-h * 1.35}, ${w} ${-h * 1.15}, ${w} 0
          C ${w * 0.85} ${h * 0.95}, ${-w * 0.85} ${h * 0.95}, ${-w} 0 Z
        `;
        petals += `
          <g transform="translate(${px.toFixed(1)}, ${py.toFixed(1)}) rotate(${angle + 90})">
            <path d="${d}" fill="url(#${gradId})" filter="url(#drop-petal)" stroke="rgba(255,255,255,0.5)" stroke-width="0.7"/>
          </g>
        `;
      }
    });

    return `
      <g class="flower-hit" data-type="rose" transform="translate(${cx}, ${cy}) rotate(${rotation})" data-cx="${cx}" data-cy="${cy}" filter="url(#drop-flower)">
        <g class="flower-anim">
          ${petals}
          <circle cx="0" cy="0" r="${radius * 0.11}" fill="url(#${gradId})"/>
          <circle cx="${-radius * 0.25}" cy="${-radius * 0.22}" r="3.2" fill="#ffffff" opacity="0.82"/>
        </g>
      </g>
    `;
  }

  // 4.2. Hoa Mẫu Đơn Khổng Lồ (Lush Ruffled Peony)
  function createPeonySVG(cx, cy, radius, gradId = 'grad-peony') {
    let content = '';
    const rings = [
      { count: 14, dist: radius * 0.64, size: radius * 0.44 },
      { count: 12, dist: radius * 0.46, size: radius * 0.36 },
      { count: 10, dist: radius * 0.29, size: radius * 0.28 },
      { count: 8,  dist: radius * 0.14, size: radius * 0.20 }
    ];

    rings.forEach((ring, rIdx) => {
      for (let i = 0; i < ring.count; i++) {
        const angle = (i * 360 / ring.count) + (rIdx * 17);
        const rad = (angle * Math.PI) / 180;
        const px = Math.cos(rad) * ring.dist;
        const py = Math.sin(rad) * ring.dist;
        const s = ring.size;
        const ruffledPath = `
          M 0 ${s * 0.6}
          C ${-s * 0.8} ${s * 0.4}, ${-s * 0.95} ${-s * 0.4}, ${-s * 0.5} ${-s * 0.85}
          Q ${-s * 0.25} ${-s * 1.05}, 0 ${-s * 0.85}
          Q ${s * 0.25} ${-s * 1.05}, ${s * 0.5} ${-s * 0.85}
          C ${s * 0.95} ${-s * 0.4}, ${s * 0.8} ${s * 0.4}, 0 ${s * 0.6} Z
        `;
        content += `
          <g transform="translate(${px.toFixed(1)}, ${py.toFixed(1)}) rotate(${angle + 90})">
            <path d="${ruffledPath}" fill="url(#${gradId})" filter="url(#drop-petal)" stroke="rgba(255,255,255,0.55)" stroke-width="0.65"/>
          </g>
        `;
      }
    });

    let stamens = '';
    for (let i = 0; i < 18; i++) {
      const a = (i * 20) * Math.PI / 180;
      const r = (i % 2 === 0) ? radius * 0.15 : radius * 0.09;
      const sx = Math.cos(a) * r;
      const sy = Math.sin(a) * r;
      stamens += `
        <line x1="0" y1="0" x2="${sx.toFixed(1)}" y2="${sy.toFixed(1)}" stroke="#f59e0b" stroke-width="1.3"/>
        <circle cx="${sx.toFixed(1)}" cy="${sy.toFixed(1)}" r="2.4" fill="#fef08a" stroke="#d97706" stroke-width="0.6"/>
      `;
    }

    return `
      <g class="flower-hit" data-type="peony" transform="translate(${cx}, ${cy})" data-cx="${cx}" data-cy="${cy}" filter="url(#drop-flower)">
        <g class="flower-anim">
          ${content}
          <g>${stamens}</g>
        </g>
      </g>
    `;
  }

  // 4.3. Hoa Mao Lương Xoáy Dày Cánh (Ranunculus)
  function createRanunculusSVG(cx, cy, radius, gradId = 'grad-ranunculus', rotation = 0) {
    let petals = '';
    const rings = [
      { count: 14, dist: radius * 0.62, r: radius * 0.34 },
      { count: 12, dist: radius * 0.46, r: radius * 0.29 },
      { count: 10, dist: radius * 0.32, r: radius * 0.24 },
      { count: 8,  dist: radius * 0.19, r: radius * 0.18 },
      { count: 6,  dist: radius * 0.08, r: radius * 0.12 }
    ];
    rings.forEach((ring, rIdx) => {
      for (let i = 0; i < ring.count; i++) {
        const angle = (i * 360 / ring.count) + rIdx * 19;
        const rad = (angle * Math.PI) / 180;
        const px = Math.cos(rad) * ring.dist;
        const py = Math.sin(rad) * ring.dist;
        petals += `
          <g transform="translate(${px.toFixed(1)}, ${py.toFixed(1)}) rotate(${angle + 90})">
            <ellipse cx="0" cy="0" rx="${ring.r}" ry="${ring.r * 0.68}" fill="url(#${gradId})" filter="url(#drop-petal)" stroke="rgba(255,255,255,0.55)" stroke-width="0.65"/>
          </g>
        `;
      }
    });

    return `
      <g class="flower-hit" data-type="ranunculus" transform="translate(${cx}, ${cy}) rotate(${rotation})" data-cx="${cx}" data-cy="${cy}" filter="url(#drop-flower)">
        <g class="flower-anim">
          ${petals}
          <circle cx="0" cy="0" r="${radius * 0.09}" fill="#ecfccb"/>
        </g>
      </g>
    `;
  }

  // 4.4. Hoa Hướng Dương Nhụy Fibonacci
  function createSunflowerSVG(cx, cy, radius) {
    let petals = '';
    const count = 24;
    for (let layer = 0; layer < 2; layer++) {
      for (let i = 0; i < count; i++) {
        const angle = (i * 360 / count) + (layer * 7.5);
        const pLen = radius * (layer === 0 ? 0.98 : 0.88);
        const pWid = radius * 0.17;
        const d = `
          M 0 ${-radius * 0.25}
          C ${-pWid} ${-pLen * 0.55}, ${-pWid * 0.85} ${-pLen * 0.9}, 0 ${-pLen}
          C ${pWid * 0.85} ${-pLen * 0.9}, ${pWid} ${-pLen * 0.55}, 0 ${-radius * 0.25} Z
        `;
        petals += `
          <g transform="rotate(${angle})">
            <path d="${d}" fill="url(#grad-sunflower-petal)" filter="url(#drop-petal)" stroke="#fef08a" stroke-width="0.5"/>
          </g>
        `;
      }
    }

    let seeds = '';
    const seedCount = 55;
    const goldenAngle = 137.5 * (Math.PI / 180);
    for (let i = 1; i <= seedCount; i++) {
      const r = (radius * 0.34) * Math.sqrt(i / seedCount);
      const theta = i * goldenAngle;
      const sx = r * Math.cos(theta);
      const sy = r * Math.sin(theta);
      const seedColor = i > 38 ? '#fbbf24' : (i % 2 === 0 ? '#78350f' : '#451a03');
      seeds += `<circle cx="${sx.toFixed(1)}" cy="${sy.toFixed(1)}" r="${i > 40 ? 2.1 : 1.7}" fill="${seedColor}"/>`;
    }

    return `
      <g class="flower-hit" data-type="sunflower" transform="translate(${cx}, ${cy})" data-cx="${cx}" data-cy="${cy}" filter="url(#drop-flower)">
        <g class="flower-anim">
          ${petals}
          <circle cx="0" cy="0" r="${radius * 0.38}" fill="url(#grad-sunflower-center)" stroke="#d97706" stroke-width="2"/>
          ${seeds}
        </g>
      </g>
    `;
  }

  // 4.5. Chùm Hoa Cẩm Tú Cầu
  function createHydrangeaSVG(cx, cy, radius, gradId = 'grad-hydrangea-1') {
    let florets = '';
    const positions = [
      {x: 0, y: 0},
      {x: -0.45, y: -0.25}, {x: 0.45, y: -0.25}, {x: 0, y: -0.52},
      {x: -0.48, y: 0.28}, {x: 0.48, y: 0.28}, {x: 0, y: 0.52},
      {x: -0.25, y: -0.42}, {x: 0.25, y: -0.42},
      {x: -0.62, y: 0}, {x: 0.62, y: 0},
      {x: -0.25, y: 0.42}, {x: 0.25, y: 0.42},
      {x: -0.22, y: -0.12}, {x: 0.22, y: -0.12}, {x: 0, y: 0.22}
    ];

    const fSize = radius * 0.26;
    positions.forEach((pos, idx) => {
      const fx = pos.x * radius;
      const fy = pos.y * radius;
      const rot = (idx * 37) % 90;

      let fourPetals = '';
      for (let p = 0; p < 4; p++) {
        const pAngle = p * 90 + rot;
        fourPetals += `
          <g transform="rotate(${pAngle})">
            <ellipse cx="0" cy="${-fSize * 0.68}" rx="${fSize * 0.52}" ry="${fSize * 0.62}" fill="url(#${gradId})" stroke="rgba(255,255,255,0.65)" stroke-width="0.6"/>
          </g>
        `;
      }
      florets += `
        <g transform="translate(${fx.toFixed(1)}, ${fy.toFixed(1)})" filter="url(#drop-petal)">
          ${fourPetals}
          <circle cx="0" cy="0" r="2.2" fill="#fef9c3"/>
        </g>
      `;
    });

    return `
      <g class="flower-hit" data-type="hydrangea" transform="translate(${cx}, ${cy})" data-cx="${cx}" data-cy="${cy}" filter="url(#drop-flower)">
        <g class="flower-anim">
          ${florets}
        </g>
      </g>
    `;
  }

  // 4.6. Hoa Tulip Hà Lan
  function createTulipSVG(cx, cy, size, angle = 0) {
    const w = size * 0.58;
    const h = size;
    return `
      <g class="flower-hit" data-type="tulip" transform="translate(${cx}, ${cy}) rotate(${angle})" data-cx="${cx}" data-cy="${cy}" filter="url(#drop-flower)">
        <g class="flower-anim">
          <path d="M 0 ${-h * 0.65} C ${-w * 0.65} ${-h * 0.4}, ${-w * 0.65} ${h * 0.35}, 0 ${h * 0.45} C ${w * 0.65} ${h * 0.35}, ${w * 0.65} ${-h * 0.4}, 0 ${-h * 0.65} Z"
                fill="url(#grad-tulip)" stroke="rgba(255,255,255,0.45)" stroke-width="0.8"/>
          <path d="M ${-w * 0.15} ${h * 0.45} C ${-w * 1.05} ${h * 0.3}, ${-w * 0.95} ${-h * 0.35}, ${-w * 0.35} ${-h * 0.58} C ${-w * 0.05} ${-h * 0.3}, ${-w * 0.05} ${h * 0.2}, ${-w * 0.15} ${h * 0.45} Z"
                fill="url(#grad-tulip)" filter="url(#drop-petal)" stroke="rgba(255,255,255,0.55)" stroke-width="0.8"/>
          <path d="M ${w * 0.15} ${h * 0.45} C ${w * 1.05} ${h * 0.3}, ${w * 0.95} ${-h * 0.35}, ${w * 0.35} ${-h * 0.58} C ${w * 0.05} ${-h * 0.3}, ${w * 0.05} ${h * 0.2}, ${w * 0.15} ${h * 0.45} Z"
                fill="url(#grad-tulip)" filter="url(#drop-petal)" stroke="rgba(255,255,255,0.55)" stroke-width="0.8"/>
        </g>
      </g>
    `;
  }

  // 4.7. Cành Hoa Baby Trắng
  function createBabysBreathSVG(cx, cy, spread, angle = 0) {
    let branches = '';
    let blossoms = '';
    const nodes = [
      {x: 0, y: -spread},
      {x: -spread * 0.55, y: -spread * 0.75},
      {x: spread * 0.55, y: -spread * 0.75},
      {x: -spread * 0.8, y: -spread * 0.4},
      {x: spread * 0.8, y: -spread * 0.4},
      {x: -spread * 0.3, y: -spread * 1.15},
      {x: spread * 0.3, y: -spread * 1.15},
      {x: 0, y: -spread * 0.55}
    ];

    nodes.forEach((pt) => {
      branches += `<path d="M 0 0 Q ${(pt.x * 0.4).toFixed(1)} ${(pt.y * 0.6).toFixed(1)} ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}" stroke="#86efac" stroke-width="1.5" fill="none" opacity="0.85"/>`;
      const subOffsets = [{dx: 0, dy: 0, r: 5.8}, {dx: -6.5, dy: -4, r: 4.5}, {dx: 6.5, dy: -3, r: 4.8}];
      subOffsets.forEach(sub => {
        const bx = pt.x + sub.dx;
        const by = pt.y + sub.dy;
        blossoms += `
          <g transform="translate(${bx.toFixed(1)}, ${by.toFixed(1)})">
            <circle cx="0" cy="${-sub.r*0.6}" r="${sub.r*0.55}" fill="#ffffff"/>
            <circle cx="${-sub.r*0.55}" cy="${-sub.r*0.15}" r="${sub.r*0.55}" fill="#ffffff"/>
            <circle cx="${sub.r*0.55}" cy="${-sub.r*0.15}" r="${sub.r*0.55}" fill="#ffffff"/>
            <circle cx="${-sub.r*0.35}" cy="${sub.r*0.5}" r="${sub.r*0.55}" fill="#ffffff"/>
            <circle cx="${sub.r*0.35}" cy="${sub.r*0.5}" r="${sub.r*0.55}" fill="#ffffff"/>
            <circle cx="0" cy="0" r="${sub.r*0.35}" fill="#fef3c7"/>
          </g>
        `;
      });
    });

    return `
      <g class="flower-hit" data-type="baby" transform="translate(${cx}, ${cy}) rotate(${angle})" data-cx="${cx}" data-cy="${cy}" filter="url(#drop-petal)">
        <g class="flower-anim">
          ${branches}
          ${blossoms}
        </g>
      </g>
    `;
  }

  // 4.8. Cành Lá Khuynh Diệp
  function createEucalyptusStemSVG(x, y, length, angle) {
    let leaves = '';
    const pairs = 5;
    for (let i = 1; i <= pairs; i++) {
      const t = i / (pairs + 0.5);
      const ly = -length * t;
      const lSize = (1 - t * 0.42) * 26;
      leaves += `
        <g transform="translate(0, ${ly.toFixed(1)})">
          <ellipse cx="${-lSize * 0.85}" cy="-4" rx="${lSize}" ry="${lSize * 0.62}" transform="rotate(-28, ${-lSize * 0.85}, -4)" fill="url(#grad-leaf-euca)" stroke="#a7f3d0" stroke-width="0.6"/>
          <ellipse cx="${lSize * 0.85}" cy="-10" rx="${lSize}" ry="${lSize * 0.62}" transform="rotate(28, ${lSize * 0.85}, -10)" fill="url(#grad-leaf-sage)" stroke="#a7f3d0" stroke-width="0.6"/>
        </g>
      `;
    }
    leaves += `<ellipse cx="0" cy="${-length}" rx="16" ry="22" fill="url(#grad-leaf-euca)" stroke="#a7f3d0" stroke-width="0.6"/>`;

    return `
      <g transform="translate(${x}, ${y}) rotate(${angle})" filter="url(#drop-petal)">
        <g class="leaf-anim">
          <line x1="0" y1="0" x2="0" y2="${-length}" stroke="#065f46" stroke-width="3" stroke-linecap="round"/>
          ${leaves}
        </g>
      </g>
    `;
  }

  /* ============================================================
     5. GIẤY GÓI HÀN QUỐC & NƠ LỤA
     ============================================================ */
  function renderWrappingPaper(theme) {
    const backPaperHTML = `
      <g filter="url(#drop-paper)">
        <path d="M 440 690 L 90 310 Q 75 225 160 205 L 305 135 Q 375 115 415 190 L 470 670 Z"
              fill="url(#grad-paper-outer)" stroke="${theme.goldTrim}" stroke-opacity="0.45" stroke-width="2"/>
        <path d="M 460 690 L 810 310 Q 825 225 740 205 L 595 135 Q 525 115 485 190 L 430 670 Z"
              fill="url(#grad-paper-outer)" stroke="${theme.goldTrim}" stroke-opacity="0.45" stroke-width="2"/>
        <path d="M 255 215 Q 450 65 645 215 L 520 675 L 380 675 Z"
              fill="url(#grad-paper-mid)" stroke="${theme.goldTrim}" stroke-opacity="0.4" stroke-width="1.8"/>
        <path d="M 155 275 Q 300 140 450 195 Q 600 140 745 275 L 515 675 L 385 675 Z"
              fill="url(#grad-paper-inner)" opacity="0.92"/>
      </g>
    `;

    const frontPaperHTML = `
      <g filter="url(#drop-paper)">
        <path d="M 380 685 L 280 885 Q 370 920 450 905 Q 530 920 620 885 L 520 685 Z"
              fill="url(#grad-paper-outer)" stroke="${theme.goldTrim}" stroke-opacity="0.45" stroke-width="2"/>
        <path d="M 400 695 L 335 895 Q 450 925 565 895 L 500 695 Z"
              fill="url(#grad-paper-inner)"/>

        <path d="M 120 420 Q 235 360 355 495 L 435 705 L 365 710 Q 220 595 120 420 Z"
              fill="url(#grad-paper-inner)" stroke="${theme.goldTrim}" stroke-opacity="0.4" stroke-width="1.6"/>
        <path d="M 165 510 Q 290 460 405 585 L 460 715 L 375 720 Q 245 645 165 510 Z"
              fill="url(#grad-paper-outer)"/>

        <path d="M 780 420 Q 665 360 545 495 L 465 705 L 535 710 Q 680 595 780 420 Z"
              fill="url(#grad-paper-inner)" stroke="${theme.goldTrim}" stroke-opacity="0.4" stroke-width="1.6"/>
        <path d="M 735 510 Q 610 460 495 585 L 440 715 L 525 720 Q 655 645 735 510 Z"
              fill="url(#grad-paper-outer)"/>

        <path d="M 300 565 Q 450 645 600 565 L 530 715 L 370 715 Z"
              fill="url(#grad-paper-inner)" stroke="${theme.goldTrim}" stroke-opacity="0.5" stroke-width="2"/>

        <path d="M 435 715 C 400 790, 355 855, 325 935 L 370 925 C 395 855, 425 790, 450 720 Z"
              fill="url(#grad-ribbon)"/>
        <path d="M 465 715 C 500 790, 545 855, 575 935 L 530 925 C 505 855, 475 790, 450 720 Z"
              fill="url(#grad-ribbon)"/>

        <rect x="370" y="690" width="160" height="34" rx="17" fill="url(#grad-ribbon)" stroke="rgba(255,255,255,0.55)" stroke-width="1.2"/>

        <path d="M 440 705 C 345 625, 275 675, 305 735 C 325 770, 400 755, 440 712 Z"
              fill="url(#grad-ribbon)" stroke="rgba(255,255,255,0.5)" stroke-width="1.2"/>
        <path d="M 428 705 C 372 670, 330 695, 345 722 C 358 738, 400 730, 428 710 Z"
              fill="rgba(0,0,0,0.15)"/>

        <path d="M 460 705 C 555 625, 625 675, 595 735 C 575 770, 500 755, 460 712 Z"
              fill="url(#grad-ribbon)" stroke="rgba(255,255,255,0.5)" stroke-width="1.2"/>
        <path d="M 472 705 C 528 670, 570 695, 555 722 C 542 738, 500 730, 472 710 Z"
              fill="rgba(0,0,0,0.15)"/>

        <rect x="427" y="684" width="46" height="46" rx="15" fill="url(#grad-ribbon)" stroke="rgba(255,255,255,0.65)" stroke-width="1.5"/>
        <circle cx="450" cy="707" r="9" fill="#fef3c7" stroke="#f59e0b" stroke-width="2"/>
        <circle cx="447" cy="704" r="3" fill="#ffffff"/>
      </g>
    `;

    document.getElementById('layer-paper-back').innerHTML = backPaperHTML;
    document.getElementById('layer-paper-front').innerHTML = frontPaperHTML;
  }

  /* ============================================================
     6. FAIRY LIGHTS
     ============================================================ */
  function renderFairyLights() {
    const container = document.getElementById('layer-fairy-lights');
    const wires = `
      <path d="M 220 470 Q 340 310 460 395 T 700 410" fill="none" stroke="#fde68a" stroke-width="1.2" stroke-dasharray="4 4" opacity="0.75"/>
      <path d="M 255 320 Q 450 185 655 310" fill="none" stroke="#fde68a" stroke-width="1.2" stroke-dasharray="4 4" opacity="0.75"/>
      <path d="M 285 555 Q 450 475 625 565" fill="none" stroke="#fde68a" stroke-width="1.2" stroke-dasharray="4 4" opacity="0.75"/>
    `;

    const lightCoords = [
      {x: 240, y: 445}, {x: 310, y: 365}, {x: 395, y: 345}, {x: 450, y: 390},
      {x: 530, y: 425}, {x: 615, y: 395}, {x: 685, y: 415},
      {x: 280, y: 295}, {x: 365, y: 235}, {x: 450, y: 210}, {x: 545, y: 235}, {x: 625, y: 295},
      {x: 315, y: 540}, {x: 405, y: 515}, {x: 495, y: 515}, {x: 590, y: 545},
      {x: 350, y: 440}, {x: 555, y: 340}, {x: 450, y: 590}
    ];

    const bulbs = lightCoords.map((pt, idx) => {
      const delay = ((idx * 0.27) % 2.4).toFixed(2);
      return `
        <g transform="translate(${pt.x}, ${pt.y})">
          <g class="fairy-light-bulb" style="animation-delay: ${delay}s">
            <circle cx="0" cy="0" r="11" fill="#fef08a" opacity="0.38"/>
            <circle cx="0" cy="0" r="6" fill="#fde047" opacity="0.75"/>
            <circle cx="0" cy="0" r="3" fill="#ffffff"/>
          </g>
        </g>
      `;
    }).join('');

    container.innerHTML = wires + bulbs;
  }

  /* ============================================================
     7. DỰNG TOÀN BỘ BÓ HOA (38 bông & cụm)
     ============================================================ */
  function buildBouquet(themeKey, seed) {
    const theme = THEMES[themeKey];
    const rnd = seededRNG(seed);

    // Update page bg
    document.documentElement.style.setProperty('--bg-grad-1', theme.bg1);
    document.documentElement.style.setProperty('--bg-grad-2', theme.bg2);
    document.documentElement.style.setProperty('--bg-grad-3', theme.bg3);

    // 1. Defs (gradients/filters)
    document.getElementById('svg-defs').innerHTML = buildDefs(theme);

    // 2. Giấy gói
    renderWrappingPaper(theme);

    // 3. Lớp đệm lá xanh + 9 cành lá
    const greenCushion = `
      <ellipse cx="450" cy="400" rx="245" ry="175" fill="#064e3b" opacity="0.95"/>
      <ellipse cx="450" cy="435" rx="205" ry="150" fill="#047857" opacity="0.9"/>
      <g stroke="#065f46" stroke-width="5" stroke-linecap="round" opacity="0.85">
        <line x1="270" y1="445" x2="442" y2="695"/>
        <line x1="330" y1="420" x2="435" y2="695"/>
        <line x1="390" y1="390" x2="442" y2="695"/>
        <line x1="450" y1="370" x2="450" y2="695"/>
        <line x1="510" y1="390" x2="458" y2="695"/>
        <line x1="570" y1="420" x2="465" y2="695"/>
        <line x1="630" y1="445" x2="458" y2="695"/>
      </g>
    `;

    // Random góc nghiêng lá (từ rng)
    const foliageStems = [
      { x: 280, y: 375, len: 225 + rnd() * 20, angle: -44 + rnd() * 6 - 3 },
      { x: 355, y: 295, len: 235 + rnd() * 20, angle: -22 + rnd() * 6 - 3 },
      { x: 450, y: 275, len: 245 + rnd() * 20, angle: 0 },
      { x: 545, y: 295, len: 235 + rnd() * 20, angle: 22 + rnd() * 6 - 3 },
      { x: 620, y: 375, len: 225 + rnd() * 20, angle: 44 + rnd() * 6 - 3 },
      { x: 220, y: 470, len: 195 + rnd() * 15, angle: -64 + rnd() * 4 - 2 },
      { x: 680, y: 470, len: 195 + rnd() * 15, angle: 64 + rnd() * 4 - 2 },
      { x: 315, y: 520, len: 165 + rnd() * 15, angle: -30 + rnd() * 6 - 3 },
      { x: 585, y: 520, len: 165 + rnd() * 15, angle: 30 + rnd() * 6 - 3 }
    ];
    document.getElementById('layer-foliage-back').innerHTML = greenCushion +
      foliageStems.map(s => createEucalyptusStemSVG(s.x, s.y, s.len, s.angle)).join('');

    // 4. Lớp hoa nền - Cẩm tú cầu + Tulip
    let backFlowersHTML = '';
    backFlowersHTML += createHydrangeaSVG(450, 215, 92, 'grad-hydrangea-2');
    backFlowersHTML += createHydrangeaSVG(300, 290, 88, 'grad-hydrangea-1');
    backFlowersHTML += createHydrangeaSVG(600, 290, 88, 'grad-hydrangea-1');
    backFlowersHTML += createHydrangeaSVG(220, 425, 80, 'grad-hydrangea-2');
    backFlowersHTML += createHydrangeaSVG(680, 425, 80, 'grad-hydrangea-2');
    backFlowersHTML += createHydrangeaSVG(370, 355, 82, 'grad-hydrangea-1');
    backFlowersHTML += createHydrangeaSVG(530, 355, 82, 'grad-hydrangea-1');

    backFlowersHTML += createTulipSVG(405, 130, 64, -10);
    backFlowersHTML += createTulipSVG(495, 130, 64, 10);
    backFlowersHTML += createTulipSVG(315, 168, 66, -24);
    backFlowersHTML += createTulipSVG(585, 168, 66, 24);
    backFlowersHTML += createTulipSVG(225, 260, 64, -38);
    backFlowersHTML += createTulipSVG(675, 260, 64, 38);
    backFlowersHTML += createTulipSVG(175, 380, 62, -52);
    backFlowersHTML += createTulipSVG(725, 380, 62, 52);

    document.getElementById('layer-flowers-back').innerHTML = backFlowersHTML;

    // 5. Lớp hoa trung tâm
    let midFlowersHTML = '';
    midFlowersHTML += createSunflowerSVG(345, 265, 72);
    midFlowersHTML += createSunflowerSVG(555, 265, 72);
    midFlowersHTML += createSunflowerSVG(450, 195, 66);

    midFlowersHTML += createPeonySVG(450, 340, 90, 'grad-peony');
    midFlowersHTML += createPeonySVG(280, 395, 82, 'grad-peony');
    midFlowersHTML += createPeonySVG(620, 395, 82, 'grad-peony');
    midFlowersHTML += createPeonySVG(450, 455, 85, 'grad-peony');

    midFlowersHTML += createRanunculusSVG(375, 190, 52, 'grad-ranunculus', -15);
    midFlowersHTML += createRanunculusSVG(525, 190, 52, 'grad-ranunculus', 15);
    midFlowersHTML += createRanunculusSVG(215, 340, 56, 'grad-rose-1', -30);
    midFlowersHTML += createRanunculusSVG(685, 340, 56, 'grad-rose-1', 30);

    midFlowersHTML += createRoseSVG(450, 260, 66, 'grad-rose-2', 12);
    midFlowersHTML += createRoseSVG(220, 480, 64, 'grad-rose-1', -25);
    midFlowersHTML += createRoseSVG(680, 480, 64, 'grad-rose-1', 25);

    document.getElementById('layer-flowers-mid').innerHTML = midFlowersHTML;

    // 6. Lớp hoa tiền cảnh - Baby + Hồng/Mao Lương chủ đạo
    let frontFlowersHTML = '';
    const babySpecs = [
      { x: 265, y: 245, s: 56 + rnd() * 8 - 4, a: -28 + rnd() * 6 - 3 },
      { x: 635, y: 245, s: 56 + rnd() * 8 - 4, a: 28 + rnd() * 6 - 3 },
      { x: 450, y: 160, s: 52 + rnd() * 6 - 3, a: 0 },
      { x: 195, y: 465, s: 54 + rnd() * 6 - 3, a: -50 + rnd() * 6 - 3 },
      { x: 705, y: 465, s: 54 + rnd() * 6 - 3, a: 50 + rnd() * 6 - 3 },
      { x: 375, y: 545, s: 52 + rnd() * 6 - 3, a: -14 + rnd() * 4 - 2 },
      { x: 525, y: 545, s: 52 + rnd() * 6 - 3, a: 14 + rnd() * 4 - 2 },
      { x: 310, y: 345, s: 48 + rnd() * 6 - 3, a: -18 + rnd() * 4 - 2 },
      { x: 590, y: 345, s: 48 + rnd() * 6 - 3, a: 18 + rnd() * 4 - 2 }
    ];
    babySpecs.forEach(b => {
      frontFlowersHTML += createBabysBreathSVG(b.x, b.y, b.s, b.a);
    });

    frontFlowersHTML += createRoseSVG(360, 410, 78, 'grad-rose-1', -12 + rnd() * 6 - 3);
    frontFlowersHTML += createRoseSVG(540, 410, 78, 'grad-rose-1', 18 + rnd() * 6 - 3);
    frontFlowersHTML += createRoseSVG(290, 505, 72, 'grad-rose-2', -22 + rnd() * 6 - 3);
    frontFlowersHTML += createRoseSVG(610, 505, 72, 'grad-rose-2', 22 + rnd() * 6 - 3);
    frontFlowersHTML += createRoseSVG(450, 485, 84, 'grad-rose-1', 0);
    frontFlowersHTML += createRoseSVG(380, 555, 66, 'grad-rose-2', -15 + rnd() * 6 - 3);
    frontFlowersHTML += createRoseSVG(520, 555, 66, 'grad-rose-2', 15 + rnd() * 6 - 3);
    frontFlowersHTML += createRanunculusSVG(450, 580, 62, 'grad-ranunculus', 25);

    document.getElementById('layer-flowers-front').innerHTML = frontFlowersHTML;

    // 7. Fairy lights
    renderFairyLights();

    // 8. Gắn click bloom
    attachFlowerInteractions();
  }

  /* ============================================================
     8. CLICK BLOOM + BURST
     ============================================================ */
  function attachFlowerInteractions() {
    const flowers = document.querySelectorAll('.flower-hit');
    flowers.forEach(f => {
      f.addEventListener('click', (e) => {
        const anim = f.querySelector('.flower-anim');
        if (anim) {
          anim.classList.remove('bloom-active');
          void anim.offsetWidth; // restart animation
          anim.classList.add('bloom-active');
        }

        // Emit event for canvas-burst
        const rect = document.getElementById('bouquet-svg').getBoundingClientRect();
        const cx = rect.left + parseFloat(f.getAttribute('data-cx')) * rect.width / 900;
        const cy = rect.top + parseFloat(f.getAttribute('data-cy')) * rect.height / 960;
        window.dispatchEvent(new CustomEvent('flower-burst', {
          detail: { x: cx, y: cy, themeKey: getCurrentTheme() }
        }));
      });
    });
  }

  /* ============================================================
     9. STATE
     ============================================================ */
  let _themeKey = 'pastelPink';
  let _seed = dayOfYear();
  let _opts = { breeze: true, lights: true, petals: true };

  function getCurrentTheme() { return _themeKey; }

  function setTheme(key) {
    if (!THEMES[key]) return;
    _themeKey = key;
    buildBouquet(_themeKey, _seed);
    document.body.classList.toggle('breeze-active', _opts.breeze);
    const lightsLayer = document.getElementById('layer-fairy-lights');
    if (lightsLayer) lightsLayer.style.display = _opts.lights ? '' : 'none';
  }

  function setSeed(s) {
    _seed = s;
    buildBouquet(_themeKey, _seed);
  }

  function shuffle() {
    // Random seed ngoài day-of-year; vẫn ưu tiên cảm giác tự nhiên
    const r = Math.floor(Math.random() * 4294967295);
    setSeed(r);
    return r;
  }

  function setBreeze(on) {
    _opts.breeze = on;
    document.body.classList.toggle('breeze-active', on);
  }
  function setLights(on) {
    _opts.lights = on;
    const l = document.getElementById('layer-fairy-lights');
    if (l) l.style.display = on ? '' : 'none';
  }
  function setPetals(on) {
    _opts.petals = on;
    window.dispatchEvent(new CustomEvent('petals-toggle', { detail: on }));
  }

  /* ============================================================
     10. PUBLIC API
     ============================================================ */
  window.BouquetEngine = {
    THEMES,
    build() { buildBouquet(_themeKey, _seed); },
    setTheme,
    setSeed,
    shuffle,
    setBreeze,
    setLights,
    setPetals,
    getCurrentTheme,
    getCurrentSeed: () => _seed,
    getDayOfYear: dayOfYear,
    // For canvas-burst
    createFlowerAt: (type, cx, cy, scale) => {
      const r = 60 * (scale || 1);
      let html = '';
      switch (type) {
        case 'rose': html = createRoseSVG(cx, cy, r, 'grad-rose-1', 0); break;
        case 'peony': html = createPeonySVG(cx, cy, r, 'grad-peony'); break;
        case 'ranunculus': html = createRanunculusSVG(cx, cy, r, 'grad-ranunculus', 0); break;
        case 'sunflower': html = createSunflowerSVG(cx, cy, r); break;
        case 'hydrangea': html = createHydrangeaSVG(cx, cy, r, 'grad-hydrangea-1'); break;
        case 'tulip': html = createTulipSVG(cx, cy, r, 0); break;
      }
      return html;
    }
  };

  // Auto-init
  document.addEventListener('DOMContentLoaded', () => {
    buildBouquet(_themeKey, _seed);
  });
})();
