import { useEffect, type ReactNode } from 'react';
import { DotGrid } from '../DotGrid';
import { GuideDock, GuideProvider } from '../Guide';
import { SiteFooter } from './SiteFooter';
import { SiteHeader } from './SiteHeader';
import type { PageId } from './nav';
import { WipNotice } from './WipNotice';

/** Scrolls to the element a link's #hash names, for pages that are drawn after load. */
function useScrollToHash() {
  useEffect(() => {
    const id = decodeURIComponent(window.location.hash.slice(1));
    if (id) document.getElementById(id)?.scrollIntoView();
  }, []);
}

/**
 * What every page shares: the dot grid, the header, the footer and the guide. `portraitFormed` lets
 * the home page hold a restored chat back until its portrait has finished forming.
 */
export function PageFrame({
  current,
  portraitFormed = true,
  children,
}: {
  current: PageId;
  portraitFormed?: boolean;
  children: ReactNode;
}) {
  useScrollToHash();
  return (
    <GuideProvider portraitFormed={portraitFormed}>
      <DotGrid />
      <WipNotice />
      <SiteHeader current={current} />
      <main id="main" className="relative z-[1]">
        {children}
      </main>
      <SiteFooter />
      <GuideDock />
    </GuideProvider>
  );
}
