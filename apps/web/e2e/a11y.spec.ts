import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { features } from '../src/layout/features';
import { askChip, cannedGuide, openChat, openHome, panel } from './helpers';

type Violation = { id: string; impact?: string | null; nodes: { html: string }[] };
const serious = (violations: Violation[]) =>
  violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');

const pages = ['/', '/projects/', '/projects/testpilot/', '/experience/', '/contact/', '/404.html'];

for (const path of pages) {
  test(`${path} has no serious accessibility violations`, async ({ page }) => {
    await page.goto(path);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    const results = await new AxeBuilder({ page }).analyze();
    expect(
      serious(results.violations),
      JSON.stringify(
        serious(results.violations).map((v) => [v.id, v.nodes[0]?.html.slice(0, 120)]),
      ),
    ).toEqual([]);
  });
}

test('the guide open and answering has none either', async ({ page }) => {
  await cannedGuide(page);
  await openHome(page);
  await openChat(page);
  await askChip(page, 'What has Yash built with RAG?');
  const results = await new AxeBuilder({ page }).analyze();
  expect(
    serious(results.violations),
    JSON.stringify(serious(results.violations).map((v) => v.id)),
  ).toEqual([]);
});

test('every figure step can be reached by keyboard', async ({ page }) => {
  await page.goto('/projects/testpilot/');
  const steps = page.locator('main figure [data-step]');
  for (let i = 0; i < (await steps.count()); i++) {
    expect(await steps.nth(i).getAttribute('tabindex')).toBe('0');
  }
});

test('reduced motion removes the movement', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await openHome(page);
  await openChat(page);
  await expect(panel(page)).toBeVisible();
  const scroll = await page.evaluate(
    () => getComputedStyle(document.documentElement).scrollBehavior,
  );
  expect(scroll).toBe('auto');
  if (features.techStrip) {
    const strip = await page
      .locator('.marquee-track')
      .evaluate((el) => getComputedStyle(el).animationName);
    expect(strip).toBe('none');
  }
});
