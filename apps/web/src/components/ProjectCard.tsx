import { cn } from '@/lib/cn';
import { ProjectDiagram } from '../diagrams/ProjectDiagram';
import type { Project } from '../content';
import { ProjectActions } from './ProjectActions';
import { StackList } from './StackList';

/** A project as a card: its figure on top, then what it is, what Yash did, and where to go next. */
export function ProjectCard({ p, marked }: { p: Project; marked: string | null }) {
  return (
    <article
      id={p.id}
      tabIndex={-1}
      aria-labelledby={`${p.id}-name`}
      className={cn(
        'flex flex-col gap-5 rounded-2xl border border-line/70 bg-panel p-5 shadow-soft transition-shadow duration-300 hover:shadow-lift md:p-6',
        'data-marked:ring-2 data-marked:ring-mark data-marked:ring-offset-2 data-marked:ring-offset-ground',
      )}
      data-marked={marked === p.id || undefined}
    >
      <ProjectDiagram id={p.id} compact />
      <div className="space-y-2">
        <h3 id={`${p.id}-name`} className="display text-3xl">
          {p.name}
        </h3>
        <p className="text-lg text-ink">{p.line}</p>
        <p className="text-[0.95rem] text-muted">{p.role}</p>
      </div>
      <StackList name={p.name} stack={p.stack} />
      <div className="mt-auto pt-1">
        <ProjectActions p={p} />
      </div>
    </article>
  );
}
