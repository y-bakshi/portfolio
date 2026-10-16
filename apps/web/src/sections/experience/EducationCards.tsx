import { cn } from '@/lib/cn';
import { education } from '../../content';
import { useGuideContext } from '../../Guide';
import { OrgLogo } from './OrgLogo';

/** The two degrees, side by side. */
export function EducationCards() {
  const { marked } = useGuideContext();
  return (
    <section aria-labelledby="education-title" className="mt-12">
      <h2 id="education-title" className="display text-4xl">
        Education
      </h2>
      <ul className="mt-6 grid gap-5 md:grid-cols-2">
        {education.map((e) => (
          <li
            key={e.id}
            id={e.id}
            tabIndex={-1}
            className={cn(
              'space-y-3 rounded-2xl border border-line/70 bg-panel p-6 shadow-soft',
              'data-marked:ring-2 data-marked:ring-mark',
            )}
            data-marked={marked === e.id || undefined}
          >
            <OrgLogo entry={e} />
            <h3 className="text-xl font-semibold">{e.title}</h3>
            <p>{e.org}</p>
            <p className="font-mono text-sm text-muted">{e.when}</p>
            <ul className="list-disc space-y-1 pl-5 text-[0.95rem] marker:text-action">
              {e.points.map((pt) => (
                <li key={pt}>{pt}</li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </section>
  );
}
