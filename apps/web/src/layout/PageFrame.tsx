import { useEffect, type ReactNode } from 'react';
import { DotGrid } from '../DotGrid';
import { GuideDock, GuideProvider } from '../Guide';
import { SiteFooter } from './SiteFooter';
import { SiteHeader } from './SiteHeader';
import type { PageId } from './nav';
import { WipNotice } from './WipNotice';

/**
 * Scrolls to the element a link's #hash names. It waits for the fonts, because a heading that changes
 * typeface moves everything below it, and for parts that appear a frame after the page (the filter
 * tabs' list). The jump is instant: nobody wants to watch the page scroll past to where they asked to be.
 */
function useScrollToHash() {
  useEffect(() => {
    const id = decodeURIComponent(window.location.hash.slice(1));
    if (!id) return;
    let frame = 0;
    let tries = 0;
    let stopped = false;
    const go = () => {
      if (stopped) return;
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: 'instant' as ScrollBehavior });
      else if (tries++ < 60) frame = requestAnimationFrame(go);
    };
    const fonts = document.fonts?.ready ?? Promise.resolve();
    void Promise.race([fonts, new Promise((r) => setTimeout(r, 1500))]).then(go);
    return () => {
      stopped = true;
      cancelAnimationFrame(frame);
    };
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
