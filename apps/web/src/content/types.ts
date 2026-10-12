export type Project = {
  id: string;
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

export type Answer = { text: string; cites: string[] };
