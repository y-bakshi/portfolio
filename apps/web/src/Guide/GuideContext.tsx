import { createContext, useContext, type ReactNode } from 'react';
import { useGuide, type Guide } from './useGuide';

const GuideContext = createContext<Guide | null>(null);

/** Holds the one guide for the page, so the header, the sections and the chat panel share it. */
export function GuideProvider({
  portraitFormed = true,
  children,
}: {
  portraitFormed?: boolean;
  children: ReactNode;
}) {
  const guide = useGuide(portraitFormed);
  return <GuideContext.Provider value={guide}>{children}</GuideContext.Provider>;
}

export function useGuideContext(): Guide {
  const guide = useContext(GuideContext);
  if (!guide) throw new Error('useGuideContext must be used inside a GuideProvider');
  return guide;
}
