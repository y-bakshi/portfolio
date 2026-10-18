import { contactList } from './contact';
import { education, projects, roles, smallProjects } from '../content';
import type { Entry, Project } from '../content';
import { testpilotCase as study } from '../content/testpilot-case';
import { technologies } from './jsonld';
import { pageMeta } from './pages';

const NAME = 'Yash Bakshi';

/** One paragraph about the site, built from the newest job and degree so it cannot go stale. */
export function summary(): string {
  const job = roles[0];
  const degree = education[0];
  return (
    `${NAME} is a software engineer working across AI applications, backend services and cloud delivery. ` +
    `He is studying for an ${degree.title.replace(', ', ' in ')} at ${degree.org} (${degree.when}) ` +
    `and most recently worked as a ${job.title.toLowerCase()} at ${job.org} (${job.when}). ` +
    'This site holds his projects, work history, education and contact details.'
  );
}

/** The llms.txt convention: a title, a short summary and a list of the pages worth reading. */
export function llmsTxt(site: string): string {
  const pages = pageMeta.map((m) => `- [${m.name}](${site}${m.path}): ${m.description}`);
  const profiles = contactList
    .filter((c) => c.href.startsWith('https://'))
    .map((c) => `- [${c.label}](${c.href})`);
  return [
    `# ${NAME}`,
    '',
    `> ${summary()}`,
    '',
    '## Pages',
    '',
    ...pages,
    '',
    '## Full text',
    '',
    `- [Everything on this site as one text file](${site}/llms-full.txt): roles, degrees, every project with its stack, the TestPilot case study and contact links.`,
    '',
    '## Profiles and contact',
    '',
    ...profiles,
    '',
  ].join('\n');
}

const entry = (e: Entry) => `### ${e.title}, ${e.org}\n\n${e.when}. ${e.note}\n`;

function project(p: Project, site: string): string {
  const links = (p.links ?? []).map((l) => `- ${l.label}: ${l.href}`);
  const steps = p.trace.map((t) => t.label).join(' -> ');
  const case_ = p.id === 'testpilot' ? [`- Case study: ${site}/projects/testpilot/`] : [];
  return [
    `### ${p.name}`,
    '',
    `${p.line} ${p.detail}`,
    '',
    `- Role: ${p.role}`,
    `- Built with: ${p.stack.join(', ')}`,
    `- Pipeline: ${steps}`,
    ...links,
    ...case_,
    '',
  ].join('\n');
}

function caseStudy(): string {
  return [
    '## TestPilot case study',
    '',
    '### The problem',
    '',
    ...study.problem.flatMap((t) => [t, '']),
    '### What I built',
    '',
    ...study.built.flatMap((t) => [t, '']),
    '### Results',
    '',
    ...study.results.flatMap((r) => [`**${r.lead}** ${r.text}`, '']),
    `- Team: ${study.team}`,
    `- Source: ${study.source}`,
    `- Live demo: ${study.demo.href}${study.demo.after}`,
    '',
  ].join('\n');
}

/** All of the site's content as plain markdown, for readers that want one file. */
export function llmsFullTxt(site: string): string {
  const featured = projects.filter((p) => p.featured);
  const others = projects.filter((p) => !p.featured);
  return [
    `# ${NAME}`,
    '',
    `> ${summary()}`,
    '',
    `Site: ${site}/`,
    '',
    '## Work history',
    '',
    ...roles.map(entry),
    '## Education',
    '',
    ...education.map(entry),
    '## Featured projects',
    '',
    ...featured.map((p) => project(p, site)),
    '## More projects',
    '',
    ...others.map((p) => project(p, site)),
    '## Smaller projects and coursework',
    '',
    ...smallProjects.map((s) => `- **${s.name}.** ${s.line}`),
    '',
    caseStudy(),
    '## Technologies used in the projects',
    '',
    technologies().join(', '),
    '',
    '## Contact',
    '',
    ...contactList.map((c) => `- ${c.label}: ${c.href}`),
    '',
    '## Pages',
    '',
    ...pageMeta.map((m) => `- ${m.name}: ${site}${m.path}`),
    '',
  ].join('\n');
}
