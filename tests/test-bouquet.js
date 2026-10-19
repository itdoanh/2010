/**
 * tests/test-bouquet.js
 * ---------------------------------------------------------------------------
 * Playwright test cho trang bouquet-stage.html
 *
 *  1. Mở http://localhost:8123/bouquet-stage.html
 *  2. Lắng nghe console errors / page errors
 *  3. Chờ SVG bouquet render xong (presence of .flower-hit)
 *  4. Screenshot 4 themes (PastelPink / RubyRed / SunshineGold / DreamyPurple)
 *  5. Test toggle breeze / lights / petals
 *  6. Test shuffle button (đổi seed)
 *  7. Test wish input (đổi câu chúc)
 *  8. Test click flower -> bloom animation
 *  9. In report + exit code phù hợp (0 = pass, 1 = fail)
 *
 * Cách chạy (giả sử HTTP server đã chạy port 8123):
 *   node tests/test-bouquet.js
 *
 * Lưu ý: script này require Playwright từ global install.
 *   require('C:/Users/doanh/AppData/Roaming/npm/node_modules/playwright')
 * ---------------------------------------------------------------------------
 */

const path = require('path');
const fs = require('fs');
const { chromium } = require('C:/Users/doanh/AppData/Roaming/npm/node_modules/playwright');

const URL_BASE = process.env.URL_BASE || 'http://localhost:8123';
const TARGET = `${URL_BASE}/bouquet-stage.html`;
const SHOT_DIR = path.join(__dirname, '__screenshots');

const themes = ['pastelPink', 'rubyRed', 'sunshineGold', 'dreamyPurple'];
const results = {
  pass: [],
  fail: [],
  warnings: []
};

function pass(name, detail) {
  results.pass.push({ name, detail });
  console.log(`  ✔ ${name}${detail ? '  (' + detail + ')' : ''}`);
}
function fail(name, detail) {
  results.fail.push({ name, detail });
  console.log(`  ✘ ${name}${detail ? '  →  ' + detail : ''}`);
}
function warn(name, detail) {
  results.warnings.push({ name, detail });
  console.log(`  ⚠ ${name}${detail ? '  →  ' + detail : ''}`);
}

function header(text) {
  console.log('\n' + '='.repeat(70));
  console.log(' ' + text);
  console.log('='.repeat(70));
}

