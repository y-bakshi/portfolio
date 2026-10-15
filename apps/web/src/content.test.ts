import {
  education,
  projects,
  roles,
  smallProjects,
  suggestions,
  unavailableAnswer,
} from './content';

// only the file names matter here, so the files are listed and never loaded
const logoFiles = Object.keys(import.meta.glob('../public/logos/*'));

const ids = [...projects, ...roles, ...education].map((x) => x.id);

describe('content data', () => {
  it('gives every project, role and education entry a unique id', () => {
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('points every logo at a file that exists', () => {
    const withLogo = [...roles, ...education].filter((e) => e.logo);
    expect(withLogo.length).toBeGreaterThan(0);
    for (const e of withLogo) expect(logoFiles, e.id).toContain(`../public${e.logo}`);
  });

  it('describes every project completely', () => {
    for (const p of projects) {
      expect(p.name, p.id).toBeTruthy();
      expect(p.line, p.id).toBeTruthy();
      expect(p.detail.length, p.id).toBeGreaterThan(40);
      expect(p.role, p.id).toBeTruthy();
      expect(p.stack.length, p.id).toBeGreaterThan(0);
      expect(p.trace.length, p.id).toBeGreaterThanOrEqual(3);
    }
  });

  it('indents each trace step at most one level deeper than the step before it', () => {
    for (const p of projects) {
      expect(p.trace[0].depth, p.id).toBe(0);
      p.trace.forEach((step, i) => {
        if (i > 0)
          expect(step.depth - p.trace[i - 1].depth, `${p.id}: ${step.label}`).toBeLessThanOrEqual(
            1,
          );
      });
    }
  });

  it('has dates for every role and degree', () => {
    for (const r of [...roles, ...education]) {
      expect(r.when, r.id).toMatch(/\d{4}/);
      expect(r.title, r.id).toBeTruthy();
      expect(r.note.length, r.id).toBeGreaterThan(30);
    }
  });

  it('keeps the smaller projects filled in', () => {
    expect(smallProjects.length).toBeGreaterThan(0);
    smallProjects.forEach((p) => expect(p.line.length, p.name).toBeGreaterThan(30));
  });
});

describe('the guide when it cannot answer', () => {
  it('says so plainly and points at the contact block', () => {
    expect(unavailableAnswer.text).toMatch(/cannot answer just now/i);
    expect(unavailableAnswer.cites).toEqual(['contact']);
  });

  it('keeps some suggested questions to start from', () => {
    expect(suggestions.length).toBeGreaterThan(0);
  });
});
