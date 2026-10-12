import type { MouseEvent } from 'react';
import { DotGrid } from './DotGrid';

/** The sticky header: the name and the section links. */
export function SiteHeader() {
  /** On the home page a link to "/" does nothing, so scroll to the top instead. */
  const toTop = (e: MouseEvent<HTMLAnchorElement>) => {
    if (window.location.pathname !== '/') return;
    e.preventDefault();
    window.scrollTo({ top: 0 });
    window.history.replaceState(null, '', '/');
  };

  return (
    <header className="site-header">
      <DotGrid scope="header" />
      <a className="skip" href="#main">
        Skip to content
      </a>
      <a className="site-name" href="/" onClick={toTop}>
        Yash Bakshi
      </a>
      <nav aria-label="Main">
        <a href="/#work">Projects</a>
        <a href="/#record">Work history</a>
        <a href="/#contact">Contact</a>
      </nav>
    </header>
  );
}

/** A waterfall of pipeline stages: each stage starts a step to the right of the one before it. */
export function Trace({
  steps,
  label,
}: {
  steps: { label: string; depth: number }[];
  label: string;
}) {
  return (
    <ol className="trace" aria-label={label}>
      {steps.map((s, i) => (
        <li key={s.label + i} style={{ paddingLeft: `calc(${s.depth} * var(--trace-step))` }}>
          <span className="trace-bar" aria-hidden="true" />
          <span className="trace-label">{s.label}</span>
        </li>
      ))}
    </ol>
  );
}
