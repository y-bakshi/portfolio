import type { Hono } from 'hono';
import type { AppEnv } from '../app';
import type { Deps } from '../deps';
import { streamAnswer, type AnswerResult } from '../lib/answerer';
import { appendMessage, recentTurns } from '../lib/chats';
import { validCites } from '../lib/cites';
import { ApiError } from '../lib/http';
import { MAX_ANSWER_CHARS, MAX_QUESTION_CHARS, redact } from '../lib/redact';
import { admit, ensureChat, readJsonObject, track, type Ctx } from './visitor';

/** How many earlier messages an answerer is shown (6 turns is 6 messages). */
export const HISTORY_TURNS = 6;
/** The most one answer may cost, reserved up front and settled afterwards. */
export const MAX_COST_MICRO_USD = 5000;

const encoder = new TextEncoder();

/** One server-sent event, ready to write. */
export const sseEvent = (name: string, data: unknown) =>
  encoder.encode(`event: ${name}\ndata: ${JSON.stringify(data)}\n\n`);

function readMessage(body: Record<string, unknown>): string {
  const text = typeof body.message === 'string' ? body.message.trim() : '';
  if (text.length < 1 || text.length > MAX_QUESTION_CHARS) {
    throw new ApiError(
      400,
      'bad_request',
      `Send a message of 1 to ${MAX_QUESTION_CHARS} characters.`,
    );
  }
  return text;
}

/** Keeps the work going when the browser leaves, where the platform allows it. */
function keepAlive(c: Ctx, work: Promise<unknown>) {
  try {
    c.executionCtx.waitUntil(work);
  } catch {
    // no execution context (a plain test call): the work still runs, it just is not held open
  }
}

/** POST /api/chat: store the question, then stream the answer and store it too. */
export function registerAskRoute(app: Hono<AppEnv>, deps: Deps) {
  app.post('/api/chat', async (c) => {
    const message = readMessage(await readJsonObject(c));
    const admitted = await admit(c, deps, 'chat', MAX_COST_MICRO_USD);
    const db = c.env.DB;
    const started = deps.clock();
    const question = redact(message);
    const userId = deps.newId();
    const assistantId = deps.newId();
    let history;
    try {
      const chatId = await ensureChat(c, deps);
      history = { chatId, turns: await recentTurns(db, chatId, HISTORY_TURNS) };
      await appendMessage(db, chatId, { id: userId, role: 'user', text: question }, started);
    } catch (error) {
      await admitted.release();
      throw error;
    }

    // the first question of a chat, then every question by its length only: never the words
    if (history.turns.length === 0) await track(c, deps, 'chat_started', undefined, history.chatId);
    await track(c, deps, 'question_asked', { length: question.length }, history.chatId);

    const { readable, writable } = new TransformStream<Uint8Array>();
    const writer = writable.getWriter();
    let open = true;
    // a closed browser makes writes fail; the answer is still produced and stored
    const send = async (name: string, data: unknown) => {
      if (!open) return;
      try {
        await writer.write(sseEvent(name, data));
      } catch {
        open = false;
      }
    };

    const work = (async () => {
      try {
        await send('meta', { userMessageId: userId, assistantMessageId: assistantId });
        const stream = streamAnswer(deps.answerer, question, history.turns);
        let result: AnswerResult;
        for (;;) {
          const step = await stream.next();
          if (step.done) {
            result = step.value;
            break;
          }
          await send('token', { text: step.value });
        }
        const text = redact(result.text, MAX_ANSWER_CHARS);
        const cites = validCites(result.cites);
        const now = deps.clock();
        const latencyMs = Math.max(0, now - started);
        await appendMessage(
          db,
          history.chatId,
          { id: assistantId, role: 'assistant', text, cites, meta: result.meta, latencyMs },
          now,
        );
        await admitted.settle(result.meta?.costMicroUsd ?? 0);
        const { model, topScore, inputTokens, outputTokens, costMicroUsd } = result.meta ?? {};
        await track(
          c,
          deps,
          'answer_shown',
          { latencyMs, model, topScore, inputTokens, outputTokens, costMicroUsd },
          history.chatId,
        );
        // the model was set up but the built-in keyword guide answered: the fallback was used
        if (model === 'keyword' && c.env.LLM_PROVIDER) {
          await track(c, deps, 'fallback_used', { reason: 'keyword' }, history.chatId);
        }
        await send('done', { text, cites });
      } catch (error) {
        console.error('chat answer failed', error);
        await admitted.release().catch(() => {});
        await track(c, deps, 'error', { code: 'internal' }, history.chatId);
        await send('error', { code: 'internal', message: 'The guide could not answer just now.' });
      } finally {
        await writer.close().catch(() => {});
      }
    })();
    keepAlive(c, work);

    c.header('content-type', 'text/event-stream; charset=utf-8');
    c.header('x-accel-buffering', 'no');
    return c.body(readable);
  });
}
