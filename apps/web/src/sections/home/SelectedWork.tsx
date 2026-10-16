import { HugeiconsIcon } from '@hugeicons/react';
import { ArrowRight02Icon } from '@hugeicons/core-free-icons';
import { ProjectCard } from '@/components/ProjectCard';
import { projects } from '../../content';
import { useGuideContext } from '../../Guide';
import { Container } from '../../layout/Container';

const featured = projects.filter((p) => p.featured);

/** The four strongest projects, and a link to all of them. */
export function SelectedWork() {
  const { marked } = useGuideContext();
  return (
    <Container as="section" id="work" aria-labelledby="work-title" className="pt-12 pb-4 md:pt-16">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <h2 id="work-title" className="display text-[clamp(2.2rem,4.5vw,3.6rem)]">
          Selected engineering work
        </h2>
        <a
          href="/projects/"
          className="inline-flex items-center gap-2 font-semibold text-action underline-offset-4 hover:underline"
        >
          See all projects
          <HugeiconsIcon icon={ArrowRight02Icon} size={18} />
        </a>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        {featured.map((p) => (
          <ProjectCard key={p.id} p={p} marked={marked} />
        ))}
      </div>
    </Container>
  );
}
