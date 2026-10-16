import { HugeiconsIcon } from '@hugeicons/react';
import { ArrowRight02Icon, ArrowUpRight01Icon } from '@hugeicons/core-free-icons';
import { Button } from '@/components/ui/button';
import type { Project } from '../content';

/** The links a project has: the case study for TestPilot, otherwise its public source, demo or deck. */
export function ProjectActions({ p }: { p: Project }) {
  if (p.id === 'testpilot') {
    return (
      <div className="flex flex-wrap gap-2.5">
        <Button asChild>
          <a href="/projects/testpilot/">
            Read case study
            <HugeiconsIcon icon={ArrowRight02Icon} size={18} />
          </a>
        </Button>
      </div>
    );
  }
  if (!p.links) return null;
  return (
    <ul aria-label={`${p.name} links`} className="flex flex-wrap gap-2.5">
      {p.links.map((l, i) => (
        <li key={l.href}>
          <Button asChild variant={i === 0 ? 'default' : 'outline'}>
            <a
              href={l.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${l.label}, ${p.name} (opens in a new tab)`}
            >
              {l.label}
              <HugeiconsIcon icon={ArrowUpRight01Icon} size={18} />
            </a>
          </Button>
        </li>
      ))}
    </ul>
  );
}
