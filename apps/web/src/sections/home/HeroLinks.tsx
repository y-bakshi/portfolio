import { HugeiconsIcon } from '@hugeicons/react';
import { GithubIcon, Linkedin01Icon, Mail01Icon } from '@hugeicons/core-free-icons';
import { CONTACT_LINKS } from '../../../worker/rag/facts';
import { ResumeButton } from '../experience/ResumeButton';

const links = [
  { label: 'LinkedIn', href: CONTACT_LINKS.linkedin, icon: Linkedin01Icon },
  { label: 'GitHub', href: CONTACT_LINKS.github, icon: GithubIcon },
  { label: 'Email', href: `mailto:${CONTACT_LINKS.emailPersonal}`, icon: Mail01Icon },
];

/** The résumé button (once there is a résumé) and the three places to find Yash. */
export function HeroLinks() {
  return (
    <div className="mt-6 flex flex-wrap items-center gap-5">
      <ResumeButton label="Resume" />
      <ul className="flex items-center gap-4">
        {links.map((l) => (
          <li key={l.label}>
            <a
              href={l.href}
              aria-label={l.label}
              className="grid size-10 place-items-center rounded-lg text-muted transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-ring"
              {...(l.href.startsWith('http')
                ? { target: '_blank', rel: 'noopener noreferrer' }
                : {})}
            >
              <HugeiconsIcon aria-hidden icon={l.icon} size={24} />
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
