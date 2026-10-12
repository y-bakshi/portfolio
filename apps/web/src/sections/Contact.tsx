import type { Guide } from '../Guide';
import { Icon, type IconName } from '../Icon';

const contactLinks: { label: string; href: string; icon: IconName; external?: boolean }[] = [
  { label: 'ybakshi@asu.edu', href: 'mailto:ybakshi@asu.edu', icon: 'envelope' },
  {
    label: 'bakshi.yash@outlook.com',
    href: 'mailto:bakshi.yash@outlook.com',
    icon: 'envelope',
  },
  {
    label: 'LinkedIn',
    href: 'https://www.linkedin.com/in/yash-bakshi-56615a62/',
    icon: 'linkedin',
    external: true,
  },
  {
    label: 'GitHub',
    href: 'https://github.com/y-bakshi',
    icon: 'github',
    external: true,
  },
  {
    label: 'Book a 30 minute call',
    href: 'https://calendar.app.google/GNW9xhXdiq7Mv9bU9',
    icon: 'calendar',
    external: true,
  },
];

/** The contact band at the bottom of the page, with its links. */
export function Contact({ marked }: Pick<Guide, 'marked'>) {
  return (
    <section
      className={`contact${marked === 'contact' ? ' is-marked' : ''}`}
      id="contact"
      tabIndex={-1}
      aria-labelledby="contact-title"
    >
      <h2 id="contact-title" className="contact-title">
        Have a problem worth working through?
      </h2>
      <ul className="contact-links">
        {contactLinks.map((c) => (
          <li key={c.label}>
            <a
              href={c.href}
              {...(c.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
            >
              <Icon name={c.icon} className="contact-icon" />
              <span>{c.label}</span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
