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
  'Show me his backend experience': [
    'Yash is a software engineer with experience across AI application engineering, production backend services, enterprise platforms, cloud delivery, and Linux infrastructure. During his internship at Thryv, he worked on Java and Micronaut backend services and opened 40 pull requests across eight repositories to improve release pipelines and fix dependency vulnerabilities. At Tata Consultancy Services, he worked as a ServiceNow developer using Python and LLDP discovery to keep a CMDB current and built runbooks that reduced onboarding time. Any other reasons to hire him are not in my notes.',
    ['thryv', 'tcs-dev'],
  ],
  'Tell me about his education': ['Arizona State University, after a degree in India.', ['asu']],
  'Tell me about the rust process monitor': [
    'ProcWatch is a Rust terminal monitor.',
    ['procwatch'],
  ],
};

/** Stands in for the guide's API, which these page tests have no server for. Call it before opening a page. */
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

/** Open the home page and wait until the guide's button is there. */
export async function openHome(page: Page) {
  await page.goto('/');
  await expect(page.getByRole('button', { name: /^ask the guide/i })).toBeVisible();
}

export const bar = (page: Page) => page.getByRole('button', { name: /^ask the guide/i });
export const input = (page: Page) => page.getByLabel(/ask the guide about yash/i);
/** The chat: the side panel on a wide screen, or the chat page on a phone. */
export const panel = (page: Page) =>
  page.locator('#guide-panel, main[aria-label="Chat with the guide"]');

/** A phone gets the chat as a page of its own; a wide screen gets the panel. */
export const isPhone = (page: Page) => (page.viewportSize()?.width ?? 1280) <= 900;

/** Open the chat from the launcher button, and wait for it to be there. */
export async function openChat(page: Page) {
  await bar(page).click();
  if (isPhone(page)) await page.waitForURL('**/chat/');
  await expect(panel(page)).toBeVisible();
}
export const answers = (page: Page) => page.locator('[data-answer]');
export const questions = (page: Page) => page.locator('[data-question]');

/** Wait until the guide has finished answering. */
export async function ready(page: Page) {
  await expect(panel(page).locator('[data-status="ready"]')).toBeVisible({ timeout: 15_000 });
}

/** Ask one of the suggested questions and wait for the answer. */
export async function askChip(page: Page, name: string) {
  const chip = panel(page).getByRole('button', { name, exact: true }).first();
  // on a phone the suggestions go once one is tapped, so a later question is typed
  if (await chip.count()) await chip.click();
  else {
    await input(page).fill(name);
    await input(page).press('Enter');
  }
  await ready(page);
}
