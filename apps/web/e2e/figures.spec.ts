import { expect, test, type Page } from '@playwright/test';

const figure = (page: Page) => page.locator('main figure').first();

/** Where the first packet copy that is showing is, as the transform written on it. */
const packetTransforms = (page: Page) =>
  page.evaluate(() =>
    [...document.querySelectorAll('main figure [data-packet]')]
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
  const chart = figure(page).getByRole('img');
  await expect(chart).toHaveAttribute('aria-label', /flow chart/i);
  await expect(
    figure(page).getByRole('list', { name: /steps/i }).getByRole('listitem'),
  ).toHaveCount(5);
});

test('pointing at a step lifts its machine, and moving away puts it back', async ({ page }) => {
  await page.goto('/projects/testpilot/');
  const step = figure(page).locator('[data-step="draft"]');
  await step.scrollIntoViewIfNeeded();
  await step.hover();
  await expect(figure(page).locator('[data-station="draft"][data-active]')).toBeAttached();
  await expect(step).toHaveAttribute('data-active', '');
  await page.mouse.move(5, 5);
  await expect(figure(page).locator('[data-station][data-active]')).toHaveCount(0);
});

test('keyboard focus on a step lights it too', async ({ page }) => {
  await page.goto('/projects/testpilot/');
  const step = figure(page).locator('[data-step="critique"]');
  await figure(page).scrollIntoViewIfNeeded();
  await step.focus();
  await expect(
    figure(page).locator('[data-station="critique"][data-active]').first(),
  ).toBeAttached();
});

test('every project on the projects page has a flow chart with its own steps', async ({ page }) => {
  await page.goto('/projects/');
  const articles = page.locator('main article');
  const count = await articles.count();
  expect(count).toBe(10);
  for (let i = 0; i < count; i++) {
    await expect(articles.nth(i).locator('figure [role="img"]')).toHaveCount(1);
    await expect(articles.nth(i).locator('figure [data-station]').first()).toBeAttached();
  }
});

test('the TestPilot chart shows its loop back and what it says', async ({ page }) => {
  await page.goto('/projects/testpilot/');
  await expect(figure(page).getByText('Below 0.6: redraft')).toBeAttached();
  for (const name of [
    'Read repository',
    'Retrieve coding standards',
    'Draft tests',
    'Critique gate',
  ]) {
    await expect(figure(page).locator('[data-station]', { hasText: name })).toBeVisible();
  }
});
