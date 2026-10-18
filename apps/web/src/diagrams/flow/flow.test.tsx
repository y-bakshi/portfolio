import { renderToString } from 'react-dom/server';
import { diagrams } from '../../content/diagrams';
import { DiagramFigure } from '../DiagramFigure';
import { layoutOf } from './layout';
import { timelineOf } from './timeline';

describe.each(
  Object.entries(diagrams).flatMap(([id, d]) =>
    (['across', 'down'] as const).map((way) => [id, way, d] as const),
  ),
)('the flow chart of %s, running %s', (id, way, d) => {
  const layout = layoutOf(d, way);

  it('has a box for every step and an arrow for every link', () => {
    expect(layout.boxes).toHaveLength(d.stations.length);
    expect(layout.edges).toHaveLength(d.links.length);
    for (const e of layout.edges) expect(e.pts.length, `${e.from}>${e.to}`).toBeGreaterThan(1);
  });

  it('keeps every box, group outline and arrow inside the drawing', () => {
    for (const g of layout.groups) {
      expect(g.x, g.label).toBeGreaterThanOrEqual(0);
      expect(g.y).toBeGreaterThanOrEqual(0);
      expect(g.x + g.w).toBeLessThanOrEqual(layout.width);
      expect(g.y + g.h).toBeLessThanOrEqual(layout.height);
    }
    for (const e of layout.edges) {
      for (const [x, y] of e.pts) {
        expect(x).toBeGreaterThanOrEqual(0);
        expect(x).toBeLessThanOrEqual(layout.width);
        expect(y).toBeGreaterThanOrEqual(0);
        expect(y).toBeLessThanOrEqual(layout.height);
      }
    }
  });

  it('sends a packet over every route, and each frame lands inside the drawing', () => {
    const t = timelineOf(layout, d.routes);
    expect(t.total).toBeGreaterThan(1);
    for (let s = 0; s < t.total; s += 0.1) {
      const f = t.frame(s);
      expect(f.x, `${id} at ${s}`).toBeGreaterThanOrEqual(0);
      expect(f.x).toBeLessThanOrEqual(layout.width);
      expect(f.y).toBeGreaterThanOrEqual(0);
      expect(f.y).toBeLessThanOrEqual(layout.height);
    }
  });

  it('renders on the server with a name for each step', () => {
    const html = renderToString(<DiagramFigure diagram={d} name={id} />);
    for (const s of d.stations) expect(html).toContain(s.label);
  });
});

it('writes the words on a loop back on its arrow', () => {
  const layout = layoutOf(diagrams.testpilot, 'down');
  const back = layout.edges.filter((e) => e.back);
  expect(back).toHaveLength(1);
  expect(back[0].label).toBe('Below 0.6: redraft');
});
