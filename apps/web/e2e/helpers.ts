import { expect, type Page } from '@playwright/test';

const ANSWERS: Record<string, [string, string[]]> = {
  'What has Yash built with RAG?': [
    'TestPilot is the RAG project. It retrieves coding standards first.',
    ['testpilot'],
  ],
  'Has he worked with agents?': [
    'GuardianAI has a ReAct path for open-ended questions.',
    ['guardianai'],
  ],
  'Tell me about his education': ['Arizona State University, after a degree in India.', ['asu']],
  'Tell me about the rust process monitor': [
    'ProcWatch is a Rust terminal monitor.',
    ['procwatch'],
  ],
};

/** Stands in for the guide's API, which these page tests have no server for. Call it before openHome. */
export async function cannedGuide(page: Page) {
  await page.route('**/api/**', async (route) => {
    const request = route.request();
    const key = `${request.method()} ${new URL(request.url()).pathname}`;
    const json = (body: unknown) =>
      route.fulfill({ contentType: 'application/json', body: JSON.stringify(body) });
    if (key === 'POST /api/session') return json({ ok: true });
    if (key === 'GET /api/chat') return json({ messages: [] });
    if (key !== 'POST /api/chat') return route.fulfill({ status: 404, body: '{}' });
    const hit = ANSWERS[(request.postDataJSON() as { message: string }).message];
    if (!hit) return route.fulfill({ status: 500, body: '{}' });
    const [text, cites] = hit;
    const sse = (event: string, data: unknown) => `event: ${event}
data: ${JSON.stringify(data)}

`;
    await route.fulfill({
      contentType: 'text/event-stream',
      body:
        sse('meta', { userMessageId: 'u', assistantMessageId: 'a' }) +
        sse('token', { text }) +
        sse('done', { text, cites }),
    });
  });
}

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