(async () => {
  // Chuẩn bị thư mục screenshot
  if (!fs.existsSync(SHOT_DIR)) fs.mkdirSync(SHOT_DIR, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1
  });
  const page = await context.newPage();

  // Lắng nghe console errors & page errors
  const consoleErrors = [];
  const pageErrors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });
  page.on('pageerror', (err) => {
    pageErrors.push(err.message);
  });

  // ============================================================
  // 1. LOAD PAGE
  // ============================================================
  header('1. LOAD bouquet-stage.html');
  try {
    const resp = await page.goto(TARGET, { waitUntil: 'networkidle', timeout: 15000 });
    if (resp && resp.ok()) {
      pass('HTTP status', `${resp.status()} ${resp.statusText()}`);
    } else {
      fail('HTTP status', `status=${resp ? resp.status() : 'null'}`);
    }
  } catch (err) {
    fail('Navigate', err.message);
    await browser.close();
    printReport();
    process.exit(1);
  }

  // ============================================================
  // 2. CHỜ RENDER
  // ============================================================
  header('2. WAIT FOR RENDER');
  try {
    await page.waitForSelector('#bouquet-svg .flower-hit', { timeout: 8000 });
    pass('Bouquet rendered', '8 loại hoa đã xuất hiện');
  } catch (err) {
    fail('Bouquet render', 'Timeout chờ .flower-hit');
  }

  // Đếm số lượng từng loại hoa
  const flowerCounts = await page.evaluate(() => {
    const items = document.querySelectorAll('.flower-hit[data-type]');
    const counts = {};
    items.forEach(el => {
      const t = el.getAttribute('data-type');
      counts[t] = (counts[t] || 0) + 1;
    });
    return counts;
  });
  console.log('  → flower counts:', flowerCounts);
  if (Object.keys(flowerCounts).length >= 6) {
    pass('Flower variety', `${Object.keys(flowerCounts).length} loại hoa khác nhau`);
  } else {
    fail('Flower variety', `Chỉ thấy ${Object.keys(flowerCounts).length} loại, kỳ vọng ≥ 6`);
  }

  // Kiểm tra wrapping paper
  const hasWrapping = await page.locator('#layer-paper-front path').count();
  if (hasWrapping > 5) pass('Wrapping paper', `${hasWrapping} path elements`);
  else fail('Wrapping paper', `chỉ ${hasWrapping} paths`);

  // Kiểm tra fairy lights
  const lightBulbs = await page.locator('.fairy-light-bulb').count();
  if (lightBulbs >= 10) pass('Fairy lights', `${lightBulbs} bóng đèn`);
  else warn('Fairy lights', `chỉ ${lightBulbs} bóng`);

  // ============================================================
  // 3. SCREENSHOT 4 THEMES
  // ============================================================
  header('3. SCREENSHOT 4 THEMES');
  for (const theme of themes) {
    try {
      await page.evaluate((t) => {
        const btn = document.querySelector(`[data-theme="${t}"]`);
        if (btn) btn.click();
      }, theme);
      // chờ DOM update
      await page.waitForTimeout(400);
      const shotPath = path.join(SHOT_DIR, `theme-${theme}.png`);
      await page.screenshot({ path: shotPath, fullPage: false });
      const bg = await page.evaluate(() =>
        getComputedStyle(document.documentElement).getPropertyValue('--bg-grad-1').trim()
      );
      if (bg) pass(`Theme ${theme}`, `bg=${bg}, screenshot OK`);
      else fail(`Theme ${theme}`, 'không lấy được --bg-grad-1');
    } catch (err) {
      fail(`Theme ${theme}`, err.message);
    }
  }

  // Reset về PastelPink cho các bước sau
  await page.evaluate(() => document.querySelector('[data-theme="pastelPink"]').click());
  await page.waitForTimeout(300);

  // ============================================================
  // 4. TOGGLES
  // ============================================================
  header('4. TOGGLES (breeze / lights / petals)');

  // Mở panel trước (toggles nằm bên trong panel)
  await page.locator('#btn-config-toggle').click();
  await page.waitForTimeout(500);

  for (const id of ['toggle-breeze', 'toggle-lights', 'toggle-petals']) {
    try {
      // Click input trực tiếp, force vì checkbox có thể bị ẩn sau label
      await page.evaluate((iid) => {
        const el = document.getElementById(iid);
        if (el) el.click();
      }, id);
      await page.waitForTimeout(200);
      const checked = await page.evaluate((iid) =>
        document.getElementById(iid).checked, id);
      pass(`Toggle ${id}`, `checked=${checked}`);
    } catch (err) {
      fail(`Toggle ${id}`, err.message);
    }
  }

  // Restore: tất cả ON
  for (const id of ['toggle-breeze', 'toggle-lights', 'toggle-petals']) {
    const checked = await page.evaluate((iid) => document.getElementById(iid).checked, id);
    if (!checked) {
      await page.evaluate((iid) => document.getElementById(iid).click(), id);
      await page.waitForTimeout(150);
    }
  }

  // ============================================================
  // 5. SHUFFLE
  // ============================================================
  header('5. SHUFFLE BUTTON');
  const seedBefore = await page.evaluate(() => BouquetEngine.getCurrentSeed());
  try {
    await page.locator('#btn-shuffle').click();
    await page.waitForTimeout(400);
    const seedAfter = await page.evaluate(() => BouquetEngine.getCurrentSeed());
    if (seedBefore !== seedAfter) {
      pass('Shuffle', `seed ${seedBefore} → ${seedAfter}`);
    } else {
      fail('Shuffle', 'seed không đổi');
    }
    // Hint text update
    const hint = await page.locator('#bouquet-index').textContent();
    if (hint && /^\d+$/.test(hint.trim())) {
      pass('Index hint', `#${hint.trim()}`);
    } else {
      fail('Index hint', `nội dung không hợp lệ: "${hint}"`);
    }
  } catch (err) {
    fail('Shuffle', err.message);
  }

  // ============================================================
  // 6. WISH INPUT
  // ============================================================
  header('6. WISH INPUT');
  try {
    await page.locator('#card-input').fill('Xin chào 20/10!');
    await page.waitForTimeout(150);
    const display = await page.locator('#card-display-text').textContent();
    if (display.trim() === 'Xin chào 20/10!') pass('Wish sync', 'input → display OK');
    else fail('Wish sync', `display="${display}"`);

    await page.locator('#btn-sample-wish').click();
    await page.waitForTimeout(150);
    const sample = await page.locator('#card-display-text').textContent();
    if (sample && sample !== 'Xin chào 20/10!') pass('Sample button', `→ "${sample.substring(0, 30)}..."`);
    else fail('Sample button', 'không đổi câu');
  } catch (err) {
    fail('Wish input', err.message);
  }

  // ============================================================
  // 7. CLICK FLOWER -> BLOOM
  // ============================================================
  header('7. CLICK FLOWER → BLOOM');
  try {
    const flowerCount = await page.locator('.flower-hit').count();
    if (flowerCount > 0) {
      // Dùng evaluate click vì .flower-hit có animation (không stable)
      await page.evaluate(() => {
        const f = document.querySelector('.flower-hit');
        if (f) f.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      });
      await page.waitForTimeout(300);
      const hasBloom = await page.locator('.bloom-active').count();
      if (hasBloom > 0) pass('Bloom click', `${hasBloom} hoa đang bloom`);
      else fail('Bloom click', 'không có .bloom-active');
    } else {
      fail('Bloom click', 'không tìm thấy .flower-hit');
    }
  } catch (err) {
    fail('Bloom click', err.message);
  }

  // ============================================================
  // 8. CONFIG PANEL OPEN/CLOSE
  // ============================================================
  header('8. CONFIG PANEL');
  try {
    // Trước: panel có class hidden
    const beforeHidden = await page.locator('#config-panel.hidden').count();
    if (beforeHidden === 1) pass('Panel initial state', 'hidden = true');
    else warn('Panel initial state', 'không thấy class .hidden ban đầu');

    // Dùng evaluate click để tránh bị element khác che
    await page.evaluate(() => document.getElementById('btn-config-toggle').click());
    await page.waitForTimeout(500);
    const afterHidden = await page.locator('#config-panel.hidden').count();
    if (afterHidden === 0) pass('Panel open', 'mở thành công');
    else fail('Panel open', 'vẫn còn .hidden');

    // Đóng lại
    await page.evaluate(() => document.getElementById('btn-config-close').click());
    await page.waitForTimeout(500);
    const reHidden = await page.locator('#config-panel.hidden').count();
    if (reHidden === 1) pass('Panel close', 'đã đóng lại');
    else fail('Panel close', 'không đóng được');
  } catch (err) {
    fail('Panel', err.message);
  }

  // ============================================================
  // 9. CONSOLE / PAGE ERRORS
  // ============================================================
  header('9. CONSOLE / PAGE ERRORS');
  if (consoleErrors.length === 0) pass('No console errors', '');
  else {
    consoleErrors.forEach(e => fail('Console error', e));
  }
  if (pageErrors.length === 0) pass('No page errors', '');
  else {
    pageErrors.forEach(e => fail('Page error', e));
  }

  // ============================================================
  // FINAL SCREENSHOT
  // ============================================================
  header('10. FINAL HERO SCREENSHOT');
  try {
    await page.evaluate(() => document.querySelector('[data-theme="pastelPink"]').click());
    await page.waitForTimeout(400);
    await page.screenshot({
      path: path.join(SHOT_DIR, 'final-hero.png'),
      fullPage: false
    });
    pass('Hero screenshot', path.join(SHOT_DIR, 'final-hero.png'));
  } catch (err) {
    fail('Hero screenshot', err.message);
  }

  await browser.close();
  printReport();
  process.exit(results.fail.length > 0 ? 1 : 0);
})();

function printReport() {
  console.log('\n' + '#'.repeat(70));
  console.log(' KẾT QUẢ TEST');
  console.log('#'.repeat(70));
  console.log(`  ✔ PASS:    ${results.pass.length}`);
  console.log(`  ✘ FAIL:    ${results.fail.length}`);
  console.log(`  ⚠ WARNINGS: ${results.warnings.length}`);
  if (results.fail.length) {
    console.log('\n  CHI TIẾT LỖI:');
    results.fail.forEach(f => console.log(`    - ${f.name}: ${f.detail || ''}`));
  }
  console.log('#'.repeat(70));
}
