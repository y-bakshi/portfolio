import { cn } from '@/lib/cn';
import { ProjectDiagram } from '../diagrams/ProjectDiagram';
import type { Project } from '../content';
import { ProjectActions } from './ProjectActions';
import { StackList } from './StackList';

/** A project as a wide row: what it is on the left, its figure on the right. */
export function ProjectRow({ p, marked }: { p: Project; marked: string | null }) {
  return (
    <article
      id={p.id}
      tabIndex={-1}
      aria-labelledby={`${p.id}-name`}
      className={cn(
        'grid gap-6 border-t border-line/70 py-9 md:grid-cols-[1fr_1.15fr] md:items-center md:gap-10',
        'data-marked:rounded-xl data-marked:bg-mark/15 data-marked:ring-2 data-marked:ring-mark',
      )}
      data-marked={marked === p.id || undefined}
    >
      <div className="space-y-4">
        <div>
          <h2 id={`${p.id}-name`} className="display text-4xl">
            {p.name}
          </h2>
          <p className="mt-1.5 text-lg text-ink">{p.line}</p>
        </div>
        <p className="text-muted">{p.detail}</p>
        <p className="text-[0.95rem] font-medium">{p.role}</p>
        <StackList name={p.name} stack={p.stack} />
        <ProjectActions p={p} />
      </div>
      <ProjectDiagram id={p.id} />
    </article>
  );
}
