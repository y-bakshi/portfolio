import { FormEvent, KeyboardEvent, useEffect, useRef, useState } from 'react';
import { destinationFor } from './destinations';
import { prefersReducedMotion } from './shared';
import { loadUi, saveUi } from './storage';
import { Chips, Thread } from './Thread';
import { trackCiteClick } from './track';
import { useChat } from './useChat';
import { useFollowNewest } from './useFollowNewest';
import { useIsMobile, usePinToVisualViewport } from './useViewport';

/**
 * The guide's state and behaviour. The conversation lives in the chat panel on every screen. A chat
 * that was open before a refresh opens again once the home page's portrait has formed
 * (`portraitFormed`), so the page loads in order: portrait first, then the conversation.
 */
export function useGuide(portraitFormed = true) {
  const saved = useRef(loadUi());
  const [question, setQuestion] = useState(saved.current.draft);
  const chat = useChat();
  const { history, asked, answer, shown, announce, status } = chat;
  const [marked, setMarked] = useState<string | null>(null);
  const timers = useRef<number[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const logRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
  const pendingOpen = useRef(saved.current.open);
  useEffect(() => {
    if (portraitFormed && pendingOpen.current) {
      pendingOpen.current = false;
      restoredOpen.current = true; // restored, not opened by the visitor, so it takes no focus
      setOpen(true);
    }
  }, [portraitFormed]);

  // this tab remembers whether the chat was open and what was typed but not sent
  // (nothing is saved while a saved open chat waits for the portrait, or a second refresh would forget it)
  useEffect(() => {
    if (!pendingOpen.current) saveUi({ open, draft: question });
  }, [open, question]);

  const clearTimers = () => {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
  };
  useEffect(() => clearTimers, []);

  usePinToVisualViewport(open, isMobile);
  // a chat restored open after a refresh does not steal focus; one the visitor opens does
  const restoredOpen = useRef(saved.current.open);
  useEffect(() => {
    if (open && !restoredOpen.current) inputRef.current?.focus({ preventScroll: true });
    restoredOpen.current = false;
  }, [open]);
  // a saved conversation shows up late (after the portrait), so follow it again when it does
  const appeared = `${portraitFormed}-${open}`;
  useFollowNewest({
    logRef,
    asked,
    shown,
    status,
    count: history.length,
    appeared,
  });

  // the launcher is hidden while the panel is open, so focus can only go back to it once it shows again
  const returnFocus = useRef(false);
  useEffect(() => {
    if (!open && returnFocus.current) {
      returnFocus.current = false;
      toggleRef.current?.focus();
    }
  }, [open]);
  const closeDock = () => {
    returnFocus.current = true;
    setOpen(false);
  };
  const onDockKey = (e: KeyboardEvent<HTMLElement>) => {
    if (e.key === 'Escape' && open) closeDock();
  };

  const ask = (text: string) => {
    const q = text.trim();
    if (!q || status !== 'ready') return;
    setOpen(true);
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
      // an item that lives on another page: go there. On a wide screen the panel is beside the page, so
      // the chat reopens as it was; on a phone it covers the page, so it is left closed to show the card.
      if (isMobile) saveUi({ open: false, draft: question });
      window.location.assign(destinationFor(id));
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
    closeDock,
    onDockKey,
    isMobile,
    ask,
    onSubmit,
    show,
    thread,
    chipList,
    refs: { inputRef, toggleRef, logRef },
  };
}

export type Guide = ReturnType<typeof useGuide>;
