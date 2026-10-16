import { HugeiconsIcon } from '@hugeicons/react';
import { GithubIcon } from '@hugeicons/core-free-icons';
import { cn } from '@/lib/cn';
import { Container } from './Container';
import { GITHUB_URL, navItems, type PageId } from './nav';

/** The sticky header: the name, the page links, and GitHub. The current page's link is underlined. */
export function SiteHeader({ current }: { current: PageId }) {
  return (
    <header className="sticky top-0 z-30 border-b border-line/50 bg-ground/85 backdrop-blur-md">
      <a
        href="#main"
        className="sr-only z-40 rounded-md bg-ink px-4 py-2 text-ground focus:not-sr-only focus:absolute focus:top-3 focus:left-4"
      >
        Skip to content
      </a>
      <Container className="flex h-16 items-center justify-between gap-4 md:h-20">
        <a href="/" className="display text-2xl text-ink transition-colors hover:text-action">
          Yash Bakshi
        </a>
        <nav aria-label="Main" className="flex items-center gap-1 sm:gap-3">
          {navItems.map((item) => (
            <a
              key={item.id}
              href={item.href}
              aria-current={current === item.id ? 'page' : undefined}
              className={cn(
                'relative rounded-md px-2.5 py-2 text-[0.95rem] font-medium text-ink transition-colors hover:text-action sm:px-3',
                'after:absolute after:inset-x-2.5 after:bottom-0.5 after:h-0.5 after:origin-left after:scale-x-0 after:bg-action after:transition-transform after:duration-300 after:ease-out sm:after:inset-x-3',
                current === item.id && 'after:scale-x-100',
              )}
            >
              {item.label}
            </a>
          ))}
          <span className="mx-1 hidden h-6 w-px bg-line sm:block" aria-hidden="true" />
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Yash on GitHub (opens in a new tab)"
            className="rounded-md p-2 text-ink transition-colors hover:text-action"
          >
            <HugeiconsIcon icon={GithubIcon} size={24} />
          </a>
        </nav>
      </Container>
    </header>
  );
}
