/**
 * Facts that the site states but that are not in a content module: how to get in touch, and the
 * skills summary the page's own guide gives, plus a few details Yash approved for the guide:
 * where he lives, graduation, work authorization and availability. Do not add anything he has not approved.
 * `facts.test.ts` checks the contact links against the page.
 */
export type Fact = { id: string; sourceId: string; title: string; text: string };

export const CONTACT_LINKS = {
  emailSchool: 'ybakshi@asu.edu',
  emailPersonal: 'bakshi.yash@outlook.com',
  linkedin: 'https://www.linkedin.com/in/yash-bakshi-56615a62/',
  github: 'https://github.com/y-bakshi',
  booking: 'https://calendar.app.google/GNW9xhXdiq7Mv9bU9',
};

export const facts: Fact[] = [
  {
    id: 'fact:contact',
    sourceId: 'contact',
    title: 'How to contact Yash',
    text: `Yash can be reached by email at ${CONTACT_LINKS.emailSchool} or ${CONTACT_LINKS.emailPersonal}. His LinkedIn is ${CONTACT_LINKS.linkedin} and his GitHub is ${CONTACT_LINKS.github}. A 30 minute call can be booked at ${CONTACT_LINKS.booking}. These links are on the contact page.`,
  },
  {
    id: 'fact:skills',
    sourceId: 'general',
    title: 'Day to day tools',
    text: 'Day to day, Yash works in Python and Java, with FastAPI and Micronaut, on AWS and GCP, using Docker and Kubernetes. Rust, C++ and TypeScript appear in his project work.',
  },
  {
    id: 'fact:career',
    sourceId: 'general',
    title: 'Career in order',
    text: 'Yash has held four roles, newest first: software engineering intern at Thryv, technical team lead at InfoCenter, an Insight Company, ServiceNow developer at Tata Consultancy Services, and assistant systems engineer at Tata Consultancy Services. He is finishing an MS in Computer Software Engineering at Arizona State University.',
  },
  {
    id: 'fact:graduation',
    sourceId: 'general',
    title: 'Graduation',
    text: 'Yash is expected to graduate with his MS in Computer Software Engineering from Arizona State University in December 2026.',
  },
  {
    id: 'fact:location',
    sourceId: 'general',
    title: 'Where Yash lives',
    text: 'Yash lives in Tempe, Arizona.',
  },
  {
    id: 'fact:born',
    sourceId: 'general',
    title: 'When Yash was born',
    text: 'Yash was born in February 1999.',
  },
  {
    id: 'fact:hobbies',
    sourceId: 'general',
    title: 'Yash’s hobbies',
    text: 'Outside of work, Yash enjoys photography.',
  },
  {
    id: 'fact:work-authorization',
    sourceId: 'general',
    title: 'Work authorization',
    text: 'Yash is an international student and will need visa sponsorship to work in the United States.',
  },
  {
    id: 'fact:availability',
    sourceId: 'general',
    title: 'Availability',
    text: 'Yash is looking for full-time software engineering roles and is available to start from January 2027.',
  },
  {
    id: 'fact:this-guide',
    sourceId: 'general',
    title: 'How this guide (the portfolio chat) works',
    text: 'The guide on this site is a chat Yash built for his portfolio. It is separate from GuardianAI, which is a different project. The guide searches Yash’s own project notes by meaning, hands the closest notes to a Gemini model, and answers only from them, with buttons that jump to the project, role or degree it used. When the notes do not cover a question it says so and points to the contact page instead of guessing.',
  },
  {
    id: 'fact:this-guide-stack',
    sourceId: 'general',
    title: 'How this guide is built and run',
    text: 'The site and the guide run on Cloudflare: the page is served as static files and the chat is a small Worker with a D1 database. Questions are matched to notes with Gemini embeddings. The guide has rate limits per visitor and a hard monthly spending cap, and it records only anonymous question and answer text, with no IP addresses, for 90 days to improve the notes.',
  },
];
