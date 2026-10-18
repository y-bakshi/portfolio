// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { buildChunks } from './chunks';
import { NOT_IN_NOTES_RE } from './gap';
import { buildMessages, SYSTEM_PROMPT } from './prompt';

describe('the rules sent to the model', () => {
  it('asks for the supported part only, and names the missing part, without guessing', () => {
    expect(SYSTEM_PROMPT).toMatch(/only part of the question, answer that part/);
    expect(SYSTEM_PROMPT).toMatch(/which part is not in the notes/);
    expect(SYSTEM_PROMPT).toMatch(/Never guess/);
    expect(SYSTEM_PROMPT).toMatch(/general knowledge/);
    expect(SYSTEM_PROMPT).toMatch(/never invent a number, date or name/);
  });

  it('keeps the phrase the stats, the answer check and the eval look for', () => {
    expect(NOT_IN_NOTES_RE.test(SYSTEM_PROMPT)).toBe(true);
    expect(SYSTEM_PROMPT).toContain('"That is not in my notes."');
  });

  it('leaves the pointer to Yash to the site, so the model does not make up contact details', () => {
    expect(SYSTEM_PROMPT).toMatch(/the site adds that itself/);
  });

  it('puts the rules first and the notes and question last, as data', () => {
    const m = buildMessages('What is his pay?', buildChunks().slice(0, 2), []);
    expect(m[0]).toMatchObject({ role: 'system', content: SYSTEM_PROMPT });
    expect(m.at(-1)!.content).toMatch(
      /^Notes:\n<note id=.*<question>\nWhat is his pay\?\n<\/question>$/s,
    );
  });
});
