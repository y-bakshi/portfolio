/** The kinds of step in a flow chart. Each has its own icon. */
export type StationKind =
  | 'hopper' // where things enter: a repository, a feed, a prompt
  | 'press' // something is made or transformed
  | 'cabinet' // something is looked up or stored
  | 'gate' // something is checked, and may be sent back
  | 'scanner' // something is read or analysed
  | 'pusher' // something is routed to one lane or another
  | 'queue' // things wait their turn
  | 'display' // something is shown to a person
  | 'tray'; // where things end up

/** One step of a project's pipeline, placed on a grid (a column along the line, a row across it). */
export type DiagramStation = {
  id: string;
  kind: StationKind;
  label: string;
  sub: string;
  col: number;
  row: number;
};

/** A belt from one station to another. A belt that runs back against the line is drawn as a return lane. */
export type DiagramLink = {
  from: string;
  to: string;
  /** A few words written on the arrow, for a loop back. */
  label?: string;
};

/** A boundary drawn round some steps, such as the cloud or a device. Only where the project notes name one. */
export type DiagramGroup = { label: string; members: string[] };

/** A project's figure: its steps, the belts between them, and the routes a packet takes through them. */
export type Diagram = {
  /** What the figure shows, for people who cannot see it. */
  summary: string;
  stations: DiagramStation[];
  links: DiagramLink[];
  groups?: DiagramGroup[];
  /** Station ids in the order a packet visits them. Several routes are taken in turn. */
  routes: string[][];
};
