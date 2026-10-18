import { Container } from './layout/Container';
import { PageFrame } from './layout/PageFrame';
import { ProjectList } from './sections/projects/ProjectList';
import { SmallProjects } from './sections/projects/SmallProjects';

/** Every project: the four featured, the rest, and the shared cards for coursework. */
export function AllProjects() {
  return (
    <PageFrame current="projects">
      <Container className="pt-10 pb-6 md:pt-14">
        <h1 className="display text-[clamp(2.8rem,6vw,4.8rem)]">Engineering projects</h1>
        <p className="mt-3 mb-8 max-w-[40rem] text-xl text-muted">
          Backend services, AI applications, and cloud systems.
        </p>
        <ProjectList />
        <SmallProjects />
      </Container>
    </PageFrame>
  );
}

export default AllProjects;
