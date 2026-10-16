import { Container } from './Container';
import { credits } from './credits';
import { navItems } from './nav';

/** The navy footer band: copyright, icon credits and the page links. */
export function SiteFooter() {
  return (
    <footer className="mt-24 bg-ink text-panel">
      <Container className="flex flex-col gap-4 py-8 text-sm md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <p>Yash Bakshi © 2026</p>
          <p className="max-w-3xl text-panel/70">
            {credits.map((c) => (
              <span key={c.name}>
                {c.text}{' '}
                <a
                  className="underline underline-offset-4"
                  href={c.href}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {c.name}
                </a>
                {'note' in c ? c.note : ''}.{' '}
              </span>
            ))}
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
