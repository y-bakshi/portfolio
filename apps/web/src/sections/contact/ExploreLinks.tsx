import { HugeiconsIcon } from '@hugeicons/react';
import { ArrowRight02Icon } from '@hugeicons/core-free-icons';

const links = [
  {
    href: '/projects/',
    title: 'Engineering projects',
    line: 'See the systems I built and the decisions behind them.',
  },
  {
    href: '/experience/',
    title: 'Experience',
    line: 'Explore backend delivery and technical leadership.',
  },
];

/** Two ways to learn more before writing. */
export function ExploreLinks() {
  return (
    <section aria-labelledby="explore-title" className="mt-14 border-t border-line/70 pt-10">
      <h2 id="explore-title" className="display text-4xl">
        Explore before you reach out
      </h2>
      <ul className="mt-6">
        {links.map((l) => (
          <li key={l.href} className="border-b border-line/70">
            <a
              href={l.href}
              className="group flex items-center justify-between gap-4 py-5 transition-colors hover:text-action"
            >
              <span className="grid gap-1 md:grid-cols-[16rem_1fr] md:gap-6">
                <span className="text-xl font-semibold">{l.title}</span>
                <span className="text-muted">{l.line}</span>
              </span>
              <HugeiconsIcon
                icon={ArrowRight02Icon}
                size={22}
                className="shrink-0 transition-transform group-hover:translate-x-1"
              />
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
