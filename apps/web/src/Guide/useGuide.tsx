import { FormEvent, KeyboardEvent, useEffect, useRef, useState } from 'react';
import { projects } from '../content';
import { prefersReducedMotion } from './shared';
import { loadUi, saveUi } from './storage';
import { Chips, Thread } from './Thread';
import { trackCiteClick } from './track';
import { useChat } from './useChat';
import { useFollowNewest } from './useFollowNewest';
import { useFollowPageEnd, useIsMobile, usePinToVisualViewport, useScrolled } from './useViewport';

/**
 * The guide's state and behaviour. On wide screens the conversation shows in the hero; on phones it
 * shows inside the chat itself.
 */
export function useGuide() {
  const saved = useRef(loadUi());
  const [question, setQuestion] = useState(saved.current.draft);
  const chat = useChat();
  const { history, asked, answer, shown, announce, status } = chat;
  const [marked, setMarked] = useState<string | null>(null);
  const timers = useRef<number[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const feedRef = useRef<HTMLDivElement>(null);
  const logRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  /** Phones show the conversation inside the chat; wide screens show it in the hero. */
  const showLog = isMobile;
  const [open, setOpen] = useState(saved.current.open);
  const scrolled = useScrolled();

  // this tab remembers whether the chat was open and what was typed but not sent
  useEffect(() => saveUi({ open, draft: question }), [open, question]);

  const clearTimers = () => {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
  };
  useEffect(() => clearTimers, []);

  usePinToVisualViewport(open, isMobile);
  useFollowPageEnd(open, isMobile);
  // a chat restored open after a refresh does not steal focus; one the visitor opens does
  const restoredOpen = useRef(saved.current.open);
  useEffect(() => {
    if (open && !restoredOpen.current) inputRef.current?.focus({ preventScroll: true });
    restoredOpen.current = false;
  }, [open]);
  useFollowNewest({ feedRef, logRef, isMobile, asked, shown, status, count: history.length });

  const [closing, setClosing] = useState(false);
  // The bar is hidden while the chat is open, so focus can only go back to it once it is showing again.
  const returnFocus = useRef(false);
  useEffect(() => {
    if (!open && returnFocus.current) {
      returnFocus.current = false;
      toggleRef.current?.focus();
    }
  }, [open]);
  const closeDock = () => {
    returnFocus.current = true;
    if (showLog || prefersReducedMotion()) {
      setOpen(false);
      return;
    }
    // let the open bar fade out (120 ms) before it collapses to the pill
    setClosing(true);
    timers.current.push(
      window.setTimeout(() => {
        setOpen(false);
        setClosing(false);
      }, 130),
    );
  };
  const onDockKey = (e: KeyboardEvent<HTMLElement>) => {
    if (e.key === 'Escape' && open) closeDock();
  };

  const ask = (text: string) => {
    const q = text.trim();
    if (!q || status !== 'ready') return;
    setOpen(true);
    if (!showLog && window.scrollY > 0) window.scrollTo({ top: 0 });
    setQuestion('');
    setMarked(null);
    void chat.send(q);
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!question.trim()) {
      inputRef.current?.focus();
      return;
    }
    ask(question);
  };

  const show = (id: string) => {
    trackCiteClick(id);
    const el = document.getElementById(id);
    if (!el) {
      // only the four featured projects are on this page; the rest are on the all-projects page
      if (projects.some((p) => p.id === id)) window.location.assign(`/projects/#${id}`);
      return;
    }
    if (isMobile) setOpen(false);
    // Scroll behavior comes from the stylesheet, so this matches every other jump on the page.
    // a jump of more than a screen and a half is instant; a long smooth scroll just makes people wait
    const far = Math.abs(el.getBoundingClientRect().top) > window.innerHeight * 1.5;
    el.scrollIntoView({ block: 'start', behavior: far ? ('instant' as ScrollBehavior) : 'auto' });
    // Move keyboard and screen reader focus to the target as well.
    el.focus({ preventScroll: true });
    const wait = prefersReducedMotion() ? 0 : 500;
    timers.current.push(window.setTimeout(() => setMarked(id), wait));
    timers.current.push(window.setTimeout(() => setMarked(null), wait + 4000));
  };

  const thread = (
    <Thread
      history={history}
      asked={asked}
      status={status}
      shown={shown}
      answer={answer}
      onShow={show}
      onRate={chat.rate}
    />
  );
  const chipList = <Chips status={status} onAsk={ask} />;

  return {
    question,
    setQuestion,
    asked,
    history,
    answer,
    shown,
    announce,
    status,
    clear: chat.clear,
    marked,
    open,
    setOpen,
    closing,
    closeDock,
    onDockKey,
    scrolled,
    isMobile,
    showLog,
    ask,
    onSubmit,
    show,
    thread,
    chipList,
    refs: { inputRef, toggleRef, feedRef, logRef },
  };
}

export type Guide = ReturnType<typeof useGuide>;
