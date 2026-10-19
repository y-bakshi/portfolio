import type { Answer } from './types';

export const suggestions = [
  'What has Yash built with RAG?',
  'Show me his backend experience',
  'Has he worked with agents?',
  'What cloud work has he done?',
];

/**
 * What a visitor sees when the guide cannot answer (the model is down, slow or out of budget). It
 * says so plainly and points at the cards and the contact block, which work without the guide.
 */
export const unavailableAnswer: Answer = {
  text: 'The guide cannot answer just now. The project and contact pages still work, and Yash can answer anything directly.',
  cites: ['contact'],
};
