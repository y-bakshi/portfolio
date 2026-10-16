import type { ReactNode } from 'react';

/** One titled part of a case study. */
export function CaseSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-3 border-t border-line/70 py-8 first:border-t-0 first:pt-0">
      <h2 className="display text-3xl">{title}</h2>
      {children}
    </section>
  );
}
