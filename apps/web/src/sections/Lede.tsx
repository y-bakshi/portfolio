import { useEffect, useState } from 'react';

/** Milliseconds per character: a person typing a sentence, not a printer. */
const TYPE_MS = 18;

/**
 * The introduction bubble. It stays empty until `start`, then types itself out. The whole text is
 * always in the page for screen readers, and the not yet typed part holds its space, so the bubble
 * never changes size. With reduced motion the text appears at once.
 */
export function Lede({ text, start }: { text: string; start: boolean }) {
  const [shown, setShown] = useState(0);

  useEffect(() => {
    if (!start) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setShown(text.length);
      return;
    }
    const timer = window.setInterval(() => {
      setShown((n) => {
        if (n + 1 >= text.length) window.clearInterval(timer);
        return n + 1;
      });
    }, TYPE_MS);
    return () => window.clearInterval(timer);
  }, [start, text]);

  return (
    <p className={`ask-lede${start ? '' : ' is-waiting'}`}>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">
        {text.slice(0, shown)}
        <span className="ask-rest">{text.slice(shown)}</span>
      </span>
    </p>
  );
}
