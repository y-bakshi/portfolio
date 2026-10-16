import { expect, test, type Page } from '@playwright/test';

const figure = (page: Page) => page.locator('figure.iso').first();

/** Where the first packet copy that is showing is, as the transform written on it. */
const packetTransforms = (page: Page) =>
  page.evaluate(() =>
    [...document.querySelectorAll('figure.iso [data-packet]')]
      .filter((el) => el.getAttribute('opacity') !== '0')
      .map((el) => el.getAttribute('transform') ?? ''),
  );

test('a figure runs: its packets move while it is on screen', async ({ page }) => {
  await page.goto('/projects/testpilot/');
  await figure(page).scrollIntoViewIfNeeded();
  await expect.poll(async () => (await packetTransforms(page)).length).toBeGreaterThan(0);
  const first = await packetTransforms(page);
  await page.waitForTimeout(700);
  const later = await packetTransforms(page);
  expect(later.join('|')).not.toBe(first.join('|'));
});

test('with reduced motion a figure holds one still frame', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/projects/testpilot/');
  await figure(page).scrollIntoViewIfNeeded();
  await expect.poll(async () => (await packetTransforms(page)).length).toBeGreaterThan(0);
  const first = await packetTransforms(page);
  await page.waitForTimeout(700);
  expect(await packetTransforms(page)).toEqual(first);
});

test('a figure describes itself and lists its steps', async ({ page }) => {
  await page.goto('/projects/testpilot/');
  const svg = figure(page).getByRole('img');
  await expect(svg).toHaveAttribute('aria-label', /production line/i);
  await expect(
    figure(page).getByRole('list', { name: /steps/i }).getByRole('listitem'),
  ).toHaveCount(5);
});

test('pointing at a step lifts its machine, and moving away puts it back', async ({ page }) => {
  await page.goto('/projects/testpilot/');
  const step = figure(page).locator('[data-step="draft"]');
  await step.scrollIntoViewIfNeeded();
  await step.hover();
  await expect(figure(page).locator('[data-station="draft"][data-active]').first()).toBeAttached();
  await expect(step).toHaveAttribute('data-active', '');
  await page.mouse.move(5, 5);
  await expect(figure(page).locator('[data-station][data-active]')).toHaveCount(0);
});

test('keyboard focus on a step lights it too', async ({ page }) => {
  await page.goto('/projects/testpilot/');
  const step = figure(page).locator('[data-step="critique"]');
  await figure(page).scrollIntoViewIfNeeded();
  await expect(figure(page).locator('svg')).toBeAttached();
  await step.focus();
  await expect(
    figure(page).locator('[data-station="critique"][data-active]').first(),
  ).toBeAttached();
});

test('every project on the projects page has a figure with its own steps', async ({ page }) => {
  await page.goto('/projects/');
  const articles = page.locator('main article');
  const count = await articles.count();
  expect(count).toBe(10);
  for (let i = 0; i < count; i++) {
    // the drawing is built as each one nears the screen
    await articles.nth(i).scrollIntoViewIfNeeded();
    await expect(articles.nth(i).locator('figure.iso svg[role="img"]')).toHaveCount(1);
  }
});
