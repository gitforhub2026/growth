import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright-core';
import AxeBuilder from '@axe-core/playwright';

const BASE = 'https://growth.notesss.workers.dev';
const OUT = process.env.UX_AUDIT_OUT || '/tmp/ux-audit';
fs.mkdirSync(OUT, { recursive: true });

const viewports = [
  { name: 'desktop', width: 1440, height: 1000 },
  { name: 'tablet', width: 1024, height: 900 },
  { name: 'mobile', width: 390, height: 844 },
  { name: 'small-mobile', width: 320, height: 700 },
];
const sites = [
  { name: 'growth', path: '/' },
  { name: 'light', path: '/light/' },
];

const report = { generatedAt: new Date().toISOString(), base: BASE, runs: [], functional: [] };
const browser = await chromium.launch({
  executablePath: process.env.CHROME_BIN,
  headless: true,
  args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'],
});

function rectInfo(el) {
  const r = el.getBoundingClientRect();
  return { tag: el.tagName, cls: String(el.className || ''), id: el.id || '', text: (el.innerText || el.getAttribute('aria-label') || '').trim().slice(0, 70), x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) };
}

for (const site of sites) {
  for (const vp of viewports) {
    const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });
    const consoleErrors = [];
    const pageErrors = [];
    const requestFailures = [];
    page.on('console', m => { if (m.type() === 'error') consoleErrors.push(m.text()); });
    page.on('pageerror', e => pageErrors.push(String(e)));
    page.on('requestfailed', r => {
      const u = r.url();
      if (!u.match(/\.(m4a|mp3|aac|wav)(\?|$)/i)) requestFailures.push(`${r.failure()?.errorText || 'failed'} ${u}`);
    });

    const url = `${BASE}${site.path}?uxaudit=${Date.now()}`;
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });
    await page.waitForTimeout(1200);

    const dom = await page.evaluate(({ mobile }) => {
      const all = [...document.querySelectorAll('body *')];
      const overflow = all.filter(el => {
        const cs = getComputedStyle(el);
        if (cs.position === 'fixed' && (el.classList.contains('mobile-now-player') || el.closest('.mobile-now-player'))) return false;
        const r = el.getBoundingClientRect();
        return r.right > innerWidth + 2 || r.left < -2;
      }).slice(0, 20).map(rectInfo);
      const ids = [...document.querySelectorAll('[id]')].map(el => el.id);
      const dupIds = [...new Set(ids.filter((id, i) => ids.indexOf(id) !== i))];
      const unnamed = [...document.querySelectorAll('button,a[href],input,textarea,select')].filter(el => {
        if (el.matches('input[type="hidden"]')) return false;
        const name = (el.getAttribute('aria-label') || el.getAttribute('title') || el.innerText || el.value || el.placeholder || '').trim();
        return !name;
      }).slice(0, 30).map(rectInfo);
      const missingAlt = [...document.images].filter(img => !img.hasAttribute('alt')).slice(0, 20).map(rectInfo);
      const unlabeledFields = [...document.querySelectorAll('input:not([type="hidden"]),textarea,select')].filter(el => {
        if (el.closest('[aria-hidden="true"]')) return false;
        return !el.labels?.length && !el.getAttribute('aria-label') && !el.getAttribute('aria-labelledby');
      }).slice(0, 20).map(rectInfo);
      const tinyTargets = mobile ? [...document.querySelectorAll('button,a[href],input[type="range"]')].filter(el => {
        const cs = getComputedStyle(el); if (cs.display === 'none' || cs.visibility === 'hidden') return false;
        const r = el.getBoundingClientRect(); if (!r.width || !r.height) return false;
        if (el.tagName === 'A' && r.height < 28 && r.width > 80) return false;
        return r.width < 40 || r.height < 40;
      }).slice(0, 30).map(rectInfo) : [];
      return {
        scrollWidth: document.documentElement.scrollWidth,
        innerWidth,
        overflow,
        dupIds,
        unnamed,
        missingAlt,
        unlabeledFields,
        tinyTargets,
        title: document.title,
      };
    }, { mobile: vp.width <= 680 });

    let axe = { violations: [] };
    try {
      axe = await new AxeBuilder({ page }).withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa']).analyze();
    } catch (e) {
      axe = { violations: [{ id: 'axe-run-error', impact: 'moderate', description: String(e), nodes: [] }] };
    }
    const seriousAxe = axe.violations.filter(v => ['critical','serious'].includes(v.impact)).map(v => ({ id: v.id, impact: v.impact, help: v.help, count: v.nodes.length, targets: v.nodes.slice(0, 5).map(n => n.target) }));

    await page.screenshot({ path: path.join(OUT, `${site.name}-${vp.name}.png`), fullPage: true });
    report.runs.push({ site: site.name, viewport: vp, url, ...dom, consoleErrors, pageErrors, requestFailures, seriousAxe });
    await page.close();
  }
}

