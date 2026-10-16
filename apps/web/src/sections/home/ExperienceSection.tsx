import { Container } from '../../layout/Container';
import { EducationCards } from '../experience/EducationCards';
import { Timeline } from '../experience/Timeline';

/** The work history and the degrees, shown on the home page under the first screen. */
export function ExperienceSection() {
  return (
    <Container
      as="section"
      id="experience"
      aria-labelledby="experience-title"
      className="pt-12 pb-6 md:pt-16"
    >
      <h2 id="experience-title" className="display mb-8 text-[clamp(2.2rem,4.5vw,3.6rem)]">
        Engineering experience
      </h2>
      <Timeline />
      <EducationCards />
    </Container>
  );
}
