import { smallProjects } from '../../content';

/** Shorter write-ups for coursework and experiments, as a row of short columns under the projects. */
export function SmallProjects() {
  return (
    <section
      aria-labelledby="small-title"
      className="mt-2 grid gap-6 border-t border-ink/40 pt-8 md:grid-cols-[12rem_1fr] md:gap-8"
    >
      <h2 id="small-title" className="display text-4xl">
        More projects
      </h2>
      <ul className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 lg:gap-0">
        {smallProjects.map((sp) => (
          <li key={sp.name} className="lg:border-l lg:border-ink/40 lg:px-5 lg:first:border-l-0">
            <h3 className="font-semibold text-ink">{sp.name}</h3>
            <p className="mt-1 text-[0.9rem] text-muted">{sp.line}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
