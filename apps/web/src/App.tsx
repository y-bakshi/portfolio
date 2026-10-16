import { useCallback, useState } from 'react';
import { PageFrame } from './layout/PageFrame';
import { useIsMobile } from './Guide/useViewport';
import { features } from './layout/features';
import { ExperienceStrip } from './sections/home/ExperienceStrip';
import { Hero } from './sections/home/Hero';
import { ExperienceSection } from './sections/home/ExperienceSection';
import { SelectedWork } from './sections/home/SelectedWork';
import { StackMarquee } from './sections/home/StackMarquee';

/** The home page. A restored chat waits for the portrait to form, so the page loads in order. */
export function Home() {
  const [formed, setFormed] = useState(false);
  const onFormed = useCallback(() => setFormed(true), []);
  const isMobile = useIsMobile();
  return (
    <PageFrame current="home" portraitFormed={formed}>
      <Hero isMobile={isMobile} onFormed={onFormed} />
      {features.techStrip && (
        <>
          <StackMarquee />
          <ExperienceStrip />
        </>
      )}
      {features.selectedWork && <SelectedWork />}
      <ExperienceSection />
    </PageFrame>
  );
}

export default Home;
