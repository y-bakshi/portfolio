import { cn } from '@/lib/cn';
import { markedHalo } from '@/lib/marked';
import { education } from '../../content';
import { useGuideContext } from '../../Guide';

/** The degrees, side by side and divided by a rule. */
export function EducationCards() {
  const { marked } = useGuideContext();
  return (
    <section aria-labelledby="education-title" className="mt-10">
      <h2 id="education-title" className="display text-4xl">
        Education
      </h2>
      <ul className="mt-5 grid gap-8 md:grid-cols-2 md:gap-0">
        {education.map((e) => (
          <li
            key={e.id}
            id={e.id}
            tabIndex={-1}
            className={cn(
              'space-y-1 md:px-8 md:first:pl-0 md:last:pr-0 md:not-first:border-l md:not-first:border-ink/40',
              markedHalo,
            )}
            data-marked={marked === e.id || undefined}
          >
            <h3 className="text-lg font-semibold">{e.title}</h3>
            <p>{e.org}</p>
            <p className="text-muted">{e.when}</p>
            <ul className="list-disc space-y-1 pl-5 pt-1 text-[0.95rem] marker:text-ink">
              {(e.points ?? []).map((pt) => (
                <li key={pt}>{pt}</li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </section>
  );
}
