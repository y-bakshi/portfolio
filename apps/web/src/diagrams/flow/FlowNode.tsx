import { HugeiconsIcon } from '@hugeicons/react';
import type { DiagramStation } from '../../content/diagrams';
import { cn } from '@/lib/cn';
import { kindIcon } from './icons';
import { captionOf } from './tones';

/**
 * One step of a chart, drawn as a flat box with a navy outline and a hard offset shadow, an icon, its
 * name in bold and the kind of step in small type. Where a chart starts, the step has no box, only its
 * icon and name.
 */
export function FlowNode({
  station,
  index,
  box,
  compact,
  scale,
  numbered,
  onPoint,
}: {
  station: DiagramStation;
  index: number;
  /** Position and size as percentages of the chart. */
  box: { left: number; top: number; width: number; height: number };
  compact: boolean;
  /** How much the chart is shrunk to fit, so the type shrinks with the boxes. */
  scale: number;
  /** Show the step's number on its corner, to match a list of steps beside the chart. */
  numbered: boolean;
  onPoint: (id: string | null) => void;
}) {
  const start = station.kind === 'hopper';
  return (
    <div
      data-station={station.id}
      data-kind={station.kind}
      onPointerEnter={() => onPoint(station.id)}
      onPointerLeave={() => onPoint(null)}
      style={{
        left: `${box.left}%`,
        top: `${box.top}%`,
        width: `${box.width}%`,
        height: `${box.height}%`,
        fontSize: (compact ? 11 : 12) * scale,
        boxShadow: start ? undefined : `${3.5 * scale}px ${3.5 * scale}px 0 var(--color-ink)`,
      }}
      className={cn(
        'absolute flex flex-col items-center justify-center gap-0.5 px-1 text-center leading-tight text-ink transition-[translate,background-color] duration-200 ease-out',
        start ? 'border-2 border-transparent' : 'rounded-[3px] border-2 border-ink bg-panel',
        'data-active:-translate-x-px data-active:-translate-y-px data-lit:-translate-x-px data-lit:-translate-y-px',
        'data-active:bg-mark/25 data-lit:bg-mark/25',
        start && 'data-active:bg-transparent data-lit:bg-transparent',
      )}
    >
      {numbered && (
        <span
          aria-hidden
          className="absolute -top-2.5 -left-2.5 grid size-5 place-items-center rounded-full bg-ink text-[0.65rem] font-semibold text-panel"
        >
          {index + 1}
        </span>
      )}
      {!compact && (
        <HugeiconsIcon
          aria-hidden
          icon={kindIcon[station.kind]}
          size={26 * scale}
          strokeWidth={1.5}
        />
      )}
      <span className="font-bold">{station.label}</span>
      {!compact && <span className="text-[0.66rem] text-muted">{captionOf[station.kind]}</span>}
    </div>
  );
}
