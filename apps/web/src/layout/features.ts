/** Switches for parts of the page that are built but turned off. Set one to true to bring it back. */
export const features = {
  /** The page-wide grid of dots that move away from the pointer (src/DotGrid.tsx). */
  dotGrid: false,
  /** The strip of technology logos under the first screen, and the line about recent experience below it. */
  techStrip: false,
  /** The four featured projects on the home page. The projects page has all of them. */
  selectedWork: false,
} as const;
