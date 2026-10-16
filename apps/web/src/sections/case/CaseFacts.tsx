import { HugeiconsIcon } from '@hugeicons/react';
import { ArrowUpRight01Icon } from '@hugeicons/core-free-icons';
import { StackList } from '@/components/StackList';
import { Button } from '@/components/ui/button';
import type { Project } from '../../content';
import { testpilotCase as study } from '../../content/testpilot-case';

/** The sticky side panel: role, team, stack, source and the live demo. */
export function CaseFacts({ project }: { project: Project }) {
  return (
    <aside
      aria-label="Project facts"
      className="space-y-6 self-start rounded-2xl border border-line/70 bg-panel p-6 shadow-soft lg:sticky lg:top-28"
    >
      <h2 className="display text-3xl">Project facts</h2>
      <dl className="space-y-4 text-[0.95rem]">
        <div>
          <dt className="font-semibold">My part</dt>
          <dd className="text-muted">{project.role}</dd>
        </div>
        <div>
          <dt className="font-semibold">Team</dt>
          <dd className="text-muted">{study.team}</dd>
        </div>
        <div>
          <dt className="mb-1.5 font-semibold">Built with</dt>
          <dd>
            <StackList name={project.name} stack={project.stack} />
          </dd>
        </div>
        <div>
          <dt className="font-semibold">Source</dt>
          <dd className="text-muted">{study.source}</dd>
        </div>
      </dl>
      <div className="space-y-2">
        <Button asChild className="w-full">
          <a
            href={study.demo.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Live demo of TestPilot (opens in a new tab)"
          >
            Live demo
            <HugeiconsIcon icon={ArrowUpRight01Icon} size={18} />
          </a>
        </Button>
        <p className="text-sm text-muted">{study.demo.after.replace(/^\.\s*/, '')}</p>
      </div>
    </aside>
  );
}
