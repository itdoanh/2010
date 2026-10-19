/* ==========================================================================
   js/bouquet.js — REDESIGN v2: Bó hoa thật sự
   ==========================================================================
   Mô hình bó hoa thật:
   - Flowers: xếp thành VÒM tròn, tất cả y < 0 (phía trên ribbon)
   - Ribbon: buộc ở giữa y=0
   - Stems: kéo từ hoa xuống ribbon (y = 0), ribbon che phần dưới
   - Leaves: lá viền xung quanh bó
   - 9 loại hoa SVG đẹp hơn với detail thật hơn
   - 25 shape layouts
   - 365 bó hoa = 25 shapes × 15 palettes (tái sinh theo day-of-year)
   ========================================================================== */

(function () {
  'use strict';

  /* ============================================================
     CONSTANTS
     ============================================================ */
  // SVG viewBox: -200 to +200, y=0 là điểm BUỘC ribbon
  const VB = { W: 400, H: 400, CX: 0, CY: 0, TIE: 0 };
  // Ribbon y position in SVG coords
  const RIBBON_Y = 0;
  // Flowers all above ribbon: y range -180 to -20
  const FLOWER_Y_MIN = -175;
  const FLOWER_Y_MAX = -15;
  // Stem goes from flower down to ribbon
  const STEM_BASE_Y = 5;

  /* Scale factor: 1.0 = flower 100px on 480px display (SVG unit = 1.2px) */
  const FLOWER_SCALE = 4.5;

  /* Layout scale: shrink layout coords so bouquet fits compactly */
  const LAYOUT_SCALE = 0.65;  // shrink all coords by 35%

  /* ============================================================
     PALETTES — 15 bảng màu, mỗi cái 16 màu
     ============================================================ */
  const PALETTES = [
    { id: 'spring-pink',   name: '🌸 Hồng Xuân',    colors: ['#ff85b3','#f48fb1','#f06292','#ec407a','#d4627d','#fbb1bd','#f9b9d0','#ffd6e0','#ffc9d6','#f8b4cb','#f4a7be','#ff9eb3','#f7afc2','#ffb1bf','#ffaec8','#fbb8c8'] },
    { id: 'royal-red',     name: '🌹 Đỏ Hoàng Gia', colors: ['#d62828','#c62828','#b71c1c','#c0392b','#a91d1d','#a31621','#8b0000','#aa0000','#bb2128','#cc3030','#e53935','#d32f2f','#c62828','#b71c1c','#a1232b','#c62828'] },
    { id: 'sunset',        name: '🌅 Hoàng Hôn',    colors: ['#ff6f61','#ff7b39','#ff9558','#ffb088','#fb8c4d','#f4a261','#f76a4d','#ee5b50','#ff9f68','#ffa07a','#ffb86c','#f08080','#cd5c5c','#ff8c61','#ffc97b','#ffa07a'] },
    { id: 'lavender',      name: '💜 Lavender',      colors: ['#c5a3ff','#b39dff','#9f86ff','#a18cd1','#8e7cc3','#7b68a6','#6a5acd','#9370db','#ba86d6','#d8b3f5','#9c89c2','#a18cd1','#b39dff','#c5a3ff','#cea7d8','#b18cd4'] },
    { id: 'lemon',         name: '🌻 Vàng Lemon',   colors: ['#ffd166','#ffe066','#ffeb3d','#fdd835','#ffcd3c','#f9b208','#f9c80e','#f9c846','#ffdf80','#ffe874','#fff176','#fbc02d','#fcde70','#ffeb88','#fff9e8','#fbc02d'] },
    { id: 'rose-pastel',   name: '🌷 Pastel Rose',   colors: ['#f9b9d0','#ffd9e4','#ffd6e0','#ffc9d6','#fbc4d4','#f7b5c5','#f4a7be','#f8b4cb','#f9c3d8','#f7c6da','#f6c5d8','#f6d0dd','#ffafcc','#ff85a1','#ffd1dc','#fed4e2'] },
    { id: 'rainbow',       name: '🌈 Cầu Vồng',     colors: ['#ff6b6b','#ff85b3','#ffd166','#a3e4a3','#4ecdc4','#a786ff','#ff9a5a','#66d9ff','#4dff88','#c5a3ff','#ffeb3d','#ff8fab','#5e9cff','#fbb8c8','#ffa07a','#f48fb1'] },
    { id: 'cherry',        name: '🌸 Anh Đào',       colors: ['#ffb7c5','#ffc8d3','#ffd1dc','#fbb1c5','#f8b3c8','#f9bccd','#f8b4cb','#ffc0d0','#ffb1bf','#f8a5b9','#f7afc2','#ffb3c6','#f9a8b8','#fbafc1','#fab5c2','#f5a6b8'] },
    { id: 'peach',         name: '🍑 Đào Ấm',        colors: ['#ffcab1','#ffb088','#ffa07a','#ffb59b','#ffa78f','#ffc4a3','#f8ad9d','#fcb1a3','#ffbfa8','#f7a98f','#ffae8b','#f7b69b','#f4a582','#f6a890','#f7c1a4','#f8b9a5'] },
    { id: 'ocean',         name: '🌊 Biển Mát',     colors: ['#66d9ff','#5ec8ff','#5cb8e0','#5fc1e0','#5ed4d4','#66c2a5','#5fb8b8','#84ceeb','#a1d8e7','#94d2bd','#83c5be','#73c2c6','#66b3c2','#5ec8d8','#5dd5d5','#7ab8cc'] },
    { id: 'white',         name: '🌙 Trăng Trắng',   colors: ['#fff','#fff5f8','#fff0e0','#ffe8e0','#fce8e8','#fdf3f3','#fef7f7','#fff5f3','#fff9e8','#fff9f3','#f9f0e8','#fff8e8','#fff5e8','#fff8f0','#f8f0f0','#fff'] },
    { id: 'burgundy',       name: '🍷 Burgundy',      colors: ['#800020','#8b1a3c','#a02244','#6c1b30','#9b2d4d','#7d2640','#7a1e35','#8e2342','#7c2238','#85193a','#7a2238','#9c2542','#851a3d','#7a1c3a','#8c1e3d','#7d2540'] },
    { id: 'garden',        name: '🌼 Vườn Xanh',    colors: ['#ff85b3','#ffd166','#a3e4a3','#a786ff','#ff9a5a','#c5a3ff','#f48fb1','#9fde9f','#85d1ce','#5fc1e0','#fbb8c8','#ffcd3c','#9eda9f','#c9b1d6','#f7a98f','#66d9ff'] },
    { id: 'candy',         name: '🍭 Kẹo Ngọt',      colors: ['#ff80ab','#ff9ec7','#ffafcc','#ffd1dc','#ff85b3','#fbb8c8','#ff9eb3','#ffb3c6','#ff7eb3','#ffa0c0','#ffaec8','#ff9ec7','#ff9dc1','#f9b9d0','#ff8fb1','#ffaec5'] },
    { id: 'rosegold',      name: '✨ Rose Gold',      colors: ['#e8b4a0','#f5c2a0','#f0b89a','#dfb1a0','#e2a893','#e6b7a8','#dfa895','#e8b4a0','#e2b4a8','#dba693','#e9b6a0','#dfa893','#e6a993','#dcab98','#deb098','#e7b29c'] }
  ];

  /* ============================================================
     FLOWER TYPE DEFINITIONS
     Each flower has: viewBox, layers[]
     Layers rendered from bottom to top (painter's algorithm)
     ============================================================ */
  const FLOWER_TYPES = {

    rose: {
      viewBox: '0 0 100 100',
      // layers drawn bottom-to-top (so inner petals on top)
      layers: [
        { // outer petals
          type: 'petals',
          count: 5,
          fn: (i, color) => {
            const a = (i / 5) * 360 + 18;
            const d = 'M50,50 C35,35 15,25 15,10 C15,-5 35,-8 50,-8 C65,-8 85,-5 85,10 C85,25 65,35 50,50 Z';
            return `<g transform="rotate(${a},50,50)"><path d="${d}" fill="${color}" opacity="0.92"/></g>`;
          }
        },
        { // middle petals
          type: 'petals',
          count: 4,
          fn: (i, color) => {
            const a = (i / 4) * 360 + 45;
            const d = 'M50,50 C40,40 25,32 28,18 C30,5 45,5 50,5 C55,5 70,5 72,18 C75,32 60,40 50,50 Z';
            return `<g transform="rotate(${a},50,50)"><path d="${d}" fill="${color}" opacity="0.95"/></g>`;
          }
        },
        { // center
          type: 'circle',
          cx: 50, cy: 30, r: 10,
          fill: 'dark',
          opacity: 0.7
        }
      ]
    },

    tulip: {
      viewBox: '0 0 100 100',
      layers: [
        { // left petal
          type: 'path',
          d: 'M50,95 C30,95 20,70 25,45 C28,30 38,20 50,15 C50,15 45,35 48,55 C50,70 50,95 50,95 Z',
          fill: 'primary', opacity: 0.95
        },
        { // right petal
          type: 'path',
          d: 'M50,95 C70,95 80,70 75,45 C72,30 62,20 50,15 C50,15 55,35 52,55 C50,70 50,95 50,95 Z',
          fill: 'primary', opacity: 0.95
        },
        { // center petal (front)
          type: 'path',
          d: 'M50,95 C38,95 32,72 35,50 C37,35 50,22 50,15 C50,15 63,35 65,50 C68,72 62,95 50,95 Z',
          fill: 'primary-light', opacity: 0.97
        }
      ]
    },

    sunflower: {
      viewBox: '0 0 100 100',
      layers: [
        { // petals (12)
          type: 'petals',
          count: 12,
          fn: (i, color) => {
            const a = (i / 12) * 360;
            const d = 'M50,48 C45,40 40,30 44,15 C46,8 54,8 56,15 C60,30 55,40 50,48 Z';
            return `<g transform="rotate(${a},50,50)"><path d="${d}" fill="${color}" opacity="0.95"/></g>`;
          }
        },
        { // center disk outer
          type: 'circle',
          cx: 50, cy: 50, r: 14,
          fill: 'center', opacity: 1
        },
        { // center disk dark
          type: 'circle',
          cx: 50, cy: 50, r: 9,
          fill: 'dark', opacity: 0.85
        },
        { // center detail dots
          type: 'dots',
          count: 8,
          r: 1.2,
          cx: 50, cy: 50, radius: 5,
          fill: 'center-dark',
          opacity: 0.6
        }
      ]
    },

    daisy: {
      viewBox: '0 0 100 100',
      layers: [
        { // petals (8)
          type: 'petals',
          count: 8,
          fn: (i, color) => {
            const a = (i / 8) * 360 + 22;
            const d = 'M50,48 C47,42 45,32 48,18 C49,12 51,12 52,18 C55,32 53,42 50,48 Z';
            return `<g transform="rotate(${a},50,50)"><path d="${d}" fill="${color}" opacity="0.95"/></g>`;
          }
        },
        { // center
          type: 'circle',
          cx: 50, cy: 50, r: 11,
          fill: 'center', opacity: 1
        },
        {
          type: 'circle',
          cx: 50, cy: 50, r: 7,
          fill: 'center-dark', opacity: 0.8
        }
      ]
    },

    peony: {
      viewBox: '0 0 100 100',
      layers: [
        { type: 'circle', cx: 50, cy: 50, r: 40, fill: 'primary-light', opacity: 0.6 },
        { type: 'circle', cx: 50, cy: 50, r: 34, fill: 'primary', opacity: 0.7 },
        { type: 'circle', cx: 50, cy: 50, r: 27, fill: 'primary-light', opacity: 0.8 },
        { type: 'circle', cx: 50, cy: 50, r: 20, fill: 'secondary', opacity: 0.85 },
        { type: 'circle', cx: 50, cy: 50, r: 13, fill: 'primary-light', opacity: 0.9 },
        { type: 'circle', cx: 50, cy: 50, r: 7,  fill: 'dark', opacity: 0.8 }
      ]
    },

    lily: {
      viewBox: '0 0 100 100',
      layers: [
        { type: 'path', d: 'M50,95 C35,95 20,70 25,45 C28,28 42,18 50,15 C58,18 72,28 75,45 C80,70 65,95 50,95 Z', fill: 'primary', opacity: 0.95 },
        { type: 'path', d: 'M50,90 C38,90 26,68 30,46 C33,30 46,22 50,20 C54,22 67,30 70,46 C74,68 62,90 50,90 Z', fill: 'primary-light', opacity: 0.9 },
        { type: 'path', d: 'M50,85 C42,85 34,68 36,50 C37,38 44,32 50,30 C56,32 63,38 64,50 C66,68 58,85 50,85 Z', fill: 'secondary', opacity: 0.88 },
        // Stamens
        { type: 'stamens', count: 6, fill: 'center', opacity: 0.9 }
      ]
    },

    orchid: {
      viewBox: '0 0 100 100',
      layers: [
        { type: 'path', d: 'M50,15 C25,15 10,30 10,50 C10,72 28,85 50,85 C72,85 90,72 90,50 C90,30 75,15 50,15 Z', fill: 'primary-light', opacity: 0.9 },
        { type: 'path', d: 'M50,22 C30,22 18,34 18,50 C18,66 32,76 50,76 C68,76 82,66 82,50 C82,34 70,22 50,22 Z', fill: 'primary', opacity: 0.92 },
        { type: 'path', d: 'M50,32 C35,32 26,42 26,54 C26,66 36,74 50,74 C64,74 74,66 74,54 C74,42 65,32 50,32 Z', fill: 'secondary', opacity: 0.88 },
        { type: 'circle', cx: 50, cy: 54, r: 8, fill: 'center', opacity: 1 }
      ]
    },

    cherry: {
      viewBox: '0 0 100 100',
      layers: [
        { type: 'path', d: 'M50,10 C22,10 8,28 8,50 C8,72 25,90 50,90 C75,90 92,72 92,50 C92,28 78,10 50,10 Z', fill: 'primary', opacity: 0.92 },
        { type: 'circle', cx: 50, cy: 50, r: 16, fill: 'center', opacity: 1 },
        { type: 'circle', cx: 50, cy: 50, r: 10, fill: 'center-dark', opacity: 0.85 },
        // stamens
        { type: 'stamens', count: 8, fill: 'dark', opacity: 0.5 }
      ]
    },

    lavender: {
      viewBox: '0 0 100 100',
      layers: [
        // stem
        { type: 'stem', d: 'M50,95 L50,15', stroke: 'leaf', opacity: 0.7 },
        // clusters
        { type: 'cluster', cx: 50, cy: 20, r: 7, fill: 'primary', opacity: 0.95 },
        { type: 'cluster', cx: 50, cy: 32, r: 7, fill: 'primary-light', opacity: 0.95 },
        { type: 'cluster', cx: 50, cy: 44, r: 7, fill: 'primary', opacity: 0.95 },
        { type: 'cluster', cx: 50, cy: 56, r: 7, fill: 'primary-light', opacity: 0.9 },
        { type: 'cluster', cx: 50, cy: 68, r: 6, fill: 'primary', opacity: 0.85 },
        { type: 'cluster', cx: 50, cy: 80, r: 5, fill: 'secondary', opacity: 0.7 }
      ]
    }
  };

  /* ============================================================
     LEAF DEFINITIONS
     ============================================================ */
  const LEAF_TYPES = [
    { d: 'M0,0 C-15,-12 -20,-28 -8,-35 C4,-28 8,-14 0,0 Z', fill: '#3aa55a' },
    { d: 'M0,0 C-12,-8 -16,-22 -6,-28 C4,-22 6,-10 0,0 Z', fill: '#4caf50' },
    { d: 'M0,0 C-14,-10 -18,-26 -7,-32 C5,-26 8,-12 0,0 Z', fill: '#2e8b57' },
    { d: 'M0,0 C12,-8 16,-22 6,-28 C-4,-22 -6,-10 0,0 Z', fill: '#3aa55a' },
    { d: 'M0,0 C14,-10 18,-26 7,-32 C-5,-26 -8,-12 0,0 Z', fill: '#4caf50' }
  ];

  /* ============================================================
     RIBBON COLOR MAPS
     ============================================================ */
  const RIBBONS = {
    silk:    { bg: '#ff6b9d', dark: '#c2185b', light: '#ffb3d0', accent: '#ff4d8d' },
    satin:   { bg: '#a786ff', dark: '#5e4c9a', light: '#d4c5ff', accent: '#8b6cf0' },
    velvet:  { bg: '#7a1c3a', dark: '#3d0e1d', light: '#c04070', accent: '#8b1a40' },
    gold:    { bg: '#d4af37', dark: '#9c7a1a', light: '#ffe48a', accent: '#c49a20' },
    white:   { bg: '#f5f0f0', dark: '#d4c8c0', light: '#ffffff', accent: '#e8d8d0' },
    rainbow: { bg: '#ff85b3', dark: '#a786ff', light: '#ffd166', accent: '#66d9ff' }
  };

  /* ============================================================
     BOUQUET GENERATORS — 25 SHAPES
     Mỗi generator trả về: { flowers[], leaves, ribbon }
     Tọa độ: y < 0 = trên ribbon, y = 0 = ribbon
     ============================================================ */

  /* Helper: tạo stem từ hoa xuống ribbon */
  function makeStem(x, flowerY, stemLen) {
    return { x, flowerY, stemLen };
  }

  /* Helper: round bouquet layout */
  function roundLayout(rnd, n, minR, maxR, yRange, mainY) {
    const flowers = [];
    for (let i = 0; i < n; i++) {
      const ang = (i / n) * Math.PI * 2 + rnd() * 0.3;
      const r = minR + rnd() * (maxR - minR);
      const y = mainY + rnd() * yRange * (0.5 + rnd() * 0.5);
      flowers.push({ x: Math.cos(ang) * r, y: -Math.abs(y) });
    }
    return flowers;
  }

  const SHAPE_GENERATORS = {

    /* 1. ROUND CLASSIC — bó tròn cổ điển */
    'round-1': (rnd, palette) => {
      const flowers = roundLayout(rnd, 28, 20, 100, 100, 70);
      // Thêm hoa trung tâm to
      flowers.push({ x: rnd() * 10 - 5, y: -110 - rnd() * 20, isCenter: true });
      return { flowers, leaves: 16, ribbon: 'silk' };
    },

    /* 2. ROUND DENSE — bó tròn dày */
    'round-2': (rnd, palette) => {
      const flowers = [];
      for (let i = 0; i < 32; i++) {
        const ang = (i / 32) * Math.PI * 2;
        const r = 15 + rnd() * 90;
        flowers.push({ x: Math.cos(ang) * r, y: -(30 + rnd() * 120) });
      }
      return { flowers, leaves: 18, ribbon: 'white' };
    },

    /* 3. ROUND TIERED — bó tròn 3 tầng */
    'round-3': (rnd, palette) => {
      const flowers = [];
      // outer ring
      for (let i = 0; i < 20; i++) {
        const a = (i / 20) * Math.PI * 2;
        flowers.push({ x: Math.cos(a) * (75 + rnd() * 15), y: -(25 + rnd() * 40) });
      }
      // middle ring
      for (let i = 0; i < 14; i++) {
        const a = (i / 14) * Math.PI * 2 + 0.3;
        flowers.push({ x: Math.cos(a) * (45 + rnd() * 15), y: -(85 + rnd() * 40) });
      }
      // center
      flowers.push({ x: rnd() * 8 - 4, y: -(145 + rnd() * 20) });
      return { flowers, leaves: 14, ribbon: 'satin' };
    },

    /* 4. CASCADE — bó rủ xuống */
    'cascade-1': (rnd, palette) => {
      const flowers = [];
      for (let i = 0; i < 12; i++) {
        const ang = (i / 12) * Math.PI * 2;
        flowers.push({ x: Math.cos(ang) * 45, y: -(30 + rnd() * 50) });
      }
      // cascade down
      for (let i = 0; i < 10; i++) {
        const t = i / 9;
        const spread = t * 50;
        flowers.push({ x: (rnd() - 0.5) * spread * 1.5, y: -(55 + i * 14 + rnd() * 10) });
      }
      flowers.push({ x: rnd() * 6 - 3, y: -(155 + rnd() * 15) });
      return { flowers, leaves: 8, ribbon: 'velvet' };
    },

    /* 5. FAN — xòe như quạt */
    'fan-1': (rnd, palette) => {
      const flowers = [];
      for (let i = 0; i < 16; i++) {
        const ang = -Math.PI / 2 + ((i / 15) * Math.PI * 0.75) - Math.PI * 0.375;
        const r = 50 + rnd() * 35;
        const x = Math.cos(ang) * r;
        const y = -(Math.abs(Math.sin(ang)) * r * 0.7 + 30);
        flowers.push({ x, y });
      }
      return { flowers, leaves: 8, ribbon: 'silk' };
    },

    /* 6. GARDEN MIX */
    'garden-1': (rnd, palette) => {
      const flowers = [];
      for (let i = 0; i < 24; i++) {
        const ang = rnd() * Math.PI * 2;
        const r = 15 + rnd() * 70;
        flowers.push({ x: Math.cos(ang) * r, y: -(20 + rnd() * 135) });
      }
      return { flowers, leaves: 10, ribbon: 'rainbow' };
    },

    /* 7-11. MONO — đơn sắc */
    'mono-rose': (rnd, palette) => { const f = roundLayout(rnd, 30, 15, 95, 100, 55); return { flowers: f, leaves: 14, ribbon: 'satin' }; },
    'mono-tulip': (rnd, palette) => { const f = roundLayout(rnd, 30, 14, 96, 105, 60); return { flowers: f, leaves: 14, ribbon: 'white' }; },
    'mono-sunflower': (rnd, palette) => { const f = roundLayout(rnd, 20, 30, 88, 90, 65); return { flowers: f, leaves: 14, ribbon: 'gold' }; },
    'mono-daisy': (rnd, palette) => { const f = roundLayout(rnd, 28, 18, 92, 95, 58); return { flowers: f, leaves: 12, ribbon: 'white' }; },
    'mono-peony': (rnd, palette) => { const f = roundLayout(rnd, 22, 35, 95, 85, 60); return { flowers: f, leaves: 14, ribbon: 'silk' }; },

    /* 12-15. MIXED */
    'mixed-1': (rnd, palette) => {
      const flowers = roundLayout(rnd, 20, 18, 82, 88, 52);
      return { flowers, leaves: 10, ribbon: 'silk' };
    },
    'mixed-2': (rnd, palette) => {
      const flowers = roundLayout(rnd, 24, 15, 78, 90, 48);
      return { flowers, leaves: 10, ribbon: 'rainbow' };
    },
    'mixed-3': (rnd, palette) => {
      const flowers = roundLayout(rnd, 18, 22, 80, 82, 58);
      return { flowers, leaves: 10, ribbon: 'satin' };
    },
    'mixed-4': (rnd, palette) => {
      const flowers = roundLayout(rnd, 26, 12, 76, 92, 46);
      return { flowers, leaves: 10, ribbon: 'silk' };
    },

    /* 16. WREATH */
    'wreath-1': (rnd, palette) => {
      const flowers = [];
      for (let i = 0; i < 28; i++) {
        const ang = (i / 28) * Math.PI * 2;
        const r = 65 + rnd() * 12;
        flowers.push({ x: Math.cos(ang) * r, y: -(Math.sin(ang) * r + 0) });
      }
      return { flowers, leaves: 0, ribbon: 'gold' };
    },

    /* 17. HAND-TIED */
    'hand-tied': (rnd, palette) => {
      const flowers = [];
      for (let i = 0; i < 20; i++) {
        const ang = rnd() * Math.PI * 2;
        const r = 10 + rnd() * 65;
        flowers.push({ x: Math.cos(ang) * r, y: -(15 + rnd() * 135) });
      }
      return { flowers, leaves: 12, ribbon: 'satin' };
    },

    /* 18. PRESENTATION */
    'presentation-1': (rnd, palette) => {
      const flowers = [];
      // top tier
      for (let i = 0; i < 10; i++) {
        const a = (i / 10) * Math.PI * 2;
        flowers.push({ x: Math.cos(a) * 50, y: -(80 + rnd() * 30) });
      }
      // bottom tier (larger)
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2 + 0.25;
        flowers.push({ x: Math.cos(a) * 72, y: -(20 + rnd() * 35) });
      }
      return { flowers, leaves: 8, ribbon: 'velvet' };
    },

    /* 19. CASCADE LONG */
    'cascade-long': (rnd, palette) => {
      const flowers = [];
      for (let i = 0; i < 10; i++) {
        const a = (i / 10) * Math.PI * 2;
        flowers.push({ x: Math.cos(a) * 40, y: -(25 + rnd() * 40) });
      }
      for (let i = 0; i < 16; i++) {
        const t = i / 15;
        const spread = t * 55;
        flowers.push({ x: (rnd() - 0.5) * spread * 1.2, y: -(50 + i * 10 + rnd() * 8) });
      }
      return { flowers, leaves: 10, ribbon: 'silk' };
    },

    /* 20. VINTAGE */
    'vintage-1': (rnd, palette) => {
      const flowers = roundLayout(rnd, 18, 28, 78, 80, 55);
      flowers.push({ x: rnd() * 8 - 4, y: -(130 + rnd() * 15) });
      return { flowers, leaves: 10, ribbon: 'velvet' };
    },

    /* 21. MODERN */
    'modern-1': (rnd, palette) => {
      return {
        flowers: [
          { x: 0, y: -140 }, { x: -55, y: -70 }, { x: 55, y: -70 },
          { x: -38, y: -30 }, { x: 38, y: -30 }, { x: 0, y: -15 }
        ],
        leaves: 10, ribbon: 'white'
      };
    },

    /* 22. PASTEL */
    'pastel-1': (rnd, palette) => {
      const flowers = [];
      for (let i = 0; i < 22; i++) {
        const a = (i / 22) * Math.PI * 2 + rnd() * 0.15;
        const r = 25 + rnd() * 55;
        flowers.push({ x: Math.cos(a) * r, y: -(30 + rnd() * 120) });
      }
      return { flowers, leaves: 10, ribbon: 'silk' };
    },

    /* 23. WARM */
    'warm-1': (rnd, palette) => {
      const flowers = roundLayout(rnd, 20, 22, 80, 82, 55);
      return { flowers, leaves: 10, ribbon: 'gold' };
    },

    /* 24. COOL */
    'cool-1': (rnd, palette) => {
      const flowers = roundLayout(rnd, 22, 18, 76, 85, 50);
      return { flowers, leaves: 12, ribbon: 'satin' };
    },

    /* 25. RAINBOW */
    'rainbow-1': (rnd, palette) => {
      const flowers = [];
      for (let i = 0; i < 26; i++) {
        const a = (i / 26) * Math.PI * 2;
        const r = 30 + (i % 4) * 18;
        flowers.push({ x: Math.cos(a) * r, y: -(20 + rnd() * 120) });
      }
      return { flowers, leaves: 8, ribbon: 'rainbow' };
    }
  };

  /* ============================================================
     SEEDED RNG (mulberry32)
     ============================================================ */
  function seededRNG(seed) {
    let s = (seed >>> 0) + 9301;
    return function () {
      s = (s + 9301 + 49297 + 233280) >>> 0;
      let t = Math.imul(s ^ (s >>> 15), 1 | s);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /* ============================================================
     MAIN BOQUET GENERATOR
     ============================================================ */
  const BouquetGenerator = {
    cache: [],

    generateAll() {
      const shapeIds = Object.keys(SHAPE_GENERATORS);
      this.cache = [];
      for (let i = 0; i < 365; i++) {
        const shapeIdx = i % shapeIds.length;
        const paletteIdx = i % PALETTES.length;
        const seed = i * 9301 + 49297;
        const rnd = seededRNG(seed);
        const palette = PALETTES[paletteIdx];
        const shapeId = shapeIds[shapeIdx];
        const shapeGen = SHAPE_GENERATORS[shapeId];
        const layout = shapeGen(rnd, palette);

        this.cache.push({
          id: i + 1,
          seed,
          paletteId: palette.id,
          paletteName: palette.name,
          palette,
          shapeId,
          flowers: layout.flowers.map(f => ({
            x: f.x,
            y: f.y,
            size: 0.75 + rnd() * 0.45,
            rotation: rnd() * 360,
            type: f.type || 'rose',
            colorIdx: Math.floor(rnd() * palette.colors.length)
          })),
          leaves: layout.leaves,
          ribbon: layout.ribbon
        });
      }
      console.log('[Bouquet] Generated', this.cache.length, 'bouquets');
      return this.cache;
    },

    getByDayOfYear(day) {
      return this.cache[((day - 1) % 365 + 365) % 365];
    },

    getRandom() {
      return this.cache[Math.floor(Math.random() * 365)];
    },

    getByIndex(i) {
      return this.cache[((i - 1 + 365) % 365 + 365) % 365];
    },

    /* ============================================================
       SVG RENDER
       ============================================================ */
    render(bouquet) {
      if (!bouquet) return '<div style="color:#e85a8c;font-family:Be Vietnam Pro,sans-serif;text-align:center;padding:80px;font-size:1.5rem;">Chưa có bó hoa 😢</div>';
      const c = bouquet.palette.colors;
      const ribbonConf = RIBBONS[bouquet.ribbon] || RIBBONS.silk;

      // Sort: biggest (center) last → on top
      const sorted = [...bouquet.flowers].sort((a, b) => a.size - b.size);
      const LS = 0.7; // layout scale to fit in viewBox

      // Build SVG parts
      let parts = [];

      // 1. Background glow
      parts.push(`<defs>
        <radialGradient id="bg${bouquet.id}" cx="50%" cy="55%" r="55%">
          <stop offset="0%" stop-color="${c[0]}" stop-opacity="0.18"/>
          <stop offset="100%" stop-color="${c[0]}" stop-opacity="0"/>
        </radialGradient>
        <filter id="gs${bouquet.id}" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="3" stdDeviation="6" flood-color="${c[0]}" flood-opacity="0.25"/>
        </filter>
      </defs>`);
      parts.push(`<circle cx="0" cy="-60" r="180" fill="url(#bg${bouquet.id})"/>`);

      // 2. Leaves (behind flowers)
      if (bouquet.leaves > 0) {
        for (let i = 0; i < bouquet.leaves; i++) {
          const ang = (i / bouquet.leaves) * Math.PI * 2 + 0.2;
          const dist = (90 + (i % 3) * 15) * LS;
          const lx = Math.cos(ang) * dist;
          const ly = Math.sin(ang) * dist * 0.6;
          const rot = ang * 180 / Math.PI + 90 + (i % 3 - 1) * 25;
          const leaf = LEAF_TYPES[i % LEAF_TYPES.length];
          parts.push(`<g transform="translate(${lx},${ly}) rotate(${rot}) scale(${LS * 1.3})">
            <path d="${leaf.d}" fill="${leaf.fill}" opacity="0.82"/>
          </g>`);
        }
      }

      // 3. Stems (from flower position down to ribbon y=0)
      for (const f of sorted) {
        const stemLen = Math.abs(f.y); // distance from flower to ribbon
        if (stemLen > 5) {
          const stemColor = '#5a8a5a';
          const tx = f.x * 0.82;
          const sw = Math.min(3 + f.size * 1.5 * LS, 8);
          parts.push(`<line x1="${f.x * LS}" y1="${f.y * LS}" x2="${tx * LS}" y2="${2 * LS}"
            stroke="${stemColor}" stroke-width="${sw}" opacity="0.7"
            stroke-linecap="round"/>`);
        }
      }

      // 4. Flowers (sorted by size: biggest last → on top)
      for (const f of sorted) {
        const color = c[f.colorIdx % c.length];
        const scale = f.size * FLOWER_SCALE;
        const ft = FLOWER_TYPES[f.type] || FLOWER_TYPES.rose;
        const flowerSvg = renderFlowerSVG(ft, color, c);
        parts.push(`<g transform="translate(${f.x * LS},${f.y * LS}) scale(${scale}) rotate(${f.rotation})"
          style="filter:url(#gs${bouquet.id})">
          <g transform="translate(-50,-50)">${flowerSvg}</g>
        </g>`);
      }

      // 5. Ribbon at y = 0
      parts.push(renderRibbon(ribbonConf, c, LS));

      // 6. Small bow decoration above ribbon
      parts.push(renderBow(ribbonConf, LS));

      return `<svg viewBox="-200 -200 400 400" xmlns="http://www.w3.org/2000/svg"
        style="width:100%;height:auto;min-height:520px;display:block;
        filter:drop-shadow(0 20px 40px rgba(232,90,140,0.25))">` +
        parts.join('\n') + '</svg>';
    }
  };

  /* ============================================================
     RENDER FLOWER SVG (returns SVG string for one flower)
     ============================================================ */
  function renderFlowerSVG(ft, color, palette) {
    const getColor = (slot) => {
      switch (slot) {
        case 'primary': return color;
        case 'primary-light': return palette[Math.min(4, palette.length - 1)] || color;
        case 'secondary': return palette[Math.min(2, palette.length - 1)] || color;
        case 'dark': return palette[Math.min(7, palette.length - 1)] || '#3a2010';
        case 'center': return palette[Math.min(8, palette.length - 1)] || '#f4d35e';
        case 'center-dark': return palette[Math.min(9, palette.length - 1)] || '#8b6914';
        case 'leaf': return '#3aa55a';
        default: return color;
      }
    };

    const parts = [];
    const layers = ft.layers || [];

    for (const layer of layers) {
      switch (layer.type) {
        case 'petals':
          if (layer.fn) {
            for (let i = 0; i < layer.count; i++) {
              parts.push(layer.fn(i, getColor(layer.colorSlot || 'primary')));
            }
          }
          break;

        case 'path':
          parts.push(`<path d="${layer.d}" fill="${getColor(layer.fill)}" opacity="${layer.opacity || 0.95}"/>`);
          break;

        case 'circle':
          parts.push(`<circle cx="${layer.cx}" cy="${layer.cy}" r="${layer.r}"
            fill="${getColor(layer.fill)}" opacity="${layer.opacity || 1}"/>`);
          break;

        case 'dots': {
          for (let i = 0; i < layer.count; i++) {
            const a = (i / layer.count) * Math.PI * 2;
            const dx = layer.cx + Math.cos(a) * layer.radius;
            const dy = layer.cy + Math.sin(a) * layer.radius;
            parts.push(`<circle cx="${dx}" cy="${dy}" r="${layer.r}"
              fill="${getColor(layer.fill)}" opacity="${layer.opacity || 0.6}"/>`);
          }
          break;
        }

        case 'stamens': {
          for (let i = 0; i < layer.count; i++) {
            const a = (i / layer.count) * Math.PI * 2;
            const r1 = 12, r2 = 22;
            parts.push(`<line x1="${50 + Math.cos(a) * r1}" y1="${50 + Math.sin(a) * r1}"
              x2="${50 + Math.cos(a) * r2}" y2="${50 + Math.sin(a) * r2}"
              stroke="${getColor(layer.fill)}" stroke-width="1.2" opacity="${layer.opacity || 0.7}"/>`);
            parts.push(`<circle cx="${50 + Math.cos(a) * r2}" cy="${50 + Math.sin(a) * r2}" r="2"
              fill="${getColor(layer.fill)}" opacity="${layer.opacity || 0.8}"/>`);
          }
          break;
        }

        case 'cluster': {
          // lavender cluster
          parts.push(`<ellipse cx="${layer.cx}" cy="${layer.cy}" rx="${layer.r}" ry="${layer.r * 1.3}"
            fill="${getColor(layer.fill)}" opacity="${layer.opacity || 0.95}"/>`);
          break;
        }
      }
    }

    return `<svg viewBox="${ft.viewBox}" xmlns="http://www.w3.org/2000/svg">${parts.join('\n')}</svg>`;
  }

  /* ============================================================
     RENDER RIBBON
     ============================================================ */
  function renderRibbon(conf, palette, LS) {
    const s = LS; // scale
    // Main bow wrapping around stems at y=0
    let svg = `<g class="bouquet-ribbon">`;

    // Shadow under ribbon
    svg += `<ellipse cx="0" cy="${4 * s}" rx="${38 * s}" ry="${12 * s}" fill="${conf.dark}" opacity="0.3"/>`;

    // Main wrap band
    svg += `<rect x="${-40 * s}" y="${-8 * s}" width="${80 * s}" height="${16 * s}" rx="${6 * s}"
      fill="${conf.bg}" opacity="0.95"/>`;

    // Highlight on top
    svg += `<rect x="${-38 * s}" y="${-7 * s}" width="${76 * s}" height="${5 * s}" rx="${3 * s}"
      fill="${conf.light}" opacity="0.4"/>`;

    // Ribbon tail left
    svg += `<path d="M${-12 * s},${4 * s} C${-18 * s},${8 * s} ${-25 * s},${20 * s} ${-30 * s},${40 * s} C${-25 * s},${42 * s} ${-18 * s},${35 * s} ${-12 * s},${8 * s} Z"
      fill="${conf.bg}" opacity="0.9"/>`;
    svg += `<path d="M${-10 * s},${5 * s} C${-16 * s},${10 * s} ${-20 * s},${18 * s} ${-22 * s},${28 * s}"
      stroke="${conf.dark}" stroke-width="${1 * s}" fill="none" opacity="0.4"/>`;

    // Ribbon tail right
    svg += `<path d="M${12 * s},${4 * s} C${18 * s},${8 * s} ${25 * s},${20 * s} ${30 * s},${40 * s} C${25 * s},${42 * s} ${18 * s},${35 * s} ${12 * s},${8 * s} Z"
      fill="${conf.bg}" opacity="0.9"/>`;
    svg += `<path d="M${10 * s},${5 * s} C${16 * s},${10 * s} ${20 * s},${18 * s} ${22 * s},${28 * s}"
      stroke="${conf.dark}" stroke-width="${1 * s}" fill="none" opacity="0.4"/>`;

    svg += `</g>`;
    return svg;
  }

  /* ============================================================
     RENDER BOW (decorative bow on top)
     ============================================================ */
  function renderBow(conf, LS) {
    const s = LS;
    let svg = `<g class="bouquet-bow">`;
    // Left loop
    svg += `<ellipse cx="${-18 * s}" cy="${-12 * s}" rx="${16 * s}" ry="${10 * s}"
      fill="${conf.accent}" transform="rotate(${-20 * s},${-18 * s},${-12 * s})" opacity="0.85"/>`;
    // Right loop
    svg += `<ellipse cx="${18 * s}" cy="${-12 * s}" rx="${16 * s}" ry="${10 * s}"
      fill="${conf.accent}" transform="rotate(${20 * s},${18 * s},${-12 * s})" opacity="0.85"/>`;
    // Knot
    svg += `<circle cx="0" cy="${-6 * s}" r="${7 * s}" fill="${conf.dark}" opacity="0.9"/>`;
    svg += `<circle cx="0" cy="${-7 * s}" r="${5 * s}" fill="${conf.bg}" opacity="0.7"/>`;
    // Top tails
    svg += `<path d="M${-5 * s},${-4 * s} C${-10 * s},${-15 * s} ${-16 * s},${-30 * s} ${-10 * s},${-42 * s} C${-4 * s},${-36 * s} ${-2 * s},${-20 * s} 0,${-6 * s} Z"
      fill="${conf.accent}" opacity="0.75"/>`;
    svg += `<path d="M${5 * s},${-4 * s} C${10 * s},${-15 * s} ${16 * s},${-30 * s} ${10 * s},${-42 * s} C${4 * s},${-36 * s} ${2 * s},${-20 * s} 0,${-6 * s} Z"
      fill="${conf.accent}" opacity="0.75"/>`;
    svg += `</g>`;
    return svg;
  }

  window.BouquetGenerator = BouquetGenerator;
})();
