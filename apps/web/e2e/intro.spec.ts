import { expect, test } from '@playwright/test';

const typedText = (page: import('@playwright/test').Page) =>
  page.locator('.ask-lede [aria-hidden="true"]').evaluate((el) => el.firstChild?.textContent ?? '');

test('the introduction waits for the portrait, then types itself out', async ({ page }) => {
  await page.goto('/');
  const lede = page.locator('.ask-lede');
  // empty and invisible while the portrait forms
  await expect(lede).toHaveClass(/is-waiting/);
  // the whole sentence is in the page for screen readers the whole time
  await expect(lede.locator('.sr-only')).toContainText('working across AI applications');
  // then it appears and the last words arrive
  await expect(lede).not.toHaveClass(/is-waiting/, { timeout: 15000 });
  await expect.poll(() => typedText(page), { timeout: 15000 }).toContain('from my own notes.');
});

test('with reduced motion the introduction is there at once', async ({ browser }) => {
  const context = await browser.newContext({ reducedMotion: 'reduce' });
  const page = await context.newPage();
  await page.goto('/');
  await expect(page.locator('.ask-lede')).not.toHaveClass(/is-waiting/, { timeout: 5000 });
  expect(await typedText(page)).toContain('from my own notes.');
  await context.close();
});
