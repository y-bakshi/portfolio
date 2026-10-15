import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Home from '../App';
import { CHAT_KEY, UI_KEY } from './storage';
import { SAVED_NOTICE } from './copy';

vi.mock('../DotGrid', () => ({ DotGrid: () => null }));
vi.mock('../MistPortrait', () => ({ MistPortrait: () => <div data-testid="portrait" /> }));

const enc = new TextEncoder();
const sse = (event: string, data: unknown) => `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;

function answerStream(text: string, cites: string[], ids = ['u1', 'a1']) {
  const pieces = [
    sse('meta', { userMessageId: ids[0], assistantMessageId: ids[1] }),
    ...text.split(/(?<=\s)/).map((t) => sse('token', { text: t })),
    sse('done', { text, cites }),
  ];
  return new Response(
    new ReadableStream({
      start(c) {
        pieces.forEach((p) => c.enqueue(enc.encode(p)));
        c.close();
      },
    }),
  );
}

type Handler = (url: string, init: RequestInit) => Response | Promise<Response>;

/** Fakes the API: each handler is looked up by "METHOD /path"; anything else fails like an outage. */
function fakeApi(handlers: Record<string, Handler>) {
  const fn = vi.fn(async (url: string, init: RequestInit = {}) => {
    const handler = handlers[`${init.method ?? 'GET'} ${url}`];
    if (!handler) throw new TypeError('offline');
    return handler(url, init);
  });
  vi.stubGlobal('fetch', fn);
  return fn;
}

const calls = (fn: ReturnType<typeof fakeApi>, key: string) =>
  fn.mock.calls.filter(([url, init]) => `${init?.method ?? 'GET'} ${url}` === key);

const bar = () => screen.getByRole('button', { name: /^ask the guide/i });
const panel = () => document.getElementById('dock-open') as HTMLElement;
const input = () => screen.getByLabelText(/ask the guide about yash/i) as HTMLInputElement;
const ok = () => Response.json({ ok: true });
const transcript = (messages: unknown[]) => () => Response.json({ messages });

const stored = [
  { id: 'su', role: 'user', text: 'Saved question', cites: [], rating: null },
  { id: 'sa', role: 'assistant', text: 'Saved answer', cites: ['testpilot'], rating: null },
];

describe('the stored guide chat', () => {
  it('asks the API and shows the streamed answer with its sources and thumbs', async () => {
    const api = fakeApi({
      'GET /api/chat': transcript([]),
      'POST /api/session': ok,
      'POST /api/chat': () => answerStream('TestPilot uses RAG for tests.', ['testpilot', 'nope']),
    });
    const user = userEvent.setup();
    render(<Home />);
    await user.click(bar());
    await user.type(input(), 'How does TestPilot use RAG?{Enter}');
    expect(
      await screen.findByText('TestPilot uses RAG for tests.', { selector: '.msg-answer' }),
    ).toBeInTheDocument();
    expect(await screen.findByRole('button', { name: 'Good answer' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Show TestPilot on the page' })).toBeInTheDocument();
    expect(calls(api, 'POST /api/session')).toHaveLength(1);
    expect(JSON.parse(calls(api, 'POST /api/chat')[0][1]!.body as string)).toEqual({
      message: 'How does TestPilot use RAG?',
    });
    await waitFor(() => expect(localStorage.getItem(CHAT_KEY)).toContain('TestPilot uses RAG'));
  });

  it('paints the browser copy at once, then lets the server copy win', async () => {
    localStorage.setItem(
      CHAT_KEY,
      JSON.stringify({
        v: 1,
        messages: [
          { role: 'user', text: 'Old question', cites: [] },
          { role: 'assistant', text: 'Old answer', cites: [] },
        ],
      }),
    );
    let release!: () => void;
    const gate = new Promise<void>((r) => (release = r));
    fakeApi({
      'GET /api/chat': async () => {
        await gate;
        return Response.json({ messages: stored });
      },
    });
    render(<Home />);
    expect(screen.getByText('Old answer', { selector: '.msg-answer' })).toBeInTheDocument();
    release();
    expect(
      await screen.findByText('Saved answer', { selector: '.msg-answer' }),
    ).toBeInTheDocument();
    expect(screen.queryByText('Old answer')).toBeNull();
    expect(screen.getByText('Saved question', { selector: '.msg-user' })).toBeInTheDocument();
  });

  it('keeps the browser copy when the server has nothing or cannot be reached', async () => {
    localStorage.setItem(
      CHAT_KEY,
      JSON.stringify({
        v: 1,
        messages: [
          { role: 'user', text: 'Kept question', cites: [] },
          { role: 'assistant', text: 'Kept answer', cites: [] },
        ],
      }),
    );
    fakeApi({});
    render(<Home />);
    await act(async () => {});
    expect(screen.getByText('Kept answer', { selector: '.msg-answer' })).toBeInTheDocument();
  });

  it('falls back to the built-in answer on a server error, and offers no thumbs for it', async () => {
    fakeApi({
      'GET /api/chat': transcript([]),
      'POST /api/session': ok,
      'POST /api/chat': () => new Response('{}', { status: 500 }),
    });
    const user = userEvent.setup();
    render(<Home />);
    await user.click(bar());
    await user.click(
      within(panel()).getByRole('button', { name: 'What has Yash built with RAG?' }),
    );
    expect(
      await screen.findByText(/TestPilot is the RAG project/, { selector: '.msg-answer' }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Good answer' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Show TestPilot on the page' })).toBeInTheDocument();
  });

  it.each([
    ['rate limited', () => new Response('{}', { status: 429 })],
    ['an error event', () => new Response(sse('error', { code: 'internal', message: 'No.' }))],
    ['a stream that ends early', () => new Response(sse('meta', { userMessageId: 'a' }))],
  ])('falls back when the API is %s', async (_name, reply) => {
    fakeApi({ 'GET /api/chat': transcript([]), 'POST /api/session': ok, 'POST /api/chat': reply });
    const user = userEvent.setup();
    render(<Home />);
    await user.click(bar());
    await user.type(input(), 'Tell me about his education{Enter}');
    expect(
      await screen.findByText(/Arizona State University, after/, { selector: '.msg-answer' }),
    ).toBeInTheDocument();
  });

  it('sends a thumb to the feedback route and shows it pressed', async () => {
    const api = fakeApi({
      'GET /api/chat': transcript(stored),
      'POST /api/feedback': ok,
    });
    const user = userEvent.setup();
    render(<Home />);
    const up = await screen.findByRole('button', { name: 'Good answer' });
    await user.click(up);
    expect(up).toHaveAttribute('aria-pressed', 'true');
    expect(JSON.parse(calls(api, 'POST /api/feedback')[0][1]!.body as string)).toEqual({
      messageId: 'sa',
      value: 1,
    });
    await user.click(screen.getByRole('button', { name: 'Poor answer' }));
    expect(up).toHaveAttribute('aria-pressed', 'false');
  });

  it('undoes a thumb the server did not accept', async () => {
    fakeApi({
      'GET /api/chat': transcript(stored),
      'POST /api/feedback': () => new Response('{}', { status: 404 }),
    });
    const user = userEvent.setup();
    render(<Home />);
    const up = await screen.findByRole('button', { name: 'Good answer' });
    await user.click(up);
    await waitFor(() => expect(up).toHaveAttribute('aria-pressed', 'false'));
  });

  it('shows the notice in the open chat and clears the chat on request', async () => {
    const api = fakeApi({ 'GET /api/chat': transcript(stored), 'DELETE /api/chat': ok });
    const user = userEvent.setup();
    render(<Home />);
    await screen.findByText('Saved answer', { selector: '.msg-answer' });
    await user.click(bar());
    expect(within(panel()).getByText(SAVED_NOTICE)).toBeInTheDocument();
    await user.click(within(panel()).getByRole('button', { name: 'Clear this chat' }));
    expect(document.querySelector('.msg-user')).toBeNull();
    expect(screen.queryByText('Saved answer')).toBeNull();
    expect(calls(api, 'DELETE /api/chat')).toHaveLength(1);
    expect(localStorage.getItem(CHAT_KEY)).toBeNull();
  });

  it('remembers whether the panel was open and the unsent draft for this tab', async () => {
    fakeApi({});
    const user = userEvent.setup();
    const first = render(<Home />);
    await user.click(bar());
    await user.type(input(), 'half a thought');
    first.unmount();
    expect(JSON.parse(sessionStorage.getItem(UI_KEY)!)).toMatchObject({ open: true });

    render(<Home />);
    expect(bar()).toHaveAttribute('aria-expanded', 'true');
    expect(input()).toHaveValue('half a thought');
    // restored, not opened by the visitor, so focus is left alone
    expect(input()).not.toHaveFocus();
  });

  it('follows a change made by another tab', async () => {
    fakeApi({});
    render(<Home />);
    const next = JSON.stringify({
      v: 1,
      messages: [
        { role: 'user', text: 'From the other tab', cites: [] },
        { role: 'assistant', text: 'Other tab answer', cites: [] },
      ],
    });
    localStorage.setItem(CHAT_KEY, next);
    act(() => {
      window.dispatchEvent(new StorageEvent('storage', { key: CHAT_KEY, newValue: next }));
    });
    expect(
      await screen.findByText('Other tab answer', { selector: '.msg-answer' }),
    ).toBeInTheDocument();
    localStorage.removeItem(CHAT_KEY);
    act(() => {
      window.dispatchEvent(new StorageEvent('storage', { key: CHAT_KEY, newValue: null }));
    });
    await waitFor(() => expect(screen.queryByText('Other tab answer')).toBeNull());
  });
});
