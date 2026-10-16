import { useRef } from 'react';
import { cn } from '@/lib/cn';
import type { Status } from '../shared';
import { sample } from './engine';
import { moods, type Mood } from './moods';
import { useAvatarMotion } from './useAvatarMotion';

const SIZE = 100;
const moodOf: Record<Status, Mood> = {
  ready: 'idle',
  thinking: 'thinking',
  answering: 'answering',
};

/**
 * The guide's face. It falls asleep (with floating z's) when left alone for a while, and otherwise idles, looks up and darts its eyes about while it thinks, opens and shuts its
 * mouth while it answers, and widens its eyes while someone is typing (`listening`). Decorative: the status is written out beside it.
 */
export function GuideAvatar({
  status,
  listening = false,
  asleep = false,
  poke,
  className,
}: {
  status: Status;
  listening?: boolean;
  /** Nobody has done anything for a while: the face goes to sleep (only while it has nothing else to do). */
  asleep?: boolean;
  /** How it is answering being poked, for a moment, or none. This wins over everything but a busy status. */
  poke?: Mood | null;
  className?: string;
}) {
  const root = useRef<SVGSVGElement>(null);
  const mood: Mood =
    poke && status === 'ready'
      ? poke
      : status === 'ready' && asleep
        ? 'sleeping'
        : status === 'ready' && listening
          ? 'listening'
          : moodOf[status];
  useAvatarMotion(root, mood, SIZE);
  // the first picture is drawn at rest, so the page renders the same on the server and the client
  const first = sample(moods.idle, 0, SIZE);
  return (
    <svg
      ref={root}
      viewBox={`${-SIZE / 2} ${-SIZE / 2} ${SIZE} ${SIZE}`}
      aria-hidden="true"
      focusable="false"
      data-mood={mood}
      className={cn('size-9 shrink-0 overflow-visible', className)}
    >
      <path data-body="" d={first.body} fill="var(--ink)" />
      {first.eyes.map((e, i) => (
        <ellipse key={i} data-eye="" cx={e.cx} cy={e.cy} rx={e.rx} ry={e.ry} fill="var(--panel)" />
      ))}
      {mood === 'burst' && (
        <g aria-hidden="true">
          {Array.from({ length: 12 }, (_, i) => {
            const angle = (i / 12) * Math.PI * 2 + 0.3;
            const reach = 58 + (i % 3) * 7;
            return (
              <circle
                key={i}
                data-spark=""
                cx={Math.cos(angle) * 38}
                cy={Math.sin(angle) * 38}
                r={i % 2 ? 2.6 : 3.4}
                fill={i % 2 ? 'var(--mark)' : 'var(--action)'}
                className="spark"
                style={
                  {
                    '--dx': `${Math.round(Math.cos(angle) * (reach - 38))}px`,
                    '--dy': `${Math.round(Math.sin(angle) * (reach - 38))}px`,
                  } as React.CSSProperties
                }
              />
            );
          })}
        </g>
      )}
      {mood === 'sleeping' && (
        <g aria-hidden="true" fill="var(--ink)" fontWeight={700} fontFamily="var(--text)">
          {[
            { x: 22, y: -24, size: 30, delay: '0s' },
            { x: 34, y: -42, size: 23, delay: '0.95s' },
            { x: 44, y: -58, size: 17, delay: '1.9s' },
          ].map((z) => (
            <text
              key={z.delay}
              data-zzz=""
              x={z.x}
              y={z.y}
              fontSize={z.size}
              className="zzz"
              style={{ animationDelay: z.delay }}
            >
              z
            </text>
          ))}
        </g>
      )}
      <ellipse
        data-mouth=""
        cx={first.mouth.cx}
        cy={first.mouth.cy}
        rx={first.mouth.rx}
        ry={first.mouth.ry}
        fill="var(--panel)"
      />
    </svg>
  );
}
