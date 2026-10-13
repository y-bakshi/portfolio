import type { MouseEvent } from 'react';
import { DotGrid } from './DotGrid';

/** A thin strip at the very top that says the site is unfinished. Remove it at launch. */
export function WipBanner() {
  return (
    <div className="wip" role="note">
      <span className="sr-only">This site is a work in progress.</span>
      <div className="wip-run" aria-hidden="true">
        {Array.from({ length: 48 }, (_, i) => (
          <span key={i}>Work in progress</span>
        ))}
      </div>
    </div>
  );
}

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
