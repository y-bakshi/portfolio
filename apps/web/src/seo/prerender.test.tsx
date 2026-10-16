// @vitest-environment node
import { placeMarkup } from '../../vite.prerender';
import { CONTACT_LINKS } from '../../worker/rag/facts';
import { education, projects, roles, smallProjects } from '../content';
import { technologies } from './jsonld';
import { pageComponents, renderPage, type PageFile } from './render';

const files = Object.keys(pageComponents) as PageFile[];

describe('prerendered pages', () => {
  it('render with no window at all, and render the same every time', () => {
    expect(typeof window).toBe('undefined');
    for (const f of files) expect(renderPage(f), f).toBe(renderPage(f));
  });

  it('never print a placeholder value', () => {
    for (const f of files) expect(renderPage(f), f).not.toMatch(/undefined|\[object Object\]|NaN/);
  });

  it('put the whole home page in the HTML', () => {
    const html = renderPage('index.html');
    for (const text of ['Thryv', 'TestPilot', 'Selected engineering work'])
      expect(html).toContain(text);
    for (const p of projects.filter((p) => p.featured)) expect(html, p.id).toContain(p.name);
    expect(html).toContain('I build AI applications, backend services and cloud delivery');
    expect(html).toContain('https://github.com/y-bakshi');
    expect(html.match(/<h1/g)).toHaveLength(1);
  });

  it('put every role and degree in the experience page', () => {
    const html = renderPage('experience/index.html');
    for (const e of [...roles, ...education]) {
      expect(html, e.id).toContain(e.title);
      for (const point of e.points) expect(html, point).toContain(point.replace(/'/g, '&#x27;'));
    }
  });

  it('put every way to reach Yash in the contact page', () => {
    const html = renderPage('contact/index.html');
    for (const value of Object.values(CONTACT_LINKS)) expect(html, value).toContain(value);
  });

  it('shows everything the structured data says about the person', () => {
    const html = renderPage('index.html');
    for (const t of technologies(true)) expect(html, t).toContain(t);
  });

  it('put every project in the all projects page', () => {
    const html = renderPage('projects/index.html');
    for (const p of projects) expect(html, p.id).toContain(p.name);
    for (const s of smallProjects) expect(html, s.name).toContain(s.name);
  });

  it('put the case study in the TestPilot page', () => {
    const html = renderPage('projects/testpilot/index.html');
    for (const text of [
      'The problem',
      'How it works',
      'Measured results',
      'Precision 0.39',
      'Cloud Run',
    ])
      expect(html).toContain(text);
  });

  it('keep the not-found page small', () => {
    expect(renderPage('404.html')).toContain('Page not found');
  });
});

describe('placing the markup in a built page', () => {
  const page = '<html><head></head><body><div id="root"></div></body></html>';

  it('fills the empty root and moves hoisted preload links into the head', () => {
    const out = placeMarkup(page, '<link rel="preload" as="image" href="/a.png"/><main>Hi</main>');
    expect(out).toContain('<div id="root"><main>Hi</main></div>');
    expect(out).toMatch(/<link rel="preload" as="image" href="\/a.png"\/>\s*<\/head>/);
  });

  it('refuses a page that has no empty root', () => {
    expect(() => placeMarkup('<html></html>', '<p></p>')).toThrow(/empty #root/);
  });
});
