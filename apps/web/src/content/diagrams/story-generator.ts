import type { Diagram } from './types';

/** Gemini story generator: a child's age, theme and characters become a prompt, and Gemini returns a story and pictures. */
export const storyGenerator: Diagram = {
  summary:
    'A production line. A story request enters a hopper, a press builds the prompt, a second press stands for Gemini, and the story and its pictures arrive in the tray.',
  stations: [
    {
      id: 'request',
      kind: 'hopper',
      label: 'Story prompt',
      sub: 'A child’s age, theme and characters are collected.',
      col: 0,
      row: 0,
    },
    {
      id: 'build',
      kind: 'press',
      label: 'Build the prompt',
      sub: 'The FastAPI service builds the prompt.',
      col: 1,
      row: 0,
    },
    {
      id: 'gemini',
      kind: 'press',
      label: 'Gemini',
      sub: 'Gemini is prompted for a story and matching images.',
      col: 2,
      row: 0,
    },
    {
      id: 'story',
      kind: 'tray',
      label: 'Story and images',
      sub: 'The story and its images come back, for ages 4 to 12.',
      col: 3,
      row: 0,
    },
  ],
  links: [
    { from: 'request', to: 'build' },
    { from: 'build', to: 'gemini' },
    { from: 'gemini', to: 'story' },
  ],
  routes: [['request', 'build', 'gemini', 'story']],
};
