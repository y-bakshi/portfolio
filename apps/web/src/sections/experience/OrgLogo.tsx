import type { Entry } from '../../content';

/** An organisation's logo when there is one, otherwise its initials in a small badge. */
export function OrgLogo({ entry }: { entry: Pick<Entry, 'org' | 'mark' | 'logo'> }) {
  return entry.logo ? (
    <img
      src={entry.logo}
      alt=""
      width={148}
      height={64}
      loading="lazy"
      className="h-7 w-auto max-w-20 object-contain"
    />
  ) : (
    <span
      aria-hidden="true"
      className="grid size-7 place-items-center rounded-md bg-ink text-xs font-bold text-panel"
    >
      {entry.mark}
    </span>
  );
}
