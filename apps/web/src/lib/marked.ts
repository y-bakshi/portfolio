/**
 * The highlight on a row the guide points to: a soft tinted halo that reaches a little past the row
 * on every side and fades in, drawn behind the content so it never moves the layout. Put it on an
 * element with a `data-marked` attribute.
 */
export const markedHalo = [
  'relative isolate',
  'before:pointer-events-none before:absolute before:-inset-x-4 before:-inset-y-3 before:-z-10 before:rounded-2xl',
  'before:bg-mark/20 before:opacity-0 before:ring-1 before:ring-mark/70 before:transition-opacity before:duration-300',
  'data-marked:before:opacity-100',
].join(' ');
