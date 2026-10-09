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

for (const site of sites) {
  for (const vp of viewports) {
    const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
    const page = await context.newPage();
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
    await page.waitForTimeout(1000);

    const dom = await page.evaluate(({ mobile }) => {
      const rectInfo = el => {
        const r = el.getBoundingClientRect();
        return {
          tag: el.tagName, cls: String(el.className || ''), id: el.id || '',
          text: (el.innerText || el.getAttribute('aria-label') || '').trim().slice(0, 70),
          x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height),
        };
      };
      const intentionallyHidden = el => Boolean(el.closest('[aria-hidden="true"],.feedback-honeypot,.light-feedback-honeypot'));
      const overflow = [...document.querySelectorAll('body *')].filter(el => {
        if (intentionallyHidden(el)) return false;
        const cs = getComputedStyle(el);
        if (cs.position === 'fixed') return false;
        const r = el.getBoundingClientRect();
        return r.right > innerWidth + 2 || r.left < -2;
      }).slice(0, 20).map(rectInfo);
      const ids = [...document.querySelectorAll('[id]')].map(el => el.id);
      const dupIds = [...new Set(ids.filter((id, i) => ids.indexOf(id) !== i))];
      const unnamed = [...document.querySelectorAll('button,a[href],input,textarea,select')].filter(el => {
        if (intentionallyHidden(el) || el.matches('input[type="hidden"]')) return false;
        const name = (el.getAttribute('aria-label') || el.getAttribute('aria-labelledby') || el.getAttribute('title') || el.innerText || el.value || el.placeholder || '').trim();
        return !name;
      }).slice(0, 30).map(rectInfo);
      const missingAlt = [...document.images].filter(img => !img.hasAttribute('alt')).slice(0, 20).map(rectInfo);
      const unlabeledFields = [...document.querySelectorAll('input:not([type="hidden"]),textarea,select')].filter(el => {
        if (intentionallyHidden(el)) return false;
        return !el.labels?.length && !el.getAttribute('aria-label') && !el.getAttribute('aria-labelledby');
      }).slice(0, 20).map(rectInfo);
      const tinyTargets = mobile ? [...document.querySelectorAll('button,a[href],input[type="range"]')].filter(el => {
        if (intentionallyHidden(el)) return false;
        const cs = getComputedStyle(el);
        if (cs.display === 'none' || cs.visibility === 'hidden') return false;
        const r = el.getBoundingClientRect();
        if (!r.width || !r.height) return false;
        if (el.tagName === 'A' && r.height < 28 && r.width > 80) return false;
        return r.width < 40 || r.height < 40;
      }).slice(0, 30).map(rectInfo) : [];
      return {
        title: document.title,
        scrollWidth: document.documentElement.scrollWidth,
        innerWidth,
        overflow,
        dupIds,
        unnamed,
        missingAlt,
        unlabeledFields,
        tinyTargets,
      };
    }, { mobile: vp.width <= 680 });

    let seriousAxe = [];
    try {
      const axe = await new AxeBuilder({ page }).withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa']).analyze();
      seriousAxe = axe.violations
        .filter(v => ['critical','serious'].includes(v.impact))
        .map(v => ({ id: v.id, impact: v.impact, help: v.help, count: v.nodes.length, targets: v.nodes.slice(0, 8).map(n => n.target) }));
    } catch (error) {
      seriousAxe = [{ id: 'axe-run-error', impact: 'critical', help: String(error), count: 1, targets: [] }];
    }

    await page.screenshot({ path: path.join(OUT, `${site.name}-${vp.name}.png`), fullPage: true });
    report.runs.push({ site: site.name, viewport: vp, url, ...dom, consoleErrors, pageErrors, requestFailures, seriousAxe });
    await context.close();
  }
}

