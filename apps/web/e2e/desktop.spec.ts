import { expect, test } from '@playwright/test';
import { askChip, bar, input, openHome, ready } from './helpers';

test.describe('wide screens', () => {
  test('the hero fills the first screen, so projects start below the fold', async ({ page }) => {
    await openHome(page);
    const top = await page.locator('#work').evaluate((el) => el.getBoundingClientRect().top);
    expect(top).toBeGreaterThanOrEqual((await page.evaluate(() => innerHeight)) - 5);
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
    expect(await page.locator('.dock').evaluate((el) => getComputedStyle(el).clipPath)).toBe(
      'inset(0px)',
    );
    await page.keyboard.press('Escape');
    await expect(bar(page)).toBeFocused();
    await expect(open).toBeHidden();
    expect(await page.locator('.dock').evaluate((el) => getComputedStyle(el).clipPath)).toContain(
      'calc(',
    );
  });

  test('answers appear beside the portrait and keep earlier ones', async ({ page }) => {
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
    await page.goto('/projects/testpilot');
    await expect(page.getByRole('button', { name: /ask the guide/i })).toHaveCount(0);
  });
});
