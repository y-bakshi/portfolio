import { FormEvent, KeyboardEvent, useEffect, useRef, useState } from 'react';
import { Answer, answerFor, projects } from '../content';
import { prefersReducedMotion, type Status } from './shared';
import { Chips, Thread, type Exchange } from './Thread';
import { useFollowNewest } from './useFollowNewest';
import { useFollowPageEnd, useIsMobile, usePinToVisualViewport, useScrolled } from './useViewport';

/**
 * The guide's state and behaviour. On wide screens the conversation shows in the hero; on phones it
 * shows inside the chat itself.
 */
export function useGuide() {
  const [question, setQuestion] = useState('');
  const [asked, setAsked] = useState('');
  /** Finished exchanges, oldest first. The one in progress lives in asked, answer and shown. */
  const [history, setHistory] = useState<Exchange[]>([]);
  const [answer, setAnswer] = useState<Answer | null>(null);
  const [shown, setShown] = useState('');
  const [announce, setAnnounce] = useState('');
  const [status, setStatus] = useState<Status>('ready');
  const [marked, setMarked] = useState<string | null>(null);
  const timers = useRef<number[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const feedRef = useRef<HTMLDivElement>(null);
  const logRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  /** Phones show the conversation inside the chat; wide screens show it in the hero. */
  const showLog = isMobile;
  const [open, setOpen] = useState(false);
  const scrolled = useScrolled();

  const clearTimers = () => {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
  };
  useEffect(() => clearTimers, []);

  usePinToVisualViewport(open, isMobile);
  useFollowPageEnd(open, isMobile);
  useEffect(() => {
    if (open) inputRef.current?.focus({ preventScroll: true });
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
    clearTimers();
    if (asked && answer)
      setHistory((h) => [...h, { q: asked, text: answer.text, cites: answer.cites }]);
    setAsked(q);
    setQuestion('');
    setAnswer(null);
    setShown('');
    setAnnounce('');
    setMarked(null);
    setStatus('thinking');

    const result = answerFor(q);
    const reduce = prefersReducedMotion();
    timers.current.push(
      window.setTimeout(
        () => {
          setAnswer(result);
          setStatus('answering');
          if (reduce) {
            setShown(result.text);
            setAnnounce(result.text);
            setStatus('ready');
            return;
          }
          const words = result.text.split(' ');
          let i = 0;
          const tick = () => {
            i += 1;
            setShown(words.slice(0, i).join(' '));
            if (i < words.length) timers.current.push(window.setTimeout(tick, 28));
            else {
              setStatus('ready');
              setAnnounce(result.text);
            }
          };
          tick();
        },
        reduce ? 0 : 450,
      ),
    );
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
