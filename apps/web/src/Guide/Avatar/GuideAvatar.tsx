import type { Status } from '../shared';

/** Placeholder until the animated avatar lands: a plain navy dot whose size says what the guide is doing. */
export function GuideAvatar({ status, className }: { status: Status; className?: string }) {
  return (
    <span
      aria-hidden="true"
      data-state={status}
      className={className ?? 'inline-block size-8 rounded-full bg-ink'}
    />
  );
}
