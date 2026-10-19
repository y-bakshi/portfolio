import { cn } from '@/lib/cn';
import { markedHalo } from '@/lib/marked';
import { ProjectDiagram } from '../diagrams/ProjectDiagram';
import type { Project } from '../content';
import { ProjectActions } from './ProjectActions';
import { StackInline } from './StackInline';

/**
 * A project as a compact row: its name, what it is and what Yash did, its technologies and its links on
 * the left, and its flow chart on the right. The longer write-up folds away under "About this project".
 */
export function ProjectRow({ p, marked }: { p: Project; marked: string | null }) {
  return (
    <article
      id={p.id}
      tabIndex={-1}
      aria-labelledby={`${p.id}-name`}
      className={cn(
        'grid gap-6 border-t border-ink/40 py-8 md:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)] md:items-center md:gap-10',
        markedHalo,
      )}
      data-marked={marked === p.id || undefined}
    >
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <h2 id={`${p.id}-name`} className="display text-4xl">
            {p.name}
          </h2>
          {p.award && (
            <span role="img" aria-label={p.award} title={p.award} className="text-3xl leading-none">
              🏆
            </span>
          )}
        </div>
        <div className="space-y-0.5 text-[1.02rem] text-ink">
          <p>{p.line}</p>
          <p>{p.role}</p>
        </div>
        <StackInline name={p.name} stack={p.stack} />
        <details className="group text-[0.95rem] text-muted">
          <summary className="w-fit cursor-pointer font-medium text-ink underline decoration-ink/30 underline-offset-4 hover:decoration-ink">
            About this project
          </summary>
          <p className="mt-2 max-w-[34rem]">{p.detail}</p>
        </details>
        <ProjectActions p={p} />
      </div>
      <ProjectDiagram id={p.id} bare />
    </article>
  );
}
