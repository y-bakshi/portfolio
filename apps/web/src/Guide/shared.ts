export type Status = 'ready' | 'thinking' | 'answering';

export const statusLabel: Record<Status, string> = {
  ready: 'Ready for your question',
  thinking: 'Looking through the notes',
  answering: 'Answering, one moment',
};

export const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
