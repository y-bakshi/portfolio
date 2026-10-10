import {
  answerFor,
  education,
  projects,
  roles,
  smallProjects,
  stackGroups,
  suggestions,
} from './content';

const ids = [...projects, ...roles, ...education].map((x) => x.id);

describe('content data', () => {
  it('gives every project, role and education entry a unique id', () => {
    expect(new Set(ids).size).toBe(ids.length);
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

  it('keeps the smaller projects and skill groups filled in', () => {
    expect(smallProjects.length).toBeGreaterThan(0);
    smallProjects.forEach((p) => expect(p.line.length, p.name).toBeGreaterThan(30));
    expect(stackGroups.length).toBeGreaterThan(0);
    stackGroups.forEach((g) => expect(g.items.length, g.group).toBeGreaterThan(10));
  });
});

describe('the guide answers', () => {
  const cases: [string, string[]][] = [
    ['What has Yash built with RAG?', ['testpilot']],
    ['Show me his backend experience', ['thryv', 'testpilot']],
    ['Has he worked with agents?', ['guardianai']],
    ['What cloud work has he done?', ['citywatch', 'face-recognition', 'testpilot']],
    ['Has he built a compiler?', ['catscript']],
    ['Any streaming or kafka work?', ['streaming-pipeline']],
    ['What edge computing has he done?', ['edge-inference']],
    ['Has he used Rust?', ['procwatch']],
    ['Any gemini story work?', ['story-generator']],
    ['Tell me about his education', ['asu', 'manipal']],
    ['What skills and tools does he use?', ['tools']],
    ['What is his career history?', ['thryv', 'insight']],
    ['How can I contact him?', ['contact']],
  ];

  it.each(cases)('answers "%s" and cites its sources', (question, expected) => {
    const answer = answerFor(question);
    expect(answer.text.length).toBeGreaterThan(30);
    for (const id of expected) expect(answer.cites, question).toContain(id);
  });

  it('answers every suggested question with at least one source', () => {
    for (const q of suggestions) {
      const a = answerFor(q);
      expect(a.cites.length, q).toBeGreaterThan(0);
    }
  });

  it('only cites things that exist on the page', () => {
    const allowed = new Set([...ids, 'tools', 'contact']);
    for (const [q] of cases)
      for (const id of answerFor(q).cites) expect(allowed.has(id), `${q} cites ${id}`).toBe(true);
  });

  it('says plainly when the notes do not cover a question', () => {
    const a = answerFor('What is his favourite colour?');
    expect(a.cites).toEqual([]);
    expect(a.text).toMatch(/not in the notes/i);
  });

  it('does not treat a short keyword inside another word as a match', () => {
    // "ci" is a backend keyword, but it sits inside "specific" and "decision"
    expect(answerFor('Tell me something specific about his decision making').cites).toEqual([]);
  });

  it('never claims the contact links are placeholders', () => {
    expect(answerFor('How can I contact him?').text).not.toMatch(/placeholder/i);
  });
});
