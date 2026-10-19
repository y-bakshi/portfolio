import { expect, test } from '@playwright/test';
import {
  answers,
  askChip,
  bar,
  cannedGuide,
  input,
  openChat,
  openHome,
  panel,
  questions,
  ready,
} from './helpers';

test.beforeEach(async ({ page }) => {
  await cannedGuide(page);
});

test('the header folds its links into a menu', async ({ page }) => {
  await openHome(page);
  const menu = page.getByRole('button', { name: /open the menu/i });
  await menu.click();
  const link = page
    .getByRole('navigation', { name: 'Menu' })
    .getByRole('link', { name: 'Contact' });
  await expect(link).toBeVisible();
  await link.click();
  await expect(page).toHaveURL(/\/contact\/$/);
  await expect(page.getByRole('button', { name: /open the menu/i })).toBeVisible();
});

test('the launcher opens the chat as a page of its own, and back returns to where you were', async ({
  page,
}) => {
  await page.goto('/projects/');
  await openChat(page);
  await expect(page).toHaveURL(/\/chat\/$/);
  const box = (await panel(page).boundingBox())!;
  expect(box.x).toBeLessThanOrEqual(1);
  expect(box.width).toBeGreaterThanOrEqual(374);
  expect(box.height).toBeGreaterThanOrEqual(600);
  await page.getByRole('button', { name: 'Back', exact: true }).click();
  await expect(page).toHaveURL(/\/projects\/$/);
});

test('your messages sit right, the guide left, and the newest answer is fully visible', async ({
  page,
}) => {
  await openHome(page);
  await openChat(page);
  await askChip(page, 'Show me his backend experience');
  const q = (await questions(page).last().boundingBox())!;
  const a = (await answers(page).last().boundingBox())!;
  expect(q.x + q.width).toBeGreaterThan(a.x + a.width - 40);
  expect(q.x).toBeGreaterThan(a.x);
  await expect(answers(page).last()).toBeInViewport({ ratio: 0.5 });
});

test('the suggested questions go once one is tapped', async ({ page }) => {
  await openHome(page);
  await openChat(page);
  const chips = page.getByRole('list', { name: /suggested questions/i });
  await expect(chips).toBeVisible();
  await askChip(page, 'What has Yash built with RAG?');
  await expect(chips).toHaveCount(0);
});

test('the chat input is reachable and typing asks a question', async ({ page }) => {
  await openHome(page);
  await openChat(page);
  await input(page).fill('Tell me about the rust process monitor');
  await page.getByRole('button', { name: 'Ask', exact: true }).click();
  await expect(answers(page).filter({ hasText: 'ProcWatch is a Rust' })).toBeVisible();
  const box = (await input(page).boundingBox())!;
  expect(box.y + box.height).toBeLessThanOrEqual(812);
});

test('a source button takes you to the card on its page', async ({ page }) => {
  await openHome(page);
  await openChat(page);
  await askChip(page, 'What has Yash built with RAG?');
  await page.getByRole('button', { name: 'Show TestPilot on the page' }).click();
  await expect(page).toHaveURL(/\/projects\/#testpilot$/);
  await expect(page.locator('#testpilot')).toBeInViewport();
});

test('a source on another page opens that page, so the card shows', async ({ page }) => {
  await openHome(page);
  await openChat(page);
  await input(page).fill('Tell me about his education');
  await input(page).press('Enter');
  await ready(page);
  await page.getByRole('button', { name: /Show Arizona State University on the page/i }).click();
  await expect(page).toHaveURL(/\/#asu$/);
  await expect(page.locator('#asu')).toBeInViewport();
});

test('a tap on the shrunk launcher, while the page is still scrolling, opens the chat', async ({
  page,
}) => {
  await page.goto('/contact/');
  await page.mouse.wheel(0, 300);
  await expect(bar(page)).toHaveAttribute('data-scrolling', 'true');
  // a press and lift with no click after it, as on a phone that is still coasting
  await bar(page).dispatchEvent('pointerdown');
  await bar(page).dispatchEvent('pointerup');
  await expect(page).toHaveURL(/\/chat\/$/);
});
