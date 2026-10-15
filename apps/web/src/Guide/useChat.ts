import { useEffect, useRef, useState } from 'react';
import { answerFor, type Answer } from '../content';
import { askStream, clearChat, loadChat, sendFeedback, startSession } from './api';
import { toExchanges, toMessages } from './exchanges';
import { createReveal, wordsOf } from './reveal';
import { prefersReducedMotion, type Status } from './shared';
import {
  CHAT_KEY,
  loadMirror,
  parseMirror,
  saveMirror,
  type Rating,
  type SavedMessage,
} from './storage';
import type { Exchange } from './Thread';

/** How long "thinking" lasts before a built-in answer starts to appear. */
const THINK_MS = 450;

/** The answer for the question in progress. Only an answer the server stored has an id. */
export type Current = Answer & { id?: string; rating?: Rating | null };

const asExchange = (q: string, a: Current): Exchange => ({
  q,
  text: a.text,
  cites: a.cites,
  id: a.id,
  rating: a.rating ?? null,
});

/**
 * The conversation: what was asked, what was answered, and keeping it. The chat is kept on the
 * server and mirrored in this browser. When the API cannot answer, the built-in guide does, so
 * the visitor never sees an error.
 */
export function useChat() {
  const [history, setHistory] = useState<Exchange[]>(() => toExchanges(loadMirror()));
  const [asked, setAsked] = useState('');
  const [answer, setAnswer] = useState<Current | null>(null);
  const [shown, setShown] = useState('');
  const [announce, setAnnounce] = useState('');
  const [status, setStatus] = useState<Status>('ready');
  /** Identifies the question being answered, so a late reply to an older one is ignored. */
  const run = useRef(0);
  const reveal = useRef<ReturnType<typeof createReveal>>(undefined);
  const timers = useRef<number[]>([]);
  const statusRef = useRef(status);
  statusRef.current = status;
  const triedSession = useRef(false);
  /** True once the visitor has asked or cleared anything, after which the server copy must not overwrite. */
  const touched = useRef(false);

  const stopWork = () => {
    run.current += 1;
    reveal.current?.cancel();
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
  };
  useEffect(() => stopWork, []);

  const showMessages = (messages: SavedMessage[]) => {
    setHistory(toExchanges(messages));
    setAsked('');
    setAnswer(null);
    setShown('');
    setAnnounce('');
  };

  // paint from the browser copy (above), then let the server copy win
  useEffect(() => {
    let current = true;
    loadChat()
      .then((messages) => {
        // an empty server copy changes nothing: the visitor may have cookies blocked
        if (current && !touched.current && messages.length > 0) showMessages(messages);
      })
      .catch(() => {});
    return () => {
      current = false;
    };
  }, []);

  // keep the browser copy in step with what is on screen, once an answer has finished
  useEffect(() => {
    if (status !== 'ready') return;
    saveMirror(toMessages(asked && answer ? [...history, asExchange(asked, answer)] : history));
  }, [history, asked, answer, status]);

  // another tab changed the chat: show its version
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if ((e.key !== CHAT_KEY && e.key !== null) || statusRef.current !== 'ready') return;
      showMessages(parseMirror(window.localStorage.getItem(CHAT_KEY)));
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const pause = (ms: number) =>
    new Promise<void>((resolve) => timers.current.push(window.setTimeout(resolve, ms)));

  const send = async (q: string) => {
    touched.current = true;
    stopWork();
    const id = run.current;
    const live = () => run.current === id;
    const started = Date.now();
    const reduce = prefersReducedMotion();
    if (asked && answer) setHistory((h) => [...h, asExchange(asked, answer)]);
    setAsked(q);
    setAnswer(null);
    setShown('');
    setAnnounce('');
    setStatus('thinking');
    let writer = createReveal(setShown);
    reveal.current = writer;

    let final: Current;
    try {
      // the first message of a visit asks for the chat cookie before anything is stored
      if (!triedSession.current && !history.some((e) => e.id)) await startSession();
      triedSession.current = true;
      const result = await askStream(q, (piece) => {
        if (!live() || reduce) return;
        setStatus('answering');
        writer.push(piece);
      });
      final = {
        text: result.text,
        cites: result.cites,
        id: result.assistantMessageId || undefined,
      };
    } catch {
      if (!live()) return;
      // the API is down, slow or refusing: answer from the built-in notes, and store nothing
      writer.cancel();
      writer = createReveal(setShown);
      reveal.current = writer;
      setShown('');
      final = answerFor(q);
      await pause(reduce ? 0 : Math.max(0, THINK_MS - (Date.now() - started)));
      if (!live()) return;
      setStatus('answering');
      if (!reduce) wordsOf(final.text).forEach((w) => writer.push(w));
    }
    if (!reduce) await writer.drained();
    if (!live()) return;
    setShown(final.text);
    setAnswer(final);
    setAnnounce(final.text);
    setStatus('ready');
  };

  /** Empties the conversation here and asks the server to delete its copy. */
  const clear = async () => {
    touched.current = true;
    stopWork();
    showMessages([]);
    setStatus('ready');
    saveMirror([]);
    await clearChat().catch(() => {});
  };

  /** Records a thumb on a stored answer; it is undone if the server does not accept it. */
  const rate = (id: string, value: Rating) => {
    const before = answer?.id === id ? answer.rating : history.find((e) => e.id === id)?.rating;
    if (before === value) return;
    const apply = (rating: Rating | null) => {
      setHistory((h) => h.map((e) => (e.id === id ? { ...e, rating } : e)));
      setAnswer((a) => (a?.id === id ? { ...a, rating } : a));
    };
    apply(value);
    sendFeedback(id, value).catch(() => apply(before ?? null));
  };

  return { history, asked, answer, shown, announce, status, send, clear, rate };
}
