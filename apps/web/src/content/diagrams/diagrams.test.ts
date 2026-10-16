import { projects } from '..';
import { diagrams } from '.';

describe('the figures', () => {
  it('there is one for every project', () => {
    expect(Object.keys(diagrams).sort()).toEqual(projects.map((p) => p.id).sort());
  });

  describe.each(Object.entries(diagrams))('%s', (_id, d) => {
    const ids = d.stations.map((s) => s.id);

    it('has stations with unique ids and cells, and a summary', () => {
      expect(new Set(ids).size).toBe(ids.length);
      const cells = d.stations.map((s) => `${s.col},${s.row}`);
      expect(new Set(cells).size).toBe(cells.length);
      expect(d.summary.length).toBeGreaterThan(40);
      for (const s of d.stations) {
        expect(s.label, s.id).not.toBe('');
        expect(s.sub, s.id).not.toBe('');
      }
    });

    it('joins stations that exist, and each route follows the belts', () => {
      for (const l of d.links) {
        expect(ids, l.from).toContain(l.from);
        expect(ids, l.to).toContain(l.to);
      }
      for (const route of d.routes) {
        for (let i = 0; i < route.length - 1; i++) {
          const belt = d.links.some((l) => l.from === route[i] && l.to === route[i + 1]);
          expect(belt, `${route[i]} to ${route[i + 1]}`).toBe(true);
        }
      }
    });

    it('uses every station on some route', () => {
      const visited = new Set(d.routes.flat());
      for (const id of ids) expect(visited, id).toContain(id);
    });
  });
});
