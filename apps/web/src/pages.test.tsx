import { render, screen, within } from '@testing-library/react';
import Home from './App';
import AllProjects from './AllProjects';
import CaseStudy from './CaseStudy';
import ContactPage from './ContactPage';
import ExperiencePage from './ExperiencePage';
import NotFound from './NotFound';
import { education, heroStack, projects, roles, smallProjects } from './content';

vi.mock('./DotGrid', () => ({ DotGrid: () => null }));
vi.mock('./MistPortrait', () => ({
  MistPortrait: ({ alt }: { alt: string }) => <img alt={alt} src="" />,
}));

const home = () => render(<Home />);

describe('every page', () => {
  it.each([
    ['home', Home],
    ['projects', AllProjects],
    ['case study', CaseStudy],
    ['experience', ExperiencePage],
    ['contact', ContactPage],
    ['not found', NotFound],
  ])('the %s page has one h1, the landmarks, a skip link and the guide', (_name, Page) => {
    render(<Page />);
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(screen.getByRole('main')).toBeInTheDocument();
    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: /main/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /skip/i })).toHaveAttribute('href', '#main');
    expect(screen.getByRole('button', { name: /^ask the guide/i })).toBeInTheDocument();
  });

  it('puts the work in progress note above the header', () => {
    home();
    const strip = screen.getByRole('note');
    expect(strip).toHaveTextContent(/work in progress/i);
    expect(strip.nextElementSibling?.tagName).toBe('HEADER');
  });

  it('links to the three pages and marks the current one', () => {
    render(<ExperiencePage />);
    const nav = screen.getByRole('navigation', { name: /main/i });
    expect(within(nav).getByRole('link', { name: 'Projects' })).toHaveAttribute(
      'href',
      '/projects/',
    );
    expect(within(nav).getByRole('link', { name: 'Contact' })).toHaveAttribute('href', '/contact/');
    expect(within(nav).getByRole('link', { name: 'Experience' })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });
});

describe('home page', () => {
  it('shows who Yash is, two ways in, and the portrait', () => {
    home();
    expect(screen.getByRole('link', { name: /view projects/i })).toHaveAttribute(
      'href',
      '/projects/',
    );
    expect(screen.getByRole('button', { name: /chat with the guide/i })).toBeInTheDocument();
    expect(screen.getByAltText(/portrait of yash bakshi/i)).toBeInTheDocument();
  });

  it('lists the technologies once for screen readers', () => {
    home();
    expect(screen.getByText(/technologies i work with/i)).toHaveTextContent(heroStack[0]);
  });

  it('puts exactly the four featured projects in the selected work, with a link to the rest', () => {
    home();
    const work = document.getElementById('work') as HTMLElement;
    expect(within(work).getByRole('heading', { level: 2 })).toHaveTextContent(/selected/i);
    const cards = [...work.querySelectorAll('article')].map((t) => t.id);
    expect(cards).toEqual(projects.filter((p) => p.featured).map((p) => p.id));
    expect(within(work).getByRole('link', { name: /see all projects/i })).toHaveAttribute(
      'href',
      '/projects/',
    );
    for (const p of projects.filter((p) => !p.featured))
      expect(document.getElementById(p.id), p.id).toBeNull();
  });

  it('links to the TestPilot case study and only that one', () => {
    home();
    const links = screen.getAllByRole('link', { name: /case study/i });
    expect(links).toHaveLength(1);
    expect(links[0]).toHaveAttribute('href', '/projects/testpilot/');
  });

  it('points to the recent experience', () => {
    home();
    expect(screen.getByText(/recent experience/i).closest('p')).toHaveTextContent(roles[0].org);
  });
});

describe('projects page', () => {
  it('shows every project and the coursework', () => {
    render(<AllProjects />);
    expect(
      screen.getByRole('heading', { level: 1, name: /engineering projects/i }),
    ).toBeInTheDocument();
    for (const p of projects) {
      const el = document.getElementById(p.id);
      expect(el, p.id).toHaveTextContent(p.name);
      expect(el, p.id).toHaveAttribute('tabindex', '-1');
    }
    for (const sp of smallProjects)
      expect(screen.getByText(sp.name, { exact: false })).toBeInTheDocument();
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

  it('filters by category', async () => {
    const { default: userEvent } = await import('@testing-library/user-event');
    const user = userEvent.setup();
    render(<AllProjects />);
    await user.click(screen.getByRole('tab', { name: 'Systems' }));
    const shown = projects.filter((p) => p.categories.includes('systems'));
    for (const p of shown) expect(document.getElementById(p.id), p.id).not.toBeNull();
    for (const p of projects.filter((p) => !p.categories.includes('systems')))
      expect(document.getElementById(p.id), p.id).toBeNull();
  });
});

describe('case study page', () => {
  const study = () => render(<CaseStudy />);

  it('shows the project with a way back', () => {
    study();
    expect(screen.getByRole('heading', { level: 1, name: 'TestPilot' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /all projects/i })).toHaveAttribute(
      'href',
      '/projects/',
    );
  });

  it('reports each measurement with its limitation', () => {
    study();
    const table = screen.getByRole('table');
    expect(
      within(table)
        .getAllByRole('columnheader')
        .map((h) => h.textContent),
    ).toEqual(['Evaluation', 'Result', 'Limitation']);
    expect(within(table).getAllByRole('row')).toHaveLength(3);
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

describe('experience page', () => {
  it('shows every role and degree with an id the guide can cite', () => {
    render(<ExperiencePage />);
    for (const e of [...roles, ...education]) {
      const el = document.getElementById(e.id);
      expect(el, e.id).toHaveTextContent(e.org);
      expect(el, e.id).toHaveAttribute('tabindex', '-1');
      for (const point of e.points) expect(el, point).toHaveTextContent(point);
    }
  });
});

describe('contact page', () => {
  it('has real contact links, each external one safe', () => {
    render(<ContactPage />);
    const main = screen.getByRole('main');
    const links = within(main).getAllByRole('link');
    const hrefs = links.map((a) => a.getAttribute('href'));
    expect(hrefs).toEqual(
      expect.arrayContaining([
        'mailto:ybakshi@asu.edu',
        'mailto:bakshi.yash@outlook.com',
        'https://www.linkedin.com/in/yash-bakshi-56615a62/',
        'https://github.com/y-bakshi',
        'https://calendar.app.google/GNW9xhXdiq7Mv9bU9',
      ]),
    );
    for (const a of links) {
      if (a.getAttribute('href')?.startsWith('http'))
        expect(a, a.textContent ?? '').toHaveAttribute('rel', expect.stringContaining('noopener'));
    }
  });

  it('gives the guide a place to point at', () => {
    render(<ContactPage />);
    expect(document.getElementById('contact')).toHaveAttribute('tabindex', '-1');
  });
});

describe('not found page', () => {
  it('has a way back', () => {
    render(<NotFound />);
    expect(screen.getByRole('link', { name: 'Go home' })).toHaveAttribute('href', '/');
    expect(screen.getByRole('link', { name: /see my projects/i })).toHaveAttribute(
      'href',
      '/projects/',
    );
  });
});
