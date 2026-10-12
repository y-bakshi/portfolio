export type Project = {
  id: string;
  /** One of the four strongest projects, shown first and in full on the projects screen. */
  featured?: boolean;
  name: string;
  line: string;
  detail: string;
  role: string;
  stack: string[];
  /** Outside links shown on the card. Only add ones that exist and are public. */
  links?: { label: string; href: string }[];
  /** Pipeline stages in order. `depth` indents a stage under the one before it. */
  trace: { label: string; depth: number }[];
};

/** A job or a degree. */
export type Entry = {
  id: string;
  title: string;
  org: string;
  when: string;
  note: string;
  /** Initials shown in the logo slot until there is a logo image. */
  mark: string;
  /** Path of a logo image under public/, for example '/logos/thryv.svg'. */
  logo?: string;
};

export type Answer = { text: string; cites: string[] };
