const sources = import.meta.glob(['./**/*.{ts,tsx}', '!./**/*.test.{ts,tsx}', '!./test/**'], {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

/** Small files are easier to read and to change. Split a file before it passes this. */
const MAX_LINES = 220;

describe('source files', () => {
  it(`stay under ${MAX_LINES} lines`, () => {
    const big = Object.entries(sources)
      .map(([file, text]) => [file, text.split('\n').length] as const)
      .filter(([, lines]) => lines > MAX_LINES);
    expect(big).toEqual([]);
  });
});