// Growth: real mobile journey.
{
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  await page.goto(`${BASE}/?uxflow=${Date.now()}`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(700);
  const result = { site: 'growth', viewport: 'mobile', checks: {} };
  const card = page.locator('#episode-grid .play-btn[data-play]').first();
  await card.scrollIntoViewIfNeeded();
  const before = await page.evaluate(() => scrollY);
  await card.click();
  await page.waitForTimeout(650);
  const after = await page.evaluate(() => scrollY);
  result.checks.playDoesNotJump = Math.abs(after - before) <= 12;
  result.checks.miniPlayerVisible = await page.locator('.mobile-now-player').evaluate(el => el.classList.contains('is-visible'));
  result.checks.cardShowsPause = (await card.innerText()).includes('暫停');
  await card.click(); await page.waitForTimeout(120);
  result.checks.cardPauses = await page.locator('#audio-player').evaluate(el => el.paused);
  result.checks.cardShowsResume = (await card.innerText()).includes('繼續播放');
  await page.locator('.mobile-now-toggle').click(); await page.waitForTimeout(200);
  result.checks.miniResumes = !(await page.locator('#audio-player').evaluate(el => el.paused));

  const srcBefore = await page.locator('#audio-player').getAttribute('src');
  const filters = page.locator('#filters button');
  if (await filters.count() > 1) {
    await filters.nth(1).click(); await page.waitForTimeout(120);
    result.checks.filterKeepsAudio = !(await page.locator('#audio-player').evaluate(el => el.paused));
    await page.locator('#filters button').first().click(); await page.waitForTimeout(120);
    result.checks.filterKeepsTrack = (await page.locator('#audio-player').getAttribute('src')) === srcBefore;
    result.checks.returnedCardState = await page.locator('#episode-grid .active-card .play-btn').first().innerText().then(t => t.includes('暫停')).catch(() => false);
  }

  const poster = page.locator('.poster-card').first();
  if (await poster.count()) {
    await poster.scrollIntoViewIfNeeded(); await poster.click(); await page.waitForTimeout(100);
    result.checks.posterDialogOpens = await page.locator('#image-dialog').evaluate(el => el.open);
    const c1 = await page.locator('#dialog-counter').innerText();
    await page.keyboard.press('ArrowRight'); await page.waitForTimeout(80);
    result.checks.posterArrowWorks = c1 !== await page.locator('#dialog-counter').innerText();
    await page.keyboard.press('Escape');
    result.checks.posterEscapeCloses = !(await page.locator('#image-dialog').evaluate(el => el.open));
  }

  const textarea = page.locator('#feedback-form textarea');
  await textarea.scrollIntoViewIfNeeded(); await page.waitForTimeout(150);
  result.checks.miniVisibleBeforeTyping = await page.locator('.mobile-now-player').evaluate(el => el.classList.contains('is-visible'));
  await textarea.focus(); await page.waitForTimeout(100);
  result.checks.miniHidesWhileTyping = !(await page.locator('.mobile-now-player').evaluate(el => el.classList.contains('is-visible')));
  await textarea.blur(); await page.waitForTimeout(100);
  result.checks.miniReturnsAfterTyping = await page.locator('.mobile-now-player').evaluate(el => el.classList.contains('is-visible'));

  await page.screenshot({ path: path.join(OUT, 'growth-mobile-playing.png'), fullPage: false });
  report.functional.push(result);
  await context.close();
}

// Light House: real mobile journey including keyboard and persistent playback.
{
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  await page.goto(`${BASE}/light/?uxflow=${Date.now()}`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(700);
  const result = { site: 'light', viewport: 'mobile', checks: {} };
  const picker = page.locator('#mobilePicker');
  result.checks.pickerVisible = await picker.isVisible();
  await picker.click();
  result.checks.pickerOpens = await page.locator('#episodeList').evaluate(el => el.classList.contains('mobile-open'));

  const secondMeta = page.locator('#episodeList .ep-row').nth(1).locator('.ep-meta');
  await secondMeta.focus();
  result.checks.episodeRowsKeyboardAccessible = (await secondMeta.getAttribute('role')) === 'button' && (await secondMeta.getAttribute('tabindex')) === '0';
  const beforeTitle = await page.locator('#dTitle').innerText();
  await page.keyboard.press('Enter'); await page.waitForTimeout(180);
  result.checks.keyboardSelectionWorks = beforeTitle !== await page.locator('#dTitle').innerText();

  await picker.click();
  const playMini = page.locator('#episodeList .playmini').first();
  const playBox = await playMini.boundingBox();
  result.checks.playTargetAtLeast44 = Boolean(playBox && playBox.width >= 44 && playBox.height >= 44);
  await playMini.click(); await page.waitForTimeout(450);
  result.checks.miniPlayStarts = !(await page.locator('#audio').evaluate(el => el.paused));
  await page.waitForTimeout(300);
  const t1 = await page.locator('#audio').evaluate(el => el.currentTime);
  await playMini.click(); await page.waitForTimeout(120);
  result.checks.listPlayPausesCurrent = await page.locator('#audio').evaluate(el => el.paused);
  const pausedAt = await page.locator('#audio').evaluate(el => el.currentTime);
  await playMini.click(); await page.waitForTimeout(220);
  const resumedAt = await page.locator('#audio').evaluate(el => el.currentTime);
  result.checks.listPlayResumesWithoutRestart = resumedAt >= Math.max(0, pausedAt - 0.15) && pausedAt >= Math.max(0, t1 - 0.15);

  await page.locator('#mobileBottomPicker').scrollIntoViewIfNeeded(); await page.waitForTimeout(250);
  result.checks.persistentPlayerVisible = await page.locator('.light-now-player').evaluate(el => el.classList.contains('is-visible'));
  await page.locator('.light-now-toggle').click(); await page.waitForTimeout(100);
  result.checks.persistentPlayerPauses = await page.locator('#audio').evaluate(el => el.paused);
  await page.locator('.light-now-toggle').click(); await page.waitForTimeout(180);
  result.checks.persistentPlayerResumes = !(await page.locator('#audio').evaluate(el => el.paused));

  const textarea = page.locator('#light-feedback-form textarea');
  await textarea.scrollIntoViewIfNeeded(); await textarea.focus(); await page.waitForTimeout(100);
  result.checks.playerHidesWhileTyping = !(await page.locator('.light-now-player').evaluate(el => el.classList.contains('is-visible')));
  const seekBox = await page.locator('#seek').boundingBox();
  result.checks.seekTargetAtLeast32 = Boolean(seekBox && seekBox.height >= 32);
  result.checks.headerFixed = await page.locator('.site-header').evaluate(el => getComputedStyle(el).position === 'fixed');
  result.checks.crossLinkToGrowth = (await page.locator('.series-switcher a[href="/"]').count()) > 0;

  await page.screenshot({ path: path.join(OUT, 'light-mobile-interaction.png'), fullPage: false });
  report.functional.push(result);
  await context.close();
}

// Growth desktop: core controls, navigation, and embedded guide.
{
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage();
  await page.goto(`${BASE}/?uxdesktop=${Date.now()}`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(600);
  const result = { site: 'growth', viewport: 'desktop', checks: {} };
  result.checks.headerSticky = await page.locator('.topbar').evaluate(el => getComputedStyle(el).position === 'sticky');
  result.checks.crossLinkToLight = (await page.locator('.series-switcher a[href="/light/"]').count()) > 0;
  result.checks.manualVisible = await page.locator('.manual-reader iframe').isVisible().catch(() => false);
  const card = page.locator('#episode-grid .play-btn[data-play]').first();
  await card.scrollIntoViewIfNeeded();
  const before = await page.evaluate(() => scrollY);
  await card.click(); await page.waitForTimeout(450);
  const after = await page.evaluate(() => scrollY);
  result.checks.playDoesNotJump = Math.abs(after - before) <= 12;
  result.checks.cardShowsPause = (await card.innerText()).includes('暫停');
  await card.click(); await page.waitForTimeout(100);
  result.checks.cardPauses = await page.locator('#audio-player').evaluate(el => el.paused);
  report.functional.push(result);
  await context.close();
}

// Light House desktop: sticky browse list and same-track pause/resume semantics.
{
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage();
  await page.goto(`${BASE}/light/?uxdesktop=${Date.now()}`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(600);
  const result = { site: 'light', viewport: 'desktop', checks: {} };
  result.checks.headerFixed = await page.locator('.site-header').evaluate(el => getComputedStyle(el).position === 'fixed');
  result.checks.episodeListSticky = await page.locator('#episodeList').evaluate(el => getComputedStyle(el).position === 'sticky');
  result.checks.crossLinkToGrowth = (await page.locator('.series-switcher a[href="/"]').count()) > 0;
  const playMini = page.locator('#episodeList .playmini').first();
  await playMini.click(); await page.waitForTimeout(450);
  result.checks.playStarts = !(await page.locator('#audio').evaluate(el => el.paused));
  await page.waitForTimeout(250);
  await playMini.click(); await page.waitForTimeout(100);
  const pausedAt = await page.locator('#audio').evaluate(el => el.currentTime);
  result.checks.listPlayPauses = await page.locator('#audio').evaluate(el => el.paused);
  await playMini.click(); await page.waitForTimeout(180);
  const resumedAt = await page.locator('#audio').evaluate(el => el.currentTime);
  result.checks.listPlayResumesWithoutRestart = resumedAt >= Math.max(0, pausedAt - 0.15);
  const speedBefore = await page.locator('#speedBtn').innerText();
  await page.locator('#speedBtn').click();
  result.checks.speedControlWorks = speedBefore !== await page.locator('#speedBtn').innerText();
  report.functional.push(result);
  await context.close();
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
  if (run.tinyTargets.length) failures.push(`${run.site}/${run.viewport.name}: small touch targets ${run.tinyTargets.length}`);
  if (run.seriousAxe.length) failures.push(`${run.site}/${run.viewport.name}: serious axe ${run.seriousAxe.map(v => `${v.id}(${v.count})`).join(',')}`);
}
for (const flow of report.functional) {
  for (const [name, passed] of Object.entries(flow.checks)) {
    if (passed !== true) failures.push(`${flow.site}/${flow.viewport}: ${name}=false`);
  }
}

console.log(JSON.stringify({ ok: failures.length === 0, failures, report: path.join(OUT, 'report.json') }, null, 2));
if (failures.length) process.exitCode = 1;
