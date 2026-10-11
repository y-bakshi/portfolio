import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { askChip, bar, openHome } from './helpers';

const serious = (violations: { id: string; impact?: string | null }[]) =>
  violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');

test('home page has no serious accessibility violations', async ({ page }) => {
  await openHome(page);
  const results = await new AxeBuilder({ page }).analyze();
  expect(
    serious(results.violations),
    JSON.stringify(serious(results.violations).map((v) => v.id)),
  ).toEqual([]);
});

test('home page with the guide open and answering has none either', async ({ page }) => {
  await openHome(page);
  await bar(page).click();
  await askChip(page, 'What has Yash built with RAG?');
  const results = await new AxeBuilder({ page }).analyze();
  expect(
    serious(results.violations),
    JSON.stringify(serious(results.violations).map((v) => v.id)),
  ).toEqual([]);
});

test('case study has no serious accessibility violations', async ({ page }) => {
  await page.goto('/projects/testpilot');
  const results = await new AxeBuilder({ page }).analyze();
  expect(
    serious(results.violations),
    JSON.stringify(serious(results.violations).map((v) => v.id)),
  ).toEqual([]);
});

test('reduced motion removes the movement', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await openHome(page);
  await bar(page).click();
  const transition = await page
    .locator('.dock')
    .evaluate((el) => getComputedStyle(el).transitionProperty);
  expect(transition).toBe('none');
  const scroll = await page.evaluate(
    () => getComputedStyle(document.documentElement).scrollBehavior,
  );
  expect(scroll).toBe('auto');
});