// Growth functional flow on mobile.
{
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.goto(`${BASE}/?uxflow=${Date.now()}`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(900);
  const result = { site: 'growth', viewport: 'mobile', checks: {} };
  const card = page.locator('#episode-grid .play-btn[data-play]').first();
  await card.waitFor({ state: 'visible' });
  await card.scrollIntoViewIfNeeded();
  await page.waitForTimeout(250);
  const before = await page.evaluate(() => scrollY);
  await card.click();
  await page.waitForTimeout(700);
  const after = await page.evaluate(() => scrollY);
  result.checks.playDoesNotJump = Math.abs(after - before) <= 12;
  result.checks.miniPlayerVisible = await page.locator('.mobile-now-player').evaluate(el => el.classList.contains('is-visible') && getComputedStyle(el).visibility === 'visible');
  result.checks.cardShowsPause = (await card.innerText()).includes('暫停');
  await card.click(); await page.waitForTimeout(150);
  result.checks.cardPauses = await page.locator('#audio-player').evaluate(el => el.paused);
  result.checks.cardShowsResume = (await card.innerText()).includes('繼續播放');
  await page.locator('.mobile-now-toggle').click();
  await page.waitForTimeout(250);
  result.checks.miniResumes = !(await page.locator('#audio-player').evaluate(el => el.paused));

  // Filter while playing should not stop audio or lose current episode state when returning.
  const srcBefore = await page.locator('#audio-player').getAttribute('src');
  const filterButtons = page.locator('#filters button');
  if (await filterButtons.count() > 1) {
    await filterButtons.nth(1).click(); await page.waitForTimeout(200);
    result.checks.filterKeepsAudio = !(await page.locator('#audio-player').evaluate(el => el.paused));
    await filterButtons.first().click(); await page.waitForTimeout(200);
    result.checks.filterKeepsTrack = (await page.locator('#audio-player').getAttribute('src')) === srcBefore;
    result.checks.returnedCardState = await page.locator('#episode-grid .play-btn[data-play]').first().innerText().then(t => t.includes('暫停') || t.includes('繼續播放')).catch(() => false);
  }

  // Poster dialog: open, arrow navigation, escape close.
  const poster = page.locator('.poster-card').first();
  if (await poster.count()) {
    await poster.scrollIntoViewIfNeeded(); await poster.click(); await page.waitForTimeout(150);
    result.checks.posterDialogOpens = await page.locator('#image-dialog').evaluate(el => el.open);
    const c1 = await page.locator('#dialog-counter').innerText();
    await page.keyboard.press('ArrowRight'); await page.waitForTimeout(100);
    const c2 = await page.locator('#dialog-counter').innerText();
    result.checks.posterArrowWorks = c1 !== c2;
    await page.keyboard.press('Escape');
    result.checks.posterEscapeCloses = !(await page.locator('#image-dialog').evaluate(el => el.open));
  }

  // Feedback field + mini player coexistence.
  const textarea = page.locator('#feedback-form textarea');
  if (await textarea.count()) {
    await textarea.scrollIntoViewIfNeeded(); await textarea.focus(); await page.waitForTimeout(150);
    result.checks.miniVisibleWhileTyping = await page.locator('.mobile-now-player').evaluate(el => el.classList.contains('is-visible'));
  }

  await page.screenshot({ path: path.join(OUT, 'growth-mobile-playing.png'), fullPage: false });
  report.functional.push(result);
  await page.close();
}

// Light House functional flow on mobile + desktop semantics.
{
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.goto(`${BASE}/light/?uxflow=${Date.now()}`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(900);
  const result = { site: 'light', viewport: 'mobile', checks: {} };
  const picker = page.locator('.mobile-picker');
  result.checks.pickerVisible = await picker.isVisible();
  if (await picker.isVisible()) {
    await picker.click(); await page.waitForTimeout(120);
    result.checks.pickerOpens = await page.locator('.episode-list').evaluate(el => el.classList.contains('mobile-open'));
    const rows = page.locator('.episode-list .ep-row');
    if (await rows.count() > 1) {
      const titleBefore = await page.locator('.detail h3').innerText();
      await rows.nth(1).click(); await page.waitForTimeout(250);
      const titleAfter = await page.locator('.detail h3').innerText();
      result.checks.episodeSelectionChangesDetail = titleBefore !== titleAfter;
    }
  }
  const mini = page.locator('.episode-list .playmini').first();
  if (await mini.count()) {
    await picker.click().catch(()=>{}); await page.waitForTimeout(100);
    if (!(await mini.isVisible())) { await picker.click().catch(()=>{}); await page.waitForTimeout(100); }
    if (await mini.isVisible()) {
      await mini.click(); await page.waitForTimeout(500);
      result.checks.miniPlayStarts = !(await page.locator('#audio').evaluate(el => el.paused));
    }
  }
  result.checks.headerFixed = await page.locator('.site-header').evaluate(el => getComputedStyle(el).position === 'fixed');
  result.checks.crossLinkToGrowth = await page.locator('.series-switcher a[href="/"]').count().then(n => n > 0);
  await page.screenshot({ path: path.join(OUT, 'light-mobile-interaction.png'), fullPage: false });
  report.functional.push(result);
  await page.close();
}

await browser.close();
fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify(report, null, 2));

const failures = [];
for (const run of report.runs) {
  if (run.scrollWidth > run.innerWidth + 2) failures.push(`${run.site}/${run.viewport.name}: horizontal overflow ${run.scrollWidth}>${run.innerWidth}`);
  if (run.consoleErrors.length) failures.push(`${run.site}/${run.viewport.name}: console errors ${run.consoleErrors.join(' | ')}`);
  if (run.pageErrors.length) failures.push(`${run.site}/${run.viewport.name}: page errors ${run.pageErrors.join(' | ')}`);
  if (run.requestFailures.length) failures.push(`${run.site}/${run.viewport.name}: request failures ${run.requestFailures.join(' | ')}`);
  if (run.dupIds.length) failures.push(`${run.site}/${run.viewport.name}: duplicate ids ${run.dupIds.join(',')}`);
  if (run.unnamed.length) failures.push(`${run.site}/${run.viewport.name}: unnamed controls ${run.unnamed.length}`);
  if (run.missingAlt.length) failures.push(`${run.site}/${run.viewport.name}: images missing alt ${run.missingAlt.length}`);
  if (run.unlabeledFields.length) failures.push(`${run.site}/${run.viewport.name}: unlabeled fields ${run.unlabeledFields.length}`);
  if (run.seriousAxe.length) failures.push(`${run.site}/${run.viewport.name}: serious axe ${run.seriousAxe.map(v=>`${v.id}(${v.count})`).join(',')}`);
}
for (const flow of report.functional) {
  for (const [k,v] of Object.entries(flow.checks)) {
    if (v === false) failures.push(`${flow.site}/${flow.viewport}: ${k}=false`);
  }
}
console.log(JSON.stringify({ failures, report: path.join(OUT, 'report.json') }, null, 2));
// Audit is diagnostic: always upload the report; blocking regressions remain in e2e-light.yml.
