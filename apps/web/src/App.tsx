import { useCallback, useEffect, useState } from 'react';
import { DotGrid } from './DotGrid';
import { GuideDock, useGuide } from './Guide';
import { SiteHeader, WipBanner } from './parts';
import { useSnapScroll } from './snapScroll';
import { Contact } from './sections/Contact';
import { Education } from './sections/Education';
import { Footer } from './sections/Footer';
import { Hero } from './sections/Hero';
import { Projects } from './sections/Projects';
import { WorkHistory } from './sections/WorkHistory';

export function Home() {
  // the portrait forms first; the introduction and any saved chat come after it
  const [formed, setFormed] = useState(false);
  const onFormed = useCallback(() => setFormed(true), []);
  const g = useGuide(formed);
  const { isMobile, thread, marked } = g;
  useSnapScroll();

  useEffect(() => {
    const id = window.location.hash.slice(1);
    if (id) document.getElementById(id)?.scrollIntoView();
  }, []);

  return (
    <>
      <DotGrid />
      <WipBanner />
      <SiteHeader />
      <main id="main">
        <Hero
          isMobile={isMobile}
          thread={thread}
          feedRef={g.refs.feedRef}
          formed={formed}
          onFormed={onFormed}
        />
        <Projects marked={marked} />
        <WorkHistory marked={marked} />
        <div className="finale">
          <Education marked={marked} />
          <Contact marked={marked} />
        </div>
      </main>
      <GuideDock g={g} />
      <Footer />
    </>
  );
}

export default Home;
