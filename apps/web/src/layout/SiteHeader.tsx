import { useState } from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import { Cancel01Icon, GithubIcon, Menu01Icon } from '@hugeicons/core-free-icons';
import { MorphGlyph } from '@/components/MorphGlyph';
import { cn } from '@/lib/cn';
import { Container } from './Container';
import { GITHUB_URL, navItems, type PageId } from './nav';

const link =
  'relative rounded-md px-3 py-2 text-[0.95rem] font-medium text-ink transition-colors hover:text-action';
const underline =
  'after:absolute after:inset-x-3 after:bottom-0.5 after:h-0.5 after:origin-left after:scale-x-0 after:bg-action after:transition-transform after:duration-300 after:ease-out';

/** The sticky header: the name, the page links, and GitHub. The current page's link is underlined. On a phone the links fold into a menu. */
export function SiteHeader({ current }: { current: PageId }) {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-30 border-b border-line/50 bg-ground/90 backdrop-blur-md">
      <a
        href="#main"
        className="sr-only z-40 rounded-md bg-ink px-4 py-2 text-ground focus:not-sr-only focus:absolute focus:top-3 focus:left-4"
      >
        Skip to content
      </a>
      <Container className="flex h-16 items-center justify-between gap-3 md:h-20">
        <a
          href="/"
          className="display text-2xl whitespace-nowrap text-ink transition-colors hover:text-action"
        >
          Yash Bakshi
        </a>
        <nav aria-label="Main" className="hidden items-center gap-2 sm:flex">
          {navItems.map((item) => (
            <a
              key={item.id}
              href={item.href}
              aria-current={current === item.id ? 'page' : undefined}
              className={cn(link, underline, current === item.id && 'after:scale-x-100')}
            >
              {item.label}
            </a>
          ))}
          <span className="mx-1 h-6 w-px bg-line" aria-hidden="true" />
          <GithubLink />
        </nav>
        <div className="flex items-center gap-1 sm:hidden">
          <GithubLink />
          <button
            type="button"
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? 'Close the menu' : 'Open the menu'}
            onClick={() => setOpen((o) => !o)}
            className="rounded-md p-2 text-ink transition-colors hover:text-action"
          >
            <MorphGlyph icon={open ? Cancel01Icon : Menu01Icon} />
          </button>
        </div>
      </Container>
      <nav
        id="mobile-nav"
        aria-label="Menu"
        hidden={!open}
        className="border-t border-line/50 bg-ground sm:hidden"
      >
        <Container className="flex flex-col py-2">
          {navItems.map((item) => (
            <a
              key={item.id}
              href={item.href}
              aria-current={current === item.id ? 'page' : undefined}
              className="rounded-md py-3 text-lg font-medium text-ink aria-[current=page]:text-action"
            >
              {item.label}
            </a>
          ))}
        </Container>
      </nav>
    </header>
  );
}

function GithubLink() {
  return (
    <a
      href={GITHUB_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Yash on GitHub (opens in a new tab)"
      className="rounded-md p-2 text-ink transition-colors hover:text-action"
    >
      <HugeiconsIcon icon={GithubIcon} size={24} />
    </a>
  );
}
