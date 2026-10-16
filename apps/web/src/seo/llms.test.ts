import { SITE } from '../../vite.site';
import { education, projects, roles, smallProjects } from '../content';
import { contactList } from './contact';
import { llmsFullTxt, llmsTxt } from './llms';
import { pageMeta } from './pages';

describe('llms.txt', () => {
  const text = llmsTxt(SITE);

  it('follows the convention: a title, a summary quote, then link lists', () => {
    const lines = text.split('\n');
    expect(lines[0]).toBe('# Yash Bakshi');
    expect(lines[2]).toMatch(/^> .+software engineer/);
    expect(text).toMatch(/^## Pages$/m);
  });

  it('links every indexed page, and the full text file, with the full address', () => {
    for (const m of pageMeta) expect(text).toContain(`[${m.name}](${SITE}${m.path}): `);
    expect(text).toContain(`(${SITE}/llms-full.txt)`);
    expect(text).not.toContain('404');
  });

  it('has no placeholder values', () => {
    expect(text).not.toMatch(/undefined|\[object Object\]/);
  });
});

describe('llms-full.txt', () => {
  const text = llmsFullTxt(SITE);

  it('has every role, degree and project, with its details', () => {
    for (const e of [...roles, ...education]) {
      expect(text, e.id).toContain(e.org);
      expect(text, e.id).toContain(e.note);
    }
    for (const p of projects) {
      expect(text, p.id).toContain(`### ${p.name}`);
      expect(text, p.id).toContain(p.detail);
      for (const s of p.stack) expect(text, `${p.id} ${s}`).toContain(s);
    }
    for (const s of smallProjects) expect(text).toContain(s.name);
  });

  it('has the case study, the contact links and the page addresses', () => {
    expect(text).toContain('## TestPilot case study');
    expect(text).toContain('0.375');
    for (const c of contactList) expect(text).toContain(c.href);
    expect(text).toContain(`${SITE}/projects/testpilot/`);
  });

  it('is plain text with no placeholder values or markup', () => {
    expect(text).not.toMatch(/undefined|\[object Object\]|<[a-z]+[ >]/);
  });
});
