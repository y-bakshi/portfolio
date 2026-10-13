import { expect, test } from '@playwright/test';
import { askChip, bar, input, openHome, ready } from './helpers';

test.describe('phones', () => {
  test('the open chat takes the whole visible screen and locks the page behind it', async ({
    page,
  }) => {
    await openHome(page);
    await bar(page).click();
    const box = (await page.locator('.dock').boundingBox())!;
    const viewport = page.viewportSize()!;
    expect(box.x).toBeLessThanOrEqual(1);
    expect(box.y).toBeLessThanOrEqual(1);
    expect(Math.round(box.width)).toBe(viewport.width);
    expect(Math.round(box.height)).toBe(viewport.height);
    expect(await page.evaluate(() => getComputedStyle(document.body).overflow)).toBe('hidden');
    await page.getByRole('button', { name: 'Close the guide' }).click();
    await expect(page.locator('.dock')).not.toHaveClass(/is-open/);
    expect(await page.evaluate(() => getComputedStyle(document.body).overflow)).not.toBe('hidden');
  });

  test('your messages sit right, the guide left, and the newest answer is fully visible', async ({
    page,
  }) => {
    await openHome(page);
    await bar(page).click();
    await askChip(page, 'What has Yash built with RAG?');
    await page
      .locator('.chips-strip')
      .getByRole('button', { name: 'Show me his backend experience' })
      .click({ force: true });
    await ready(page);
    await page
      .locator('.chips-strip')
      .getByRole('button', { name: 'Has he worked with agents?' })
      .click({ force: true });
    await ready(page);

    const log = page.locator('.dock-log');
    const logBox = (await log.boundingBox())!;
    const users = log.locator('.msg-user');
    expect(await users.count()).toBe(3);
    for (let i = 0; i < 3; i++) {
      const b = (await users.nth(i).boundingBox())!;
      expect(
        logBox.x + logBox.width - (b.x + b.width),
        `question ${i + 1} is right-aligned`,
      ).toBeLessThan(40);
    }
    const lastCite = (await log.locator('.cites').last().boundingBox())!;
    expect(lastCite.y + lastCite.height).toBeLessThanOrEqual(logBox.y + logBox.height + 1);
    const lastAnswer = (await log.locator('.msg-answer').last().boundingBox())!;
    expect(lastAnswer.y).toBeGreaterThanOrEqual(logBox.y - 1);
  });

  test('the suggestions after the first question are one row that scrolls sideways with no scrollbar', async ({
    page,
  }) => {
    await openHome(page);
    await bar(page).click();
    await askChip(page, 'What has Yash built with RAG?');
    const strip = page.locator('.chips-strip');
    const m = await strip.evaluate((el) => ({
      scrolls: el.scrollWidth > el.clientWidth,
      scrollbar: getComputedStyle(el).scrollbarWidth,
    }));
    expect(m.scrolls).toBe(true);
    expect(m.scrollbar).toBe('none');
    const chips = strip.getByRole('button');
    const ys = await chips.evaluateAll((els) =>
      els.map((e) => Math.round(e.getBoundingClientRect().top)),
    );
    expect(new Set(ys).size).toBe(1);
  });

  test('a navigation button closes the chat and shows the card', async ({ page }) => {
    await openHome(page);
    await bar(page).click();
    await askChip(page, 'What has Yash built with RAG?');
    await page
      .locator('.dock-log')
      .getByRole('button', { name: 'Show TestPilot on the page' })
      .click();
    await expect(page.locator('.dock')).not.toHaveClass(/is-open/);
    await expect(page.locator('#testpilot')).toBeInViewport();
  });

  test('the chat input is reachable and typing asks a question', async ({ page }) => {
    await openHome(page);
    await bar(page).click();
    await expect(input(page)).toBeFocused();
    await input(page).fill('Tell me about his education');
    await page.getByRole('button', { name: 'Ask', exact: true }).click();
    await expect(page.locator('.dock-log').getByText(/Arizona State University/)).toBeVisible();
  });

  test('the header fits on one row', async ({ page }) => {
    await openHome(page);
    const h = (await page.getByRole('banner').boundingBox())!;
    expect(h.height).toBeLessThan(80);
  });

  test('projects, roles and degrees are cards to swipe through, one dot each', async ({ page }) => {
    await openHome(page);
    for (const [section, cards] of [
      ['#work', 4],
      ['#record', 4],
      ['#education', 2],
    ] as const) {
      const row = page.locator(`${section} .swipe`);
      await expect(row.locator('> *')).toHaveCount(cards);
      await expect(page.locator(`${section} .swipe-dot`)).toHaveCount(cards);
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
        page.viewportSize()!.width,
      );
      await page.locator(`${section} .swipe-dot`).nth(1).click();
      await expect(page.locator(`${section} .swipe-dot`).nth(1)).toHaveAttribute(
        'aria-current',
        'true',
      );
    }
  });
});
