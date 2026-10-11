import { expect, type Page } from '@playwright/test';

/** Open the page with the portrait animation out of the way. */
export async function openHome(page: Page) {
  await page.goto('/');
  await expect(page.getByRole('button', { name: /^ask the guide/i })).toBeVisible();
}

export const bar = (page: Page) => page.getByRole('button', { name: /^ask the guide/i });
export const input = (page: Page) => page.getByLabel(/ask the guide about yash/i);

/** Wait until the guide has finished answering. */
export async function ready(page: Page) {
  await expect(input(page)).toHaveAttribute('placeholder', 'Ready for your question', {
    timeout: 15_000,
  });
}

/** Ask one of the suggested questions and wait for the answer. */
export async function askChip(page: Page, name: string) {
  await page
    .locator('.dock-open, .dock-log')
    .getByRole('button', { name, exact: true })
    .first()
    .click();
  await ready(page);
}
