import { expect, test } from '@playwright/test';
import { answers, askChip, bar, cannedGuide, input, openHome, panel, questions } from './helpers';

test.beforeEach(async ({ page }) => {
  await cannedGuide(page);
});

test('the header folds its links into a menu', async ({ page }) => {
  await openHome(page);
  const menu = page.getByRole('button', { name: /open the menu/i });
  await menu.click();
  const link = page
    .getByRole('navigation', { name: 'Menu' })
    .getByRole('link', { name: 'Experience' });
  await expect(link).toBeVisible();
  await link.click();
  await expect(page).toHaveURL(/\/experience\/$/);
  await expect(page.getByRole('button', { name: /open the menu/i })).toBeVisible();
});

test('the open chat takes the whole screen and locks the page behind it', async ({ page }) => {
  await openHome(page);
  await bar(page).click();
  const box = (await panel(page).boundingBox())!;
  expect(box.x).toBeLessThanOrEqual(1);
  expect(box.width).toBeGreaterThanOrEqual(374);
  expect(box.height).toBeGreaterThanOrEqual(700);
  expect(await page.evaluate(() => getComputedStyle(document.documentElement).overflow)).toBe(
    'hidden',
  );
  await page.keyboard.press('Escape');
  await expect(bar(page)).toHaveAttribute('aria-expanded', 'false');
  expect(await page.evaluate(() => getComputedStyle(document.documentElement).overflow)).not.toBe(
    'hidden',
  );
});

test('your messages sit right, the guide left, and the newest answer is fully visible', async ({
  page,
}) => {
  await openHome(page);
  await bar(page).click();
  await askChip(page, 'Show me his backend experience');
  const q = (await questions(page).last().boundingBox())!;
  const a = (await answers(page).last().boundingBox())!;
  expect(q.x + q.width).toBeGreaterThan(a.x + a.width - 40);
  expect(q.x).toBeGreaterThan(a.x);
  await expect(answers(page).last()).toBeInViewport({ ratio: 0.5 });
});

test('the chat input is reachable and typing asks a question', async ({ page }) => {
  await openHome(page);
  await bar(page).click();
  await input(page).fill('Tell me about the rust process monitor');
  await page.getByRole('button', { name: 'Ask', exact: true }).click();
  await expect(answers(page).filter({ hasText: 'ProcWatch is a Rust' })).toBeVisible();
  const box = (await input(page).boundingBox())!;
  expect(box.y + box.height).toBeLessThanOrEqual(812);
});

test('a source button closes the chat and shows the card', async ({ page }) => {
  await openHome(page);
  await bar(page).click();
  await askChip(page, 'What has Yash built with RAG?');
  await page.getByRole('button', { name: 'Show TestPilot on the page' }).click();
  await expect(bar(page)).toHaveAttribute('aria-expanded', 'false');
  await expect(page.locator('#testpilot')).toBeInViewport();
});
