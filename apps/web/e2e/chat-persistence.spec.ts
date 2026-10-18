import { expect, test, type Page } from '@playwright/test';
import {
  answers,
  askChip,
  bar,
  input,
  openHome,
  questions,
  ready,
  isPhone,
  openChat,
} from './helpers';

const QUESTION = 'What has Yash built with RAG?';
const SERVED = 'This answer came from the mocked server.';

type Message = {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  cites: string[];
  createdAt: string;
  rating: number | null;
};

const sse = (event: string, data: unknown) => `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;

/**
 * A stand-in for the Worker, kept in memory for the length of one test. It stores what is asked,
 * so a reload gets it back, and records what the page sends.
 */
async function mockApi(page: Page, options: { failAsk?: boolean } = {}) {
  const server = { messages: [] as Message[], feedback: [] as unknown[], deletes: 0 };
  await page.route('**/api/**', async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    const json = (body: unknown, status = 200) =>
      route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });
    const key = `${request.method()} ${path}`;
    if (key === 'POST /api/session') return json({ ok: true });
    if (key === 'GET /api/chat') return json({ messages: server.messages });
    if (key === 'DELETE /api/chat') {
      server.deletes += 1;
      server.messages = [];
      return json({ ok: true });
    }
    if (key === 'POST /api/feedback') {
      server.feedback.push(request.postDataJSON());
      return json({ ok: true });
    }
    if (key === 'POST /api/chat') {
      if (options.failAsk) return json({ error: { code: 'internal' } }, 500);
      const { message } = request.postDataJSON() as { message: string };
      const n = server.messages.length;
      const at = new Date().toISOString();
      server.messages.push(
        { id: `u${n}`, role: 'user', text: message, cites: [], createdAt: at, rating: null },
        {
          id: `a${n}`,
          role: 'assistant',
          text: SERVED,
          cites: ['testpilot'],
          createdAt: at,
          rating: null,
        },
      );
      const body =
        sse('meta', { userMessageId: `u${n}`, assistantMessageId: `a${n}` }) +
        SERVED.split(/(?<=\s)/)
          .map((t) => sse('token', { text: t }))
          .join('') +
        sse('done', { text: SERVED, cites: ['testpilot'] });
      return route.fulfill({ status: 200, contentType: 'text/event-stream', body });
    }
    return json({ error: { code: 'not_found' } }, 404);
  });
  return server;
}

async function askOnce(page: Page) {
  await openHome(page);
  await openChat(page);
  await askChip(page, QUESTION);
  await expect(answers(page).filter({ hasText: SERVED }).first()).toBeVisible();
}

test.describe('the stored chat', () => {
  test('asking, then reloading, brings the conversation back', async ({ page }) => {
    await mockApi(page);
    await askOnce(page);
    await page.reload();
    await expect(answers(page).filter({ hasText: SERVED }).first()).toBeVisible();
    await expect(questions(page).filter({ hasText: QUESTION }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: 'Show TestPilot on the page' })).toBeVisible();
  });

  test('after a refresh the conversation waits for the portrait, then comes back', async ({
    page,
  }) => {
    test.skip(
      isPhone(page),
      'a phone has the chat on its own page, so there is nothing to wait for',
    );
    await mockApi(page);
    await askOnce(page);
    await page.reload();
    const saved = answers(page).filter({ hasText: SERVED }).first();
    // while the portrait is still forming, the saved chat has not opened
    await expect(bar(page)).toHaveAttribute('aria-expanded', 'false');
    // once the portrait has formed, the chat opens with the saved answers in it
    await expect(bar(page)).toHaveAttribute('aria-expanded', 'true', { timeout: 15_000 });
    await expect(saved).toBeVisible();
  });

  test('after a refresh the newest exchange is in view, not the oldest', async ({ page }) => {
    await mockApi(page);
    await openHome(page);
    await openChat(page);
    for (const chip of [
      'What has Yash built with RAG?',
      'Show me his backend experience',
      'Has he worked with agents?',
      'What cloud work has he done?',
    ]) {
      await askChip(page, chip);
    }
    await page.reload();
    await expect(answers(page).last()).toBeVisible({ timeout: 15_000 });
    await expect(questions(page).last()).toContainText('What cloud work has he done?');
    await expect(questions(page).last()).toBeInViewport();
    await expect(answers(page).last()).toBeInViewport();
  });

  test('the server copy restores the chat even when the browser copy is gone', async ({ page }) => {
    await mockApi(page);
    await askOnce(page);
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await expect(answers(page).filter({ hasText: SERVED }).first()).toBeVisible();
  });

  test('the notice is shown in the open chat', async ({ page }) => {
    await mockApi(page);
    await openHome(page);
    await openChat(page);
    await expect(
      page.getByText(
        'Questions and answers are saved anonymously for 90 days to improve the guide.',
      ),
    ).toBeVisible();
    await expect(page.getByRole('button', { name: 'Clear this chat' })).toBeVisible();
  });

  test('clearing the chat empties it here and on the server', async ({ page }) => {
    const server = await mockApi(page);
    await askOnce(page);
    await page.getByRole('button', { name: 'Clear this chat' }).click();
    await expect(questions(page)).toHaveCount(0);
    await expect.poll(() => server.deletes).toBe(1);
    await page.reload();
    await expect(questions(page)).toHaveCount(0);
  });

  test('when the API fails the guide says it cannot answer', async ({ page }) => {
    await mockApi(page, { failAsk: true });
    await openHome(page);
    await openChat(page);
    await askChip(page, QUESTION);
    await expect(
      answers(page)
        .filter({ hasText: /cannot answer just now/ })
        .first(),
    ).toBeVisible();
    await expect(page.getByRole('button', { name: 'Good answer' })).toHaveCount(0);
    await ready(page);
  });

  test('thumbs go to the feedback route', async ({ page }) => {
    const server = await mockApi(page);
    await askOnce(page);
    const up = page.getByRole('button', { name: 'Good answer' });
    const box = (await up.boundingBox())!;
    expect(box.width).toBeGreaterThanOrEqual(24);
    expect(box.height).toBeGreaterThanOrEqual(24);
    await up.click();
    await expect(up).toHaveAttribute('aria-pressed', 'true');
    await page.getByRole('button', { name: 'Poor answer' }).click();
    await expect
      .poll(() => server.feedback)
      .toEqual([
        { messageId: 'a0', value: 1 },
        { messageId: 'a0', value: -1 },
      ]);
  });

  test('the panel stays open and the draft stays in the box after a reload', async ({ page }) => {
    await mockApi(page);
    await openHome(page);
    await openChat(page);
    await input(page).fill('half written');
    await page.reload();
    await expect(input(page)).toHaveValue('half written');
    await ready(page);
  });
});
