import { smallProjects } from '../../content';

/** Shorter write-ups for coursework and experiments. */
export function SmallProjects() {
  return (
    <section aria-labelledby="small-title" className="mt-4 border-t border-line/70 pt-10">
      <h2 id="small-title" className="display text-4xl">
        Smaller projects
      </h2>
      <ul className="mt-6 grid gap-4 md:grid-cols-2">
        {smallProjects.map((sp) => (
          <li key={sp.name} className="rounded-xl border border-line/70 bg-panel p-5 shadow-soft">
            <h3 className="font-semibold">{sp.name}</h3>
            <p className="mt-1 text-[0.95rem] text-muted">{sp.line}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
