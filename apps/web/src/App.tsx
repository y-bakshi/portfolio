import { useEffect } from 'react';
import { DotGrid } from './DotGrid';
import { GuideDock, useGuide } from './Guide';
import { SiteHeader } from './parts';
import { useSnapScroll } from './snapScroll';
import { Contact } from './sections/Contact';
import { Education } from './sections/Education';
import { Footer } from './sections/Footer';
import { Hero } from './sections/Hero';
import { Projects } from './sections/Projects';
import { Tools } from './sections/Tools';
import { WorkHistory } from './sections/WorkHistory';

export function Home() {
  const g = useGuide();
  const { isMobile, thread, marked } = g;
  useSnapScroll();

  useEffect(() => {
    const id = window.location.hash.slice(1);
    if (id) document.getElementById(id)?.scrollIntoView();
  }, []);

  return (
    <>
      <DotGrid />
      <SiteHeader />
      <main id="main">
        <Hero isMobile={isMobile} thread={thread} feedRef={g.refs.feedRef} />
        <Projects marked={marked} />
        <WorkHistory marked={marked} />
        <Education marked={marked} />
        <Tools marked={marked} />
        <Contact marked={marked} />
      </main>
      <GuideDock g={g} />
      <Footer />
    </>
  );
}

export default Home;
