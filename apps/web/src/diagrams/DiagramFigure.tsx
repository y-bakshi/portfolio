import { useEffect, useRef, useState } from 'react';
import type { Diagram } from '../content/diagrams';
import { useInView } from '@/lib/useInView';
import { SceneSvg } from './SceneSvg';
import { buildScene } from './scene/buildScene';
import { useSceneMotion } from './scene/useSceneMotion';
import { viewOf } from './scene/view';
import { useStationHighlight } from './useStationHighlight';

/**
 * A project's figure: the machine drawn in isometric, and under it the steps it stands for. Pointing
 * at a machine or at a step lifts the machine and lights the step. The drawing has thousands of
 * paths, so it is only built once the figure is near the screen; until then (and in the page's
 * static HTML) a box of the same size holds its place and says what the figure shows.
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
  const root = useRef<HTMLElement>(null);
  const frame = useRef<HTMLDivElement>(null);
  const svg = useRef<SVGSVGElement>(null);
  const inView = useInView(frame);
  const [built, setBuilt] = useState(false);
  useEffect(() => {
    if (inView) setBuilt(true);
  }, [inView]);
  const scene = built ? buildScene(diagram) : null;
  useSceneMotion(svg, scene, inView);
  const highlight = useStationHighlight(root);
  const label = `${name}: ${diagram.summary}`;
  const { view } = viewOf(diagram);

  return (
    <figure ref={root} className="iso space-y-4" onPointerLeave={() => highlight(null)}>
      <div
        ref={frame}
        className="relative overflow-hidden rounded-xl border border-line/60 bg-panel p-2"
        onPointerOver={(e) => {
          const station = (e.target as Element).closest<SVGElement>('[data-station]');
          highlight(station?.dataset.station ?? null);
        }}
      >
        {scene ? (
          <SceneSvg scene={scene} label={label} svgRef={svg} />
        ) : (
          <div
            role="img"
            aria-label={label}
            style={{ aspectRatio: `${view.width} / ${view.height}` }}
            className="w-full"
          />
        )}
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
