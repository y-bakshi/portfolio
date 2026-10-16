import { useRef } from 'react';
import type { Diagram } from '../content/diagrams';
import { FlowChart } from './flow/FlowChart';
import { useStationHighlight } from './useStationHighlight';

/**
 * A project's figure: its flow chart, and under it the same steps as a list. Pointing at a box or a
 * step lights both. Each step has a number on its box that matches the list.
 */
export function DiagramFigure({
  diagram,
  name,
  compact = false,
  bare = false,
}: {
  diagram: Diagram;
  name: string;
  /** Leave out the list of steps, for a figure shown small on a card. */
  compact?: boolean;
  /** Only the chart: no key and no list of steps, for a figure that sits beside the project's own text. */
  bare?: boolean;
}) {
  const root = useRef<HTMLElement>(null);
  const highlight = useStationHighlight(root);

  return (
    <figure ref={root} className="space-y-3" onPointerLeave={() => highlight(null)}>
      <FlowChart
        diagram={diagram}
        label={`${name}: ${diagram.summary}`}
        compact={compact}
        numbered={!bare}
        onPoint={highlight}
      />
      {!compact && !bare && (
        <ol
          className="grid gap-x-6 gap-y-2 text-[0.92rem] sm:grid-cols-2"
          aria-label={`${name} steps`}
        >
          {diagram.stations.map((s, i) => (
            <li
              key={s.id}
              data-step={s.id}
              tabIndex={0}
              onPointerEnter={() => highlight(s.id)}
              onFocus={() => highlight(s.id)}
              onBlur={() => highlight(null)}
              className="flex gap-3 rounded-lg px-2 py-1.5 transition-colors data-active:bg-mark/20"
            >
              <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-ink text-xs font-semibold text-panel">
                {i + 1}
              </span>
              <span>
                <span className="block font-semibold text-ink">{s.label}</span>
                <span className="block text-muted">{s.sub}</span>
              </span>
            </li>
          ))}
        </ol>
      )}
    </figure>
  );
}
