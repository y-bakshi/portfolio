/**
 * The browser's side of the chat API. Every call is same-origin, sends the chat cookie, and gives
 * up after a timeout. Failures come back as one error type, so the guide can fall back to its
 * plain "cannot answer" message without caring what went wrong.
 */
import type { Rating, SavedMessage } from './storage';
import { getTurnstileToken } from './turnstile';

/** The API could not do what was asked: it was unreachable, slow, refused, or answered badly. */
export class ApiFailure extends Error {
  constructor(
    message: string,
    readonly status?: number,
    /** The server's own words for a limit or a pause, which tell the visitor when to come back. */
    readonly notice?: string,
  ) {
    super(message);
  }
}

const SHORT_TIMEOUT_MS = 8000;
/** The answer may take a while to start, but must not go quiet for longer than this. */
const STREAM_IDLE_MS = 20000;

export type AskResult = {
  userMessageId: string;
  assistantMessageId: string;
  text: string;
  cites: string[];
};

/** Starts a timer that aborts the request; `reset` pushes it back, `stop` cancels it. */
function watchdog(controller: AbortController, ms: number) {
  let timer = setTimeout(() => controller.abort(), ms);
  return {
    reset() {
      clearTimeout(timer);
      timer = setTimeout(() => controller.abort(), ms);
    },
    stop: () => clearTimeout(timer),
  };
}

/** The message in a limit or pause response, when it has one. */
async function noticeFrom(res: Response): Promise<string | undefined> {
  try {
    const body = (await res.json()) as { error?: { message?: unknown } };
    const message = body.error?.message;
    return typeof message === 'string' && message.length < 300 ? message : undefined;
  } catch {
    return undefined;
  }
}

async function send(path: string, init: RequestInit, controller: AbortController) {
  try {
    const res = await fetch(path, {
      ...init,
      credentials: 'same-origin',
      signal: controller.signal,
      headers: {
        ...(init.body ? { 'content-type': 'application/json' } : {}),
        ...(init.headers as Record<string, string> | undefined),
      },
    });
    if (!res.ok) {
      const notice = res.status === 429 || res.status === 503 ? await noticeFrom(res) : undefined;
      throw new ApiFailure(`The API answered ${res.status}.`, res.status, notice);
    }
    return res;
  } catch (error) {
    if (error instanceof ApiFailure) throw error;
    throw new ApiFailure('The API could not be reached.');
  }
}

/** A request that returns JSON, with a timeout around the whole thing. */
async function json<T>(path: string, init: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timer = watchdog(controller, SHORT_TIMEOUT_MS);
  try {
    const res = await send(path, init, controller);
    return (await res.json()) as T;
  } catch (error) {
    if (error instanceof ApiFailure) throw error;
    throw new ApiFailure('The API answered badly or too slowly.');
  } finally {
    timer.stop();
  }
}

/** Gets the visitor a chat and its cookie, with the bot check's token when the site uses one. */
export async function startSession() {
  const token = await getTurnstileToken();
  return json<{ ok: boolean }>('/api/session', {
    method: 'POST',
    body: '{}',
    headers: token ? { 'cf-turnstile-response': token } : undefined,
  });
}

type ApiMessage = SavedMessage & { id: string };

/** The saved transcript, oldest first. A visitor with no chat gets an empty list. */
export async function loadChat(): Promise<SavedMessage[]> {
  const data = await json<{ messages?: ApiMessage[] }>('/api/chat', { method: 'GET' });
  if (!Array.isArray(data.messages)) throw new ApiFailure('The transcript was not a list.');
  return data.messages.map((m) => ({
    id: m.id,
    role: m.role,
    text: m.text,
    cites: Array.isArray(m.cites) ? m.cites : [],
    rating: m.rating === 1 || m.rating === -1 ? m.rating : null,
  }));
}

/** Deletes the visitor's saved chat. */
export const clearChat = () => json<{ ok: boolean }>('/api/chat', { method: 'DELETE' });

/** Records a thumb on one of the guide's answers. */
export const sendFeedback = (messageId: string, value: Rating) =>
  json<{ ok: boolean }>('/api/feedback', {
    method: 'POST',
    body: JSON.stringify({ messageId, value }),
  });

export type SseEvent = { event: string; data: unknown };

/**
 * Reads server-sent events from text that arrives in arbitrary pieces. A piece may end in the
 * middle of an event or even of a word, so unfinished text is kept until the blank line that ends it.
 */
export function createSseParser(onEvent: (event: SseEvent) => void) {
  let buffer = '';
  const emit = (block: string) => {
    let event = 'message';
    const data: string[] = [];
    for (const line of block.split('\n')) {
      if (line.startsWith('event:')) event = line.slice(6).trim();
      else if (line.startsWith('data:')) data.push(line.slice(5).replace(/^ /, ''));
    }
    if (data.length === 0) return;
    try {
      onEvent({ event, data: JSON.parse(data.join('\n')) });
    } catch {
      // a broken event is skipped; the stream carries on
    }
  };
  return (chunk: string) => {
    buffer += chunk.replace(/\r\n/g, '\n');
    let end = buffer.indexOf('\n\n');
    while (end !== -1) {
      emit(buffer.slice(0, end));
      buffer = buffer.slice(end + 2);
      end = buffer.indexOf('\n\n');
    }
  };
}

const asText = (v: unknown) => (typeof v === 'string' ? v : '');

/**
 * Asks a question and reads the answer as it streams. `onToken` gets each piece of text. Resolves
 * with the finished answer, and rejects if the stream fails, reports an error, or ends early.
 */
export async function askStream(
  message: string,
  onToken: (piece: string) => void,
  /** The page being read, so the guide knows what "this project" means. */
  page?: string,
): Promise<AskResult> {
  const controller = new AbortController();
  const timer = watchdog(controller, STREAM_IDLE_MS);
  try {
    const res = await send(
      '/api/chat',
      { method: 'POST', body: JSON.stringify({ message, page }) },
      controller,
    );
    if (!res.body) throw new ApiFailure('The API sent no stream.');
    const ids = { userMessageId: '', assistantMessageId: '' };
    const out: { done?: { text: string; cites: string[] }; failure?: ApiFailure } = {};
    const parse = createSseParser(({ event, data }) => {
      const d = (data ?? {}) as Record<string, unknown>;
      if (event === 'meta') {
        ids.userMessageId = asText(d.userMessageId);
        ids.assistantMessageId = asText(d.assistantMessageId);
      } else if (event === 'token') onToken(asText(d.text));
      else if (event === 'done') {
        const cites = Array.isArray(d.cites) ? d.cites.filter((c) => typeof c === 'string') : [];
        out.done = { text: asText(d.text), cites };
      } else if (event === 'error')
        out.failure = new ApiFailure(asText(d.message) || 'The guide failed.');
    });
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    for (;;) {
      const { done: finished, value } = await reader.read();
      if (finished) break;
      timer.reset();
      parse(decoder.decode(value, { stream: true }));
    }
    if (out.failure) throw out.failure;
    if (!out.done) throw new ApiFailure('The answer ended early.');
    return { ...ids, ...out.done };
  } catch (error) {
    if (error instanceof ApiFailure) throw error;
    throw new ApiFailure('The answer stream failed.');
  } finally {
    timer.stop();
  }
}
