import type { Entry } from './types';

export const roles: Entry[] = [
  {
    id: 'thryv',
    summary:
      'Moved the team’s Java and Micronaut services off a shared, schedule-based release train onto pipelines of their own, each with quality gates, a hotfix lane, performance tests and an API-compatibility check. Opened 40 pull requests across eight repositories.',
    tags: ['CI/CD', 'API compatibility', 'Performance testing'],
    title: 'Software engineering intern',
    org: 'Thryv',
    when: 'May to Aug 2026',
    note: 'Independent deployment for the team’s Java and Micronaut services, gated CircleCI promotion, hermetic JMH and K6 tests, OpenAPI compatibility checks across 100+ operations, 40 pull requests.',
  },
  {
    id: 'insight',
    summary:
      'Led an eight-person ServiceNow team across five client projects and mentored 12 developers. Set up peer review, checklists and testing gates that kept critical post-deployment defects at zero, and the team won the Best Team Award among 30+ teams.',
    title: 'Technical team lead',
    org: 'InfoCenter, an Insight Company',
    when: 'Jun to Dec 2024',
    note: 'Led eight people across five ServiceNow projects and mentored 12 developers. Zero critical post-deployment defects. Best Team Award among 30+ teams.',
  },
  {
    id: 'tcs-dev',
    summary:
      'Built a Python discovery tool that used LLDP to keep a CMDB of 10,000+ devices current across about 20 closed network zones, plus 100+ ServiceNow portals and forms and integrations with Azure IoT Hub, SolarWinds and CloudWatch. Wrote runbooks that cut onboarding from two weeks to five days.',
    title: 'ServiceNow developer',
    org: 'Tata Consultancy Services',
    when: 'Sep 2022 to May 2024',
    note: 'Python and LLDP discovery that kept a CMDB of 10,000+ devices current, 100+ portals and forms, monitoring integrations, runbooks that cut onboarding from two weeks to five days.',
  },
  {
    id: 'tcs-ase',
    summary:
      'Supported RHEL, Docker and HPC operations around IBM Spectrum LSF job scheduling, monitoring system and queue health and triaging emergency tickets under senior-engineer guidance, with 99.9% uptime documented in SLA reports.',
    title: 'Assistant systems engineer',
    org: 'Tata Consultancy Services',
    when: 'Nov 2021 to Sep 2022',
    note: 'RHEL, Docker and HPC operations with IBM Spectrum LSF, monitoring, and 99.9% documented uptime.',
  },
];

export const education: Entry[] = [
  {
    id: 'asu',
    points: [
      'Statistical machine learning and AI for software engineers',
      'Data processing at scale and cloud computing',
      'Software project management',
    ],
    title: 'MS, Computer Software Engineering',
    org: 'Arizona State University',
    when: 'Jan 2025 to Dec 2026',
    note: 'Statistical machine learning, AI for software engineers, data processing at scale, cloud computing, software project management.',
  },
  {
    id: 'manipal',
    points: ['Data structures and algorithms, web technology, data science and programming'],
    title: 'Bachelor of Information Technology',
    org: 'Manipal University Jaipur',
    when: 'Aug 2017 to Aug 2021',
    note: 'Data structures and algorithms, web technology, data science and programming.',
  },
];
