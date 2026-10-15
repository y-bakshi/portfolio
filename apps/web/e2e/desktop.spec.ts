import { expect, test } from '@playwright/test';
import { askChip, cannedGuide, bar, input, openHome, ready } from './helpers';

test.describe('wide screens', () => {
  test('the hero fills the first screen, so projects start below the fold', async ({ page }) => {
    await openHome(page);
    const top = await page.locator('#work').evaluate((el) => el.getBoundingClientRect().top);
    expect(top).toBeGreaterThanOrEqual((await page.evaluate(() => innerHeight)) - 5);
  });

  test('the header is as tall as the --header-h token says', async ({ page }) => {
    await openHome(page);
    const token = await page.evaluate(() =>
      parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-h')),
    );
    const header = (await page.getByRole('banner').boundingBox())!;
    expect(header.height).toBe(token);
  });

  test('the last screen holds the education, the contact band and the footer in one window', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await openHome(page);
    await page.evaluate(() => window.scrollTo({ top: 1e6, behavior: 'instant' }));
    const box = (sel: string) =>
      page.locator(sel).evaluate((el) => el.getBoundingClientRect().toJSON());
    await expect.poll(async () => (await box('#education')).top).toBeGreaterThanOrEqual(79);
    expect((await box('#contact')).bottom).toBeLessThanOrEqual((await box('.site-footer')).top + 1);
    expect(Math.round((await box('.site-footer')).bottom)).toBe(800);
    await expect(page.getByRole('heading', { name: 'What I work with' })).toHaveCount(0);
  });

  test('the projects screen links to a page with every project', async ({ page }) => {
    await openHome(page);
    await page.getByRole('link', { name: /see all projects/i }).click();
    await expect(page).toHaveURL(/\/projects\/$/);
    await expect(page.getByRole('heading', { level: 1, name: 'All projects' })).toBeVisible();
    await expect(page.locator('#procwatch')).toBeAttached();
    await expect(page.getByRole('button', { name: /ask the guide/i })).toHaveCount(0);
  });

  test('a guide button for a project that is not on the home page opens the all-projects page', async ({
    page,
  }) => {
    await cannedGuide(page);
    await openHome(page);
    await bar(page).click();
    await input(page).fill('Tell me about the rust process monitor');
    await page.getByRole('button', { name: 'Ask', exact: true }).click();
    await page.getByRole('button', { name: 'Show ProcWatch on the page' }).click();
    await expect(page).toHaveURL(/\/projects\/#procwatch$/);
    await expect(page.locator('#procwatch')).toBeInViewport();
  });

  test('the links in each project tile line up along the bottom of a row', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await openHome(page);
    const tops = await page
      .locator('#work .tile-actions')
      .evaluateAll((els) =>
        els.map((el) =>
          Math.round(el.getBoundingClientRect().top + el.getBoundingClientRect().height),
        ),
      );
    expect(tops).toHaveLength(4);
    expect(tops[0]).toBe(tops[1]);
    expect(tops[2]).toBe(tops[3]);
  });

  test('the four featured projects all fit on the projects screen', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await openHome(page);
    await page.evaluate(() => document.querySelector('#work')!.scrollIntoView());
    // the screen rests at the top, just under the header
    await expect
      .poll(() =>
        page.locator('#work').evaluate((el) => Math.round(el.getBoundingClientRect().top)),
      )
      .toBe(80);
    const view = page.viewportSize()!;
    const boxes = await page.locator('#work .tile').evaluateAll((els) =>
      els.map((el) => {
        const r = el.getBoundingClientRect();
        return { top: r.top, bottom: r.bottom };
      }),
    );
    expect(boxes).toHaveLength(4);
    for (const b of boxes) {
      expect(b.top).toBeGreaterThanOrEqual(0);
      expect(b.bottom).toBeLessThanOrEqual(view.height);
    }
  });

  test('the portrait sits under the header and not behind it', async ({ page }) => {
    await openHome(page);
    const header = await page.getByRole('banner').boundingBox();
    const portrait = await page.locator('.portrait').boundingBox();
    expect(portrait!.y).toBeGreaterThanOrEqual(header!.y + header!.height - 1);
  });

  test('the bar widens to the full window when opened and closes again', async ({ page }) => {
    await openHome(page);
    // closed, only a small pill shows (the bar itself is clipped to it)
    const pill = await bar(page).boundingBox();
    expect(pill!.width).toBeLessThan(400);
    await bar(page).click();
    await expect(input(page)).toBeFocused();
    const open = page.locator('.dock-open');
    await expect(open).toBeVisible();
    await expect.poll(async () => (await open.boundingBox())!.width).toBeGreaterThan(1000);
    // the reveal is animated, so wait for it to finish
    await expect
      .poll(() => page.locator('.dock').evaluate((el) => getComputedStyle(el).clipPath))
      .toBe('inset(-16px 0px 0px)');
    await page.keyboard.press('Escape');
    await expect(bar(page)).toBeFocused();
    await expect(open).toBeHidden();
    await expect
      .poll(() => page.locator('.dock').evaluate((el) => getComputedStyle(el).clipPath))
      .toContain('calc(');
  });

  test('a long answer starts below the fade, so its first line can be read', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await cannedGuide(page);
    await openHome(page);
    await bar(page).click();
    await askChip(page, 'Show me his backend experience');
    await expect(page.locator('.feed .msg-answer').last()).toBeVisible();
    const gap = await page.evaluate(() => {
      const feed = document.querySelector('.feed')!.getBoundingClientRect();
      const answers = document.querySelectorAll('.feed .msg-answer');
      return answers[answers.length - 1].getBoundingClientRect().top - feed.top;
    });
    // the feed fades out over its top 72px
    expect(gap).toBeGreaterThanOrEqual(72);
  });

  test('answers appear beside the portrait and keep earlier ones', async ({ page }) => {
    await cannedGuide(page);
    await openHome(page);
    await bar(page).click();
    await askChip(page, 'What has Yash built with RAG?');
    await askChip(page, 'Has he worked with agents?');
    const feed = page.locator('.feed');
    await expect(feed.getByText(/TestPilot is the RAG project/)).toBeVisible();
    await expect(feed.getByText(/GuardianAI has a ReAct path/)).toBeVisible();
    expect(await feed.locator('.msg-user').count()).toBe(2);
    // the guide is on the left of its column, the visitor on the right
    const box = await feed.boundingBox();
    const user = await feed.locator('.msg-user').last().boundingBox();
    const guide = await feed.locator('.msg-answer').last().boundingBox();
    expect(user!.x + user!.width).toBeGreaterThan(guide!.x + guide!.width - 1);
    expect(guide!.x).toBeLessThan(user!.x + 1);
    expect(box!.width).toBeGreaterThan(250);
  });

  test('the closed chat panel is out of keyboard reach', async ({ page }) => {
    await openHome(page);
    await expect(page.locator('#dock-open')).toHaveJSProperty('inert', true);
    await bar(page).click();
    await expect(page.locator('#dock-open')).toHaveJSProperty('inert', false);
  });

  test('the page does not move while an answer streams in', async ({ page }) => {
    await openHome(page);
    await bar(page).click();
    const before = await page.evaluate(() => scrollY);
    await page
      .locator('.dock-open')
      .getByRole('button', { name: 'Show me his backend experience' })
      .click();
    for (let i = 0; i < 12; i++) {
      expect(await page.evaluate(() => scrollY)).toBe(before);
      await page.waitForTimeout(150);
    }
    await ready(page);
    expect(await page.evaluate(() => scrollY)).toBe(before);
  });

  test('scrolling with the pointer over the conversation scrolls the page', async ({ page }) => {
    await openHome(page);
    await bar(page).click();
    await askChip(page, 'What has Yash built with RAG?');
    const box = (await page.locator('.feed').boundingBox())!;
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.wheel(0, 600);
    await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(200);
  });

  test('a navigation button jumps to its card, highlights it, and a way back to the top appears', async ({
    page,
  }) => {
    await cannedGuide(page);
    await openHome(page);
    await bar(page).click();
    await askChip(page, 'What has Yash built with RAG?');
    await page.locator('.feed').getByRole('button', { name: 'Show TestPilot on the page' }).click();
    const card = page.locator('#testpilot');
    await expect(card).toBeFocused();
    await expect(card).toHaveClass(/is-marked/);
    await expect(page.getByRole('button', { name: /back to top/i })).toBeVisible();
    await page.getByRole('button', { name: /back to top/i }).click();
    await expect.poll(() => page.evaluate(() => scrollY)).toBeLessThan(5);
  });

  test('asking a new question while scrolled down brings the page back to the conversation', async ({
    page,
  }) => {
    await openHome(page);
    await bar(page).click();
    await page.evaluate(() => window.scrollTo(0, 1800));
    await page
      .locator('.dock-open')
      .getByRole('button', { name: 'Has he worked with agents?' })
      .click();
    await expect.poll(() => page.evaluate(() => scrollY)).toBeLessThan(5);
  });

  test('the back to top button never changes the input row', async ({ page }) => {
    await openHome(page);
    await bar(page).click();
    const before = (await input(page).boundingBox())!;
    await page.evaluate(() => window.scrollTo(0, 1500));
    const top = page.getByRole('button', { name: /back to top/i });
    await expect(top).toBeVisible();
    const after = (await input(page).boundingBox())!;
    expect(after.width).toBe(before.width);
    expect(after.x).toBe(before.x);
    // it sits clear of the header and of the dock
    const t = (await top.boundingBox())!;
    const header = (await page.getByRole('banner').boundingBox())!;
    expect(t.y).toBeGreaterThanOrEqual(header.y + header.height);
    await page.evaluate(() => window.scrollTo(0, 0));
    await expect(top).toBeHidden();
  });

  test('the keyboard focus ring shows on the guide input', async ({ page }) => {
    await openHome(page);
    await page.keyboard.press('Tab'); // skip link
    await page.keyboard.press('Enter');
    await bar(page).focus();
    await page.keyboard.press('Enter');
    await expect(input(page)).toBeFocused();
    await page.keyboard.press('Tab');
    await page.keyboard.press('Shift+Tab');
    const outline = await input(page).evaluate((el) => getComputedStyle(el).outlineStyle);
    expect(outline).toBe('solid');
  });

  test('the case study has no guide', async ({ page }) => {
    await page.goto('/projects/testpilot/');
    await expect(page.getByRole('button', { name: /ask the guide/i })).toHaveCount(0);
  });
});
