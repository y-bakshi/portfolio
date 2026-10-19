/** The filter tabs on the projects page. */
export type Category = 'backend' | 'cloud' | 'ai' | 'systems';

export type Project = {
  id: string;
  categories: Category[];
  /** One of the four strongest projects, shown first and in full on the projects screen. */
  featured?: boolean;
  name: string;
  /** A prize this project won, shown as a trophy beside its name. */
  award?: string;
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
  /** The note broken into the separate things done, for the experience timeline. */
  points?: string[];
  /** A short paragraph on what was done, for a job on the experience timeline. */
  summary?: string;
  /** Short topics, for the home page's recent experience strip. */
  tags?: string[];
};

export type Answer = { text: string; cites: string[] };
