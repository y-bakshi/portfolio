import { expect, test } from '@playwright/test';
import { openHome } from './helpers';

const widths = [320, 375, 768, 1024, 1440];

for (const width of widths) {
  test(`home page has no sideways scrolling at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 800 });
    await openHome(page);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  });

  test(`case study has no sideways scrolling at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 800 });
    await page.goto('/projects/testpilot/');
    await expect(page.getByRole('heading', { level: 1, name: 'TestPilot' })).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  });
}

test('the header stays on one row and stays visible while scrolling', async ({ page }) => {
  await openHome(page);
  const header = page.getByRole('banner');
  const before = await header.boundingBox();
  await page.evaluate(() => window.scrollTo(0, 1500));
  await expect(header).toBeInViewport();
  const after = await header.boundingBox();
  expect(after!.y).toBeLessThanOrEqual(1);
  expect(before!.height).toBeLessThan(110);
});

test('the open page opens at the top when a case study link is followed', async ({ page }) => {
  await openHome(page);
  const link = page.getByRole('link', { name: /read the testpilot case study/i });
  await link.scrollIntoViewIfNeeded();
  expect(await page.evaluate(() => scrollY)).toBeGreaterThan(300);
  await link.click();
  await expect(page).toHaveURL(/\/projects\/testpilot\/$/);
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);
});

test('a link with a section in it lands on that section', async ({ page }) => {
  await page.goto('/#record');
  // the jump is a smooth scroll, so wait for it to arrive
  await expect
    .poll(
      () => page.locator('#record').evaluate((el) => Math.abs(el.getBoundingClientRect().top)),
      {
        timeout: 8000,
      },
    )
    .toBeLessThan(200);
});
