import type { Entry } from './types';

export const roles: Entry[] = [
  {
    id: 'thryv',
    points: [
      'Independent deployment for the team’s Java and Micronaut services',
      'Gated CircleCI promotion, with hermetic JMH and K6 tests',
      'OpenAPI compatibility checks across 100+ operations',
      '40 pull requests',
    ],
    tags: ['CI/CD', 'API compatibility', 'Performance testing'],
    mark: 'Th',
    logo: '/logos/thryv.png',
    title: 'Software engineering intern',
    org: 'Thryv',
    when: 'May to Aug 2026',
    note: 'Independent deployment for the team’s Java and Micronaut services, gated CircleCI promotion, hermetic JMH and K6 tests, OpenAPI compatibility checks across 100+ operations, 40 pull requests.',
  },
  {
    id: 'insight',
    points: [
      'Led eight people across five ServiceNow projects',
      'Mentored 12 developers',
      'Zero critical post-deployment defects',
      'Best Team Award among 30+ teams',
    ],
    mark: 'In',
    logo: '/logos/insight.webp',
    title: 'Technical team lead',
    org: 'InfoCenter, an Insight Company',
    when: 'Jun to Dec 2024',
    note: 'Led eight people across five ServiceNow projects and mentored 12 developers. Zero critical post-deployment defects. Best Team Award among 30+ teams.',
  },
  {
    id: 'tcs-dev',
    points: [
      'Python and LLDP discovery that kept a CMDB of 10,000+ devices current',
      '100+ portals and forms, and monitoring integrations',
      'Runbooks that cut onboarding from two weeks to five days',
    ],
    mark: 'TCS',
    logo: '/logos/tcs.svg',
    title: 'ServiceNow developer',
    org: 'Tata Consultancy Services',
    when: 'Sep 2022 to May 2024',
    note: 'Python and LLDP discovery that kept a CMDB of 10,000+ devices current, 100+ portals and forms, monitoring integrations, runbooks that cut onboarding from two weeks to five days.',
  },
  {
    id: 'tcs-ase',
    points: [
      'RHEL, Docker and HPC operations with IBM Spectrum LSF',
      'Monitoring, and 99.9% documented uptime',
    ],
    mark: 'TCS',
    logo: '/logos/tcs.svg',
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
    mark: 'ASU',
    logo: '/logos/asu.png',
    title: 'MS, Computer Software Engineering',
    org: 'Arizona State University',
    when: 'Jan 2025 to Dec 2026',
    note: 'Statistical machine learning, AI for software engineers, data processing at scale, cloud computing, software project management.',
  },
  {
    id: 'manipal',
    points: [
      'Data structures and algorithms, databases, computer networks, object-oriented programming',
      'ServiceNow Certified System Administrator and ServiceNow Discovery certifications',
    ],
    mark: 'MUJ',
    logo: '/logos/manipal.png',
    title: 'Bachelor of Information Technology',
    org: 'Manipal University Jaipur',
    when: 'Aug 2017 to Aug 2021',
    note: 'Data structures and algorithms, databases, computer networks, object-oriented programming. ServiceNow Certified System Administrator and ServiceNow Discovery certifications.',
  },
];
