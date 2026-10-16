import { expect, test } from '@playwright/test';
import {
  answers,
  askChip,
  bar,
  cannedGuide,
  input,
  openHome,
  panel,
  questions,
  ready,
} from './helpers';

test.beforeEach(async ({ page }) => {
  await cannedGuide(page);
});

test('the panel opens as a column on the right, and the page behind it still scrolls', async ({
  page,
}) => {
  await openHome(page);
  await bar(page).click();
  await expect(panel(page)).toBeVisible();
  const box = (await panel(page).boundingBox())!;
  expect(box.x + box.width).toBeGreaterThanOrEqual(1279);
  expect(box.width).toBeLessThan(520);
  expect(box.height).toBeGreaterThanOrEqual(799);
  await expect(input(page)).toBeFocused();
  // not modal: the page behind can still be scrolled, and the headline is still there
  await page.mouse.move(300, 400);
  await page.mouse.wheel(0, 600);
  await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(200);
});

test('the closed panel is out of keyboard reach, and Escape closes the open one', async ({
  page,
}) => {
  await openHome(page);
  await expect(panel(page)).toHaveAttribute('inert', '');
  await bar(page).click();
  await expect(panel(page)).not.toHaveAttribute('inert', '');
  await page.keyboard.press('Escape');
  await expect(bar(page)).toHaveAttribute('aria-expanded', 'false');
  await expect(bar(page)).toBeFocused();
});

test('answers keep earlier ones, and a long answer is readable from its first line', async ({
  page,
}) => {
  await openHome(page);
  await bar(page).click();
  await askChip(page, 'What has Yash built with RAG?');
  await askChip(page, 'Show me his backend experience');
  await expect(questions(page)).toHaveCount(2);
  await expect(answers(page)).toHaveCount(2);
  // the newest question is pinned near the top of the log, so the long answer starts in view
  const log = panel(page).locator('.overflow-y-auto');
  const top = (await log.boundingBox())!.y;
  const q = (await questions(page).last().boundingBox())!.y;
  expect(q - top).toBeLessThan(60);
  await expect(answers(page).last()).toBeInViewport();
});

test('a source button scrolls the page to the card it names and marks it', async ({ page }) => {
  await page.goto('/projects/');
  await bar(page).click();
  await askChip(page, 'What has Yash built with RAG?');
  await page.getByRole('button', { name: 'Show TestPilot on the page' }).click();
  const card = page.locator('#testpilot');
  await expect(card).toBeInViewport();
  await expect(card).toBeFocused();
  await expect(card).toHaveAttribute('data-marked', 'true', { timeout: 3000 });
  // the panel stays open so the conversation is not lost
  await expect(bar(page)).toHaveAttribute('aria-expanded', 'true');
});

test('a source on another page opens that page, and the chat is open there too', async ({
  page,
}) => {
  await page.goto('/projects/');
  await bar(page).click();
  await input(page).fill('Tell me about his education');
  await input(page).press('Enter');
  await ready(page);
  await page.getByRole('button', { name: /Show Arizona State University on the page/i }).click();
  await expect(page).toHaveURL(/\/experience\/#asu$/);
  await expect(page.locator('#asu')).toBeInViewport();
  await expect(bar(page)).toHaveAttribute('aria-expanded', 'true');
  await ready(page);
});
