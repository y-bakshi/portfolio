import { expect, test } from '@playwright/test';
import { bar, openHome } from './helpers';

test.describe('wide screens with the chat bar open', () => {
  for (const height of [760, 800, 900, 963]) {
    test(`the projects screen keeps all four tiles above the bar at ${height}px high`, async ({
      page,
    }) => {
      test.skip((page.viewportSize()?.width ?? 0) < 901, 'the bar is a full-screen chat on phones');
      await page.setViewportSize({ width: 1400, height });
      await openHome(page);
      await bar(page).click();
      await expect(page.locator('.dock')).toHaveClass(/is-open/);
      await page.evaluate(() => document.querySelector('#work')!.scrollIntoView());
      // the page rests on the projects screen after one wheel step from the top
      await page.mouse.move(600, 300);
      await expect
        .poll(() =>
          page.locator('#work').evaluate((el) => Math.abs(el.getBoundingClientRect().top - 80)),
        )
        .toBeLessThan(40);
      const dockTop = await page.locator('.dock').evaluate((el) => el.getBoundingClientRect().top);
      const links = page.locator('#work .tile-actions');
      for (let i = 0; i < 4; i++) {
        const box = (await links.nth(i).boundingBox())!;
        expect(box.y + box.height, `tile ${i + 1}`).toBeLessThanOrEqual(dockTop);
      }
    });
  }

  test('opening the chat at the end of the page keeps the footer in view', async ({ page }) => {
    test.skip((page.viewportSize()?.width ?? 0) < 901, 'the bar is a full-screen chat on phones');
    await openHome(page);
    await page.evaluate(() => window.scrollTo({ top: 99999, behavior: 'instant' }));
    await bar(page).click();
    await expect(page.locator('.dock')).toHaveClass(/is-open/);
    const gap = () =>
      page.evaluate(
        () =>
          document.querySelector('.dock')!.getBoundingClientRect().top -
          document.querySelector('.site-footer')!.getBoundingClientRect().bottom,
      );
    // the page follows down to its new end, so the footer ends where the bar begins
    await expect.poll(gap).toBeGreaterThanOrEqual(-1);
  });
});
