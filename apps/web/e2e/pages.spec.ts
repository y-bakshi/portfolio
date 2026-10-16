import { expect, test, type Page } from '@playwright/test';
import { features } from '../src/layout/features';
import { openHome } from './helpers';

const pages = [
  { path: '/', heading: /hi yash here/i },
  { path: '/projects/', heading: /engineering projects/i },
  { path: '/projects/testpilot/', heading: /^testpilot$/i },
  { path: '/experience/', heading: /engineering experience/i },
  { path: '/contact/', heading: /let.s talk/i },
  { path: '/404.html', heading: /page not found/i },
];

const overflow = (page: Page) =>
  page.evaluate(() => document.documentElement.scrollWidth - innerWidth);

for (const width of [320, 375, 768, 1024, 1440]) {
  for (const { path, heading } of pages) {
    test(`${path} has no sideways scrolling at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 });
      await page.goto(path);
      await expect(page.getByRole('heading', { level: 1, name: heading })).toBeVisible();
      expect(await overflow(page)).toBeLessThanOrEqual(0);
    });
  }
}

test('the header stays visible while scrolling and the current page is marked', async ({
  page,
}) => {
  await page.goto('/projects/');
  const header = page.getByRole('banner');
  await page.evaluate(() => window.scrollTo(0, 600));
  await expect(header).toBeInViewport();
  expect((await header.boundingBox())!.y).toBeLessThanOrEqual(1);
  await expect(page.locator('header a[aria-current="page"]').first()).toHaveAttribute(
    'href',
    '/projects/',
  );
});

test('the links between pages go where they say', async ({ page }) => {
  await page.goto('/projects/');
  await page.getByRole('link', { name: /read case study/i }).click();
  await expect(page).toHaveURL(/\/projects\/testpilot\/$/);
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);
  await page.getByRole('contentinfo').getByRole('link', { name: 'Contact' }).click();
  await expect(page).toHaveURL(/\/contact\/$/);
});

test('a link with a project in it lands on that project', async ({ page }) => {
  await page.goto('/projects/#procwatch');
  await expect
    .poll(
      () => page.locator('#procwatch').evaluate((el) => Math.abs(el.getBoundingClientRect().top)),
      {
        timeout: 8000,
      },
    )
    .toBeLessThan(200);
});

test('the filter tabs show only the projects in a category', async ({ page }) => {
  await page.goto('/projects/');
  const rows = page.locator('main article');
  const all = await rows.count();
  await page.getByRole('tab', { name: 'Systems' }).click();
  const systems = await rows.count();
  expect(systems).toBeGreaterThan(0);
  expect(systems).toBeLessThan(all);
  await page.getByRole('tab', { name: 'All projects' }).click();
  await expect(rows).toHaveCount(all);
});

test('the contact page copies the email address', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('/contact/');
  await page.getByRole('button', { name: /copy email address/i }).click();
  await expect(page.getByRole('button', { name: /email address copied/i })).toBeVisible();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe('bakshi.yash@outlook.com');
});

test('the technology strip can be paused', async ({ page }) => {
  test.skip(!features.techStrip, 'the strip is switched off in src/layout/features.ts');
  await openHome(page);
  const pause = page.getByRole('button', { name: /pause the technology strip/i });
  await pause.click();
  await expect(page.getByRole('button', { name: /play the technology strip/i })).toBeVisible();
  const state = await page
    .locator('.marquee-track')
    .evaluate((el) => getComputedStyle(el).animationPlayState);
  expect(state).toBe('paused');
});
