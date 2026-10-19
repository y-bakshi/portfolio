/**
 * What each indexable page is called and says about itself. The structured data and the llms.txt
 * files read this list, and a test checks the HTML files carry the same titles and descriptions.
 */
export type PageMeta = {
  path: string;
  /** The built file, relative to the build folder. */
  file: string;
  title: string;
  description: string;
  /** The page's name in a breadcrumb trail and in link lists. */
  name: string;
};

export const pageMeta: PageMeta[] = [
  {
    path: '/',
    file: 'index.html',
    title: 'Yash Bakshi | Software engineer',
    description:
      'Yash Bakshi is a software engineer working on AI applications, backend services and cloud delivery. See his projects, work history and education, or get in touch.',
    name: 'Home',
  },
  {
    path: '/projects/',
    file: 'projects/index.html',
    title: 'All projects | Yash Bakshi',
    description:
      'Every project by Yash Bakshi: AI applications such as TestPilot and GuardianAI, serverless cloud pipelines such as CityWatch, backend services and coursework.',
    name: 'All projects',
  },
  {
    path: '/projects/testpilot/',
    file: 'projects/testpilot/index.html',
    title: 'TestPilot case study | Yash Bakshi',
    description:
      "How TestPilot generates unit tests that follow a team's coding standards and ranks defect-prone files, with its measured results.",
    name: 'TestPilot case study',
  },
  {
    path: '/contact/',
    file: 'contact/index.html',
    title: 'Contact | Yash Bakshi',
    description: 'How to reach Yash Bakshi: email, LinkedIn, GitHub, or book a 30 minute call.',
    name: 'Contact',
  },
  {
    path: '/privacy/',
    file: 'privacy/index.html',
    title: 'Privacy and credits | Yash Bakshi',
    description:
      'What this site saves when you use the guide, who handles it, and who made the parts of the site that are not Yash Bakshi’s.',
    name: 'Privacy',
  },
];

/** Turns a built file or a request path into the page's path: `/projects/index.html` becomes `/projects/`. */
export function pathOf(raw: string): string {
  const p = raw.startsWith('/') ? raw : `/${raw}`;
  return p.replace(/index\.html$/, '');
}

export const metaFor = (raw: string): PageMeta | undefined =>
  pageMeta.find((m) => m.path === pathOf(raw));
