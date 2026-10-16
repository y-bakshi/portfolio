import { cn } from '@/lib/cn';
import { markedHalo } from '@/lib/marked';
import { roles, type Entry } from '../../content';
import { useGuideContext } from '../../Guide';

/** The dot on the timeline for one job, and the dotted line down to the next one. */
function Rail({ last }: { last: boolean }) {
  return (
    <span aria-hidden="true" className="relative hidden md:block">
      <span className="absolute top-2 left-1/2 size-3 -translate-x-1/2 rounded-full border-2 border-ink bg-ground" />
      {!last && (
        <span className="absolute top-7 -bottom-[4.25rem] left-1/2 -translate-x-1/2 border-l-2 border-dotted border-ink/40" />
      )}
    </span>
  );
}

/** One job: its dates, its title and organisation, and what was done. */
function TimelineItem({ r, marked, last }: { r: Entry; marked: boolean; last: boolean }) {
  return (
    <li
      id={r.id}
      tabIndex={-1}
      className={cn(
        'relative grid gap-3 border-t border-ink/40 py-8 md:grid-cols-[8.5rem_2rem_1fr_1.3fr] md:gap-6',
        markedHalo,
      )}
      data-marked={marked || undefined}
    >
      <p className="text-base text-muted md:pt-1.5">{r.when}</p>
      <Rail last={last} />
      <div className="space-y-2">
        <h3 className="display text-3xl">{r.title}</h3>
        <p className="text-lg">{r.org}</p>
      </div>
      <p className="text-[1rem] leading-relaxed md:border-l md:border-ink/40 md:pl-9">
        {r.summary}
      </p>
    </li>
  );
}

/** Work history, newest first. */
export function Timeline() {
  const { marked } = useGuideContext();
  return (
    <ol aria-label="Work history" className="border-b border-ink/40">
      {roles.map((r, i) => (
        <TimelineItem key={r.id} r={r} marked={marked === r.id} last={i === roles.length - 1} />
      ))}
    </ol>
  );
}
