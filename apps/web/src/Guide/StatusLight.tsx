import type { Status } from './shared';

/** The red, yellow and green light; the words beside it say the same thing. */
export function StatusLight({ status }: { status: Status }) {
  return (
    <span className={`light light-${status}`} aria-hidden="true">
      <i />
      <i />
      <i />
    </span>
  );
}
