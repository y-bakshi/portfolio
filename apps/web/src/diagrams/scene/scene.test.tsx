// @vitest-environment node
import { renderToStaticMarkup } from 'react-dom/server';
import { diagrams } from '../../content/diagrams';
import { DiagramFigure } from '../DiagramFigure';
import { buildScene } from './buildScene';

describe.each(Object.entries(diagrams))('the %s figure', (id, diagram) => {
  const scene = buildScene(diagram);
  const html = renderToStaticMarkup(<DiagramFigure diagram={diagram} name={id} />);

  it('draws without a window, and with no broken numbers in any path', () => {
    expect(html).toContain('<svg');
    expect(html).not.toMatch(/NaN|undefined|Infinity/);
  });

  it('describes itself for people who cannot see it, and lists every step', () => {
    expect(html).toContain('role="img"');
    expect(html).toContain(diagram.summary.slice(0, 40));
    for (const s of diagram.stations) expect(html).toContain(s.label);
  });

  it('paints back to front', () => {
    const depths = scene.items.map((i) => i.depth);
    expect(depths).toEqual([...depths].sort((a, b) => a - b));
    expect(scene.items[0].key).toBe('bench');
  });

  it('has a slot for the packets of every station and every belt', () => {
    for (const s of diagram.stations) expect(html).toContain(`data-slot="s:${s.id}"`);
    for (const [i] of diagram.links.entries()) expect(html).toContain(`data-slot="b:${i}"`);
  });

  it('keeps every packet on a slot that exists, on the bench, for a whole cycle', () => {
    const { bench } = scene.layout;
    const { period, at } = scene.timeline;
    for (let t = 0; t < period * 2; t += 0.25) {
      const frame = at(t);
      for (const p of frame.packets) {
        expect(p.opacity).toBeGreaterThanOrEqual(0);
        expect(p.opacity).toBeLessThanOrEqual(1);
        if (p.slot === 'none') continue;
        expect(html, p.slot).toContain(`data-slot="${p.slot}"`);
        expect(p.pos[0]).toBeGreaterThanOrEqual(bench.x);
        expect(p.pos[0]).toBeLessThanOrEqual(bench.x + bench.w);
        expect(p.pos[1]).toBeGreaterThanOrEqual(bench.y);
        expect(p.pos[1]).toBeLessThanOrEqual(bench.y + bench.d);
      }
      for (const s of Object.values(frame.stations)) {
        for (const v of [s.bump, s.ramp, s.late]) {
          expect(v).toBeGreaterThanOrEqual(0);
          expect(v).toBeLessThanOrEqual(1);
        }
      }
    }
  });

  it('shows a packet when it stands still', () => {
    const frame = scene.timeline.at(scene.timeline.still);
    expect(frame.packets.some((p) => p.opacity > 0.5 && p.slot !== 'none')).toBe(true);
  });

  it('sends a packet down every route, so every station gets used', () => {
    const used = new Set<string>();
    const { period, at } = scene.timeline;
    for (let t = 0; t < period * diagram.routes.length * 2; t += 0.2) {
      for (const p of at(t).packets)
        if (p.slot.startsWith('s:') && p.opacity > 0) used.add(p.slot.slice(2));
    }
    for (const s of diagram.stations) expect(used, s.id).toContain(s.id);
  });
});

describe('the TestPilot figure', () => {
  it('runs a return belt back from the gate to the press', () => {
    const scene = buildScene(diagrams.testpilot);
    expect(scene.layout.belts.filter((b) => b.isReturn)).toHaveLength(1);
  });
});
