import { profileLinks } from './contact';
import { education, projects } from '../content';
import { metaFor, pageMeta, type PageMeta } from './pages';

type Json = Record<string, unknown>;

const NAME = 'Yash Bakshi';
const JOB_TITLE = 'Software engineer';

/** Every technology named in the project cards, once each, in the order they first appear. */
export const technologies = (featuredOnly = false): string[] => [
  ...new Set(projects.filter((p) => p.featured || !featuredOnly).flatMap((p) => p.stack)),
];

const person = (site: string): Json => ({
  '@type': 'Person',
  '@id': `${site}/#person`,
  name: NAME,
  url: `${site}/`,
  jobTitle: JOB_TITLE,
  description: pageMeta[0].description,
  image: `${site}/portrait.webp`,
  sameAs: profileLinks,
  alumniOf: education.map((e) => ({ '@type': 'CollegeOrUniversity', name: e.org })),
  // only the cards on the home page, so everything listed here can be seen on that page
  knowsAbout: technologies(true),
});

const website = (site: string): Json => ({
  '@type': 'WebSite',
  '@id': `${site}/#website`,
  name: NAME,
  url: `${site}/`,
  description: pageMeta[0].description,
  inLanguage: 'en',
  author: { '@id': `${site}/#person` },
});

/** The trail from the home page down to this page. */
const breadcrumbs = (site: string, page: PageMeta): Json => {
  const trail = pageMeta.filter((m) => m.path === '/' || page.path.startsWith(m.path));
  return {
    '@type': 'BreadcrumbList',
    itemListElement: trail.map((m, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: m.name,
      item: `${site}${m.path}`,
    })),
  };
};

const caseStudy = (site: string, page: PageMeta): Json => {
  const project = projects.find((p) => p.id === 'testpilot')!;
  return {
    '@type': 'TechArticle',
    headline: page.name,
    description: page.description,
    url: `${site}${page.path}`,
    mainEntityOfPage: `${site}${page.path}`,
    image: `${site}/og.png`,
    inLanguage: 'en',
    keywords: project.stack.join(', '),
    author: { '@type': 'Person', name: NAME, url: `${site}/` },
    isPartOf: { '@id': `${site}/#website` },
  };
};

/** The structured data for one page, or null for a page that is not indexed. */
export function jsonLdFor(raw: string, site: string): Json | null {
  const page = metaFor(raw);
  if (!page) return null;
  const graph: Json[] = [];
  if (page.path === '/') graph.push(person(site), website(site));
  else graph.push(breadcrumbs(site, page));
  if (page.path === '/projects/testpilot/') graph.push(caseStudy(site, page));
  return { '@context': 'https://schema.org', '@graph': graph };
}

/** The script tag for a page's head. `<` is escaped so no value can close the tag early. */
export function jsonLdScript(raw: string, site: string): string {
  const data = jsonLdFor(raw, site);
  if (!data) return '';
  const body = JSON.stringify(data).replace(/</g, '\\u003c');
  return `<script type="application/ld+json">${body}</script>`;
}
