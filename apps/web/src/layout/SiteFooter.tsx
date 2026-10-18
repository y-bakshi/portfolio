import { privacyShort } from '../content/privacy';
import { Container } from './Container';
import { navItems } from './nav';

/** The navy footer band: copyright, a line about cookies and privacy, and the page links. */
export function SiteFooter() {
  return (
    <footer className="mt-24 bg-ink text-panel">
      <Container className="flex flex-col gap-4 py-8 text-sm md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <p>Yash Bakshi © 2026</p>
          <p className="max-w-3xl text-panel/70">
            {privacyShort}{' '}
            <a className="underline underline-offset-4 hover:text-panel" href="/privacy/">
              Privacy and credits
            </a>
          </p>
        </div>
        <nav aria-label="Footer" className="flex gap-6">
          {navItems.map((item) => (
            <a key={item.id} href={item.href} className="transition-colors hover:text-mark">
              {item.label}
            </a>
          ))}
        </nav>
      </Container>
    </footer>
  );
}
