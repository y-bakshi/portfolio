import { cn } from '@/lib/cn';
import { roles, type Entry } from '../../content';
import { useGuideContext } from '../../Guide';
import { OrgLogo } from './OrgLogo';

/** One job: its dates, its title and organisation, and what was done. */
function TimelineItem({ r, marked }: { r: Entry; marked: boolean }) {
  return (
    <li
      id={r.id}
      tabIndex={-1}
      className={cn(
        'relative grid gap-3 border-t border-line/70 py-8 md:grid-cols-[9rem_1fr_1.3fr] md:gap-8',
        'data-marked:rounded-xl data-marked:bg-mark/15 data-marked:ring-2 data-marked:ring-mark',
      )}
      data-marked={marked || undefined}
    >
      <p className="text-[0.95rem] font-medium text-muted md:pt-1">{r.when}</p>
      <div className="space-y-2">
        <h3 className="display text-3xl">{r.title}</h3>
        <p className="flex items-center gap-2.5 text-lg">
          <OrgLogo entry={r} />
          {r.org}
        </p>
      </div>
      <ul className="list-disc space-y-1.5 pl-5 text-[0.98rem] marker:text-action">
        {r.points.map((pt) => (
          <li key={pt}>{pt}</li>
        ))}
      </ul>
    </li>
  );
}

/** Work history, newest first. */
export function Timeline() {
  const { marked } = useGuideContext();
  return (
    <ol aria-label="Work history" className="border-b border-line/70">
      {roles.map((r) => (
        <TimelineItem key={r.id} r={r} marked={marked === r.id} />
      ))}
    </ol>
  );
}
