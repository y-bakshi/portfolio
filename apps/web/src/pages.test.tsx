import { render, screen, within } from '@testing-library/react';
import Home from './App';
import AllProjects from './AllProjects';
import CaseStudy from './CaseStudy';
import { education, projects, roles, smallProjects } from './content';

vi.mock('./DotGrid', () => ({ DotGrid: () => null }));
vi.mock('./MistPortrait', () => ({
  MistPortrait: ({ alt }: { alt: string }) => <img alt={alt} src="" />,
}));

const home = () => render(<Home />);

describe('home page', () => {
  it('has one h1 and the standard landmarks', () => {
    home();
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(screen.getByRole('main')).toBeInTheDocument();
    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: /main/i })).toBeInTheDocument();
  });

  it('offers a skip link that points at the main content', () => {
    home();
    const skip = screen.getByRole('link', { name: /skip/i });
    expect(skip).toHaveAttribute('href', '#main');
    expect(document.getElementById('main')).toBeInTheDocument();
  });

  it('has every section, each with a heading', () => {
    home();
    for (const name of ['Projects', 'Work history', 'Education']) {
      expect(screen.getByRole('heading', { level: 2, name }), name).toBeInTheDocument();
    }
    expect(
      screen.getByRole('heading', { level: 2, name: /problem worth working through/i }),
    ).toBeInTheDocument();
  });

  it('shows the featured projects and every role and degree', () => {
    home();
    for (const p of projects.filter((p) => p.featured))
      expect(document.getElementById(p.id), p.id).toHaveTextContent(p.name);
    for (const r of [...roles, ...education])
      expect(document.getElementById(r.id), r.id).toBeInTheDocument();
  });

  it('puts exactly the four featured projects on the projects screen, with a link to the rest', () => {
    home();
    const screenOne = document.getElementById('work') as HTMLElement;
    const tiles = [...screenOne.querySelectorAll('article.tile')].map((t) => t.id);
    expect(tiles).toEqual(projects.filter((p) => p.featured).map((p) => p.id));
    expect(tiles).toHaveLength(4);
    expect(within(screenOne).getByRole('link', { name: /see all projects/i })).toHaveAttribute(
      'href',
      '/projects/',
    );
    // the other projects live on their own page, not on the home page
    for (const p of projects.filter((p) => !p.featured))
      expect(document.getElementById(p.id), p.id).toBeNull();
  });

  it('links to the TestPilot case study and only that one', () => {
    home();
    const links = screen.getAllByRole('link', { name: /case study/i });
    expect(links).toHaveLength(1);
    expect(links[0]).toHaveAttribute('href', '/projects/testpilot/');
  });

  it('shows each card link as a safe external link', () => {
    render(<AllProjects />);
    const withLinks = projects.filter((p) => p.links);
    expect(withLinks.length).toBeGreaterThan(0);
    for (const p of withLinks) {
      const card = document.getElementById(p.id) as HTMLElement;
      for (const l of p.links!) {
        expect(l.href, l.label).toMatch(/^https:\/\//);
        const a = within(card).getByRole('link', { name: new RegExp(l.label, 'i') });
        expect(a).toHaveAttribute('href', l.href);
        expect(a).toHaveAttribute('target', '_blank');
        expect(a.getAttribute('rel')).toContain('noopener');
      }
    }
  });

  it('has real contact links', () => {
    home();
    const contact = document.getElementById('contact') as HTMLElement;
    const hrefs = within(contact)
      .getAllByRole('link')
      .map((a) => a.getAttribute('href'));
    expect(hrefs).toEqual(
      expect.arrayContaining([
        'mailto:ybakshi@asu.edu',
        'mailto:bakshi.yash@outlook.com',
        'https://www.linkedin.com/in/yash-bakshi-56615a62/',
        'https://github.com/y-bakshi',
        'https://calendar.app.google/GNW9xhXdiq7Mv9bU9',
      ]),
    );
    for (const a of within(contact).getAllByRole('link')) {
      if (a.getAttribute('href')?.startsWith('http')) {
        expect(a, a.textContent ?? '').toHaveAttribute('rel', expect.stringContaining('noopener'));
      }
    }
  });

  it('describes the portrait', () => {
    home();
    expect(screen.getByAltText(/portrait of yash bakshi/i)).toBeInTheDocument();
  });

  it('gives every card the guide can cite an id and a focus target', () => {
    home();
    for (const id of [
      ...projects.filter((p) => p.featured).map((p) => p.id),
      ...roles.map((r) => r.id),
      ...education.map((e) => e.id),
      'contact',
    ]) {
      const el = document.getElementById(id);
      expect(el, id).toBeInTheDocument();
      expect(el, id).toHaveAttribute('tabindex', '-1');
    }
  });
});

describe('case study page', () => {
  const study = () => render(<CaseStudy />);

  it('shows the project with a way back and no guide', () => {
    study();
    expect(screen.getByRole('heading', { level: 1, name: 'TestPilot' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /all projects/i })).toHaveAttribute(
      'href',
      '/projects/',
    );
    expect(screen.queryByRole('button', { name: /ask the guide/i })).toBeNull();
  });

  it('has no placeholder text left', () => {
    study();
    expect(document.body.textContent).not.toMatch(/\[[^\]]*(owner|to come)[^\]]*\]/i);
  });

  it('links the live demo safely', () => {
    study();
    const demo = screen.getByRole('link', { name: /live demo of testpilot/i });
    expect(demo).toHaveAttribute('href', expect.stringMatching(/^https:\/\//));
    expect(demo).toHaveAttribute('target', '_blank');
    expect(demo.getAttribute('rel')).toContain('noopener');
  });
});

describe('all projects page', () => {
  const all = () => render(<AllProjects />);

  it('shows every project and the coursework, with a way back and no guide', () => {
    all();
    expect(screen.getByRole('heading', { level: 1, name: /all projects/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /back to projects/i })).toHaveAttribute(
      'href',
      '/#work',
    );
    expect(screen.queryByRole('button', { name: /ask the guide/i })).toBeNull();
    for (const p of projects) {
      const el = document.getElementById(p.id);
      expect(el, p.id).toHaveTextContent(p.name);
      expect(el, p.id).toHaveAttribute('tabindex', '-1');
    }
    for (const sp of smallProjects)
      expect(screen.getByText(sp.name, { exact: false })).toBeInTheDocument();
  });
});
