import { Container } from './layout/Container';
import { PageFrame } from './layout/PageFrame';
import { EducationCards } from './sections/experience/EducationCards';
import { ResumeButton } from './sections/experience/ResumeButton';
import { Timeline } from './sections/experience/Timeline';

/** Work history and education. */
export function ExperiencePage() {
  return (
    <PageFrame current="experience">
      <Container className="pt-10 pb-6 md:pt-14">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-x-8 gap-y-5">
          <div>
            <h1 className="display text-[clamp(2.8rem,6vw,4.8rem)]">Engineering experience</h1>
            <p className="mt-3 max-w-[40rem] text-xl text-muted">
              Backend delivery, platform work, and technical leadership.
            </p>
          </div>
          <ResumeButton />
        </div>
        <Timeline />
        <EducationCards />
      </Container>
    </PageFrame>
  );
}

export default ExperiencePage;
