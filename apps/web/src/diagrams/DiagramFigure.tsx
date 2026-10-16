import { useRef } from 'react';
import type { Diagram } from '../content/diagrams';
import { buildScene } from './scene/buildScene';
import { useSceneMotion } from './scene/useSceneMotion';
import { useStationHighlight } from './useStationHighlight';

/**
 * A project's figure: the machine drawn in isometric, and under it the steps it stands for. Pointing
 * at a machine or at a step lifts the machine and lights the step.
 */
export function DiagramFigure({
  diagram,
  name,
  compact = false,
}: {
  diagram: Diagram;
  name: string;
  /** Leave out the list of steps, for a figure shown small on a card. */
  compact?: boolean;
}) {
  const scene = buildScene(diagram);
  const root = useRef<HTMLElement>(null);
  const svg = useRef<SVGSVGElement>(null);
  const wrapper = useSceneMotion(svg, scene);
  const highlight = useStationHighlight(root);

  return (
    <figure ref={root} className="iso space-y-4" onPointerLeave={() => highlight(null)}>
      <div
        ref={wrapper}
        className="relative overflow-hidden rounded-xl border border-line/60 bg-panel p-2"
        onPointerOver={(e) => {
          const station = (e.target as Element).closest<SVGElement>('[data-station]');
          highlight(station?.dataset.station ?? null);
        }}
      >
        <svg
          ref={svg}
          className="iso-svg"
          viewBox={`0 0 ${scene.view.width} ${scene.view.height}`}
          role="img"
          aria-label={`${name}: ${diagram.summary}`}
          focusable="false"
        >
          {scene.items.map((item) => (
            <g key={item.key}>{item.node}</g>
          ))}
        </svg>
      </div>
      {!compact && (
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
