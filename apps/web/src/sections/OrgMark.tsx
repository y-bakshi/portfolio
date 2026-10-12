import type { Entry } from '../content';

/** The logo slot under a date: the logo when there is one, otherwise the organisation's initials. */
export function OrgMark({ org, mark, logo }: Pick<Entry, 'org' | 'mark' | 'logo'>) {
  return logo ? (
    <img className="org-mark" src={logo} alt="" width={112} height={64} title={org} />
  ) : (
    <span className="org-mark" aria-hidden="true">
      {mark}
    </span>
  );
}
