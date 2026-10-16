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
 * The guide's face. It idles, looks up while it thinks, pulses while it answers, and widens its eyes
 * while someone is typing (`listening`). Decorative: the status is written out beside it.
 */
export function GuideAvatar({
  status,
  listening = false,
  className,
}: {
  status: Status;
  listening?: boolean;
  className?: string;
}) {
  const root = useRef<SVGSVGElement>(null);
  const mood: Mood = status === 'ready' && listening ? 'listening' : moodOf[status];
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
    </svg>
  );
}
