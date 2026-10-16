import { HugeiconsIcon } from '@hugeicons/react';
import { ArrowLeft02Icon, ArrowRight02Icon } from '@hugeicons/core-free-icons';
import { Button } from '@/components/ui/button';
import { projects } from './content';
import { testpilotCase as study } from './content/testpilot-case';
import { ProjectDiagram } from './diagrams/ProjectDiagram';
import { Container } from './layout/Container';
import { PageFrame } from './layout/PageFrame';
import { CaseFacts } from './sections/case/CaseFacts';
import { CaseSection } from './sections/case/CaseSection';
import { MeasuredResults } from './sections/case/MeasuredResults';

const project = projects.find((p) => p.id === 'testpilot')!;

/** The TestPilot case study page. */
export function CaseStudy() {
  return (
    <PageFrame current="projects">
      <Container className="pt-8 md:pt-10">
        <nav aria-label="Breadcrumb" className="text-sm text-muted">
          <a href="/projects/" className="underline-offset-4 hover:text-action hover:underline">
            Projects
          </a>
          <span aria-hidden="true"> / </span>
          <span aria-current="page">{project.name}</span>
        </nav>
        <h1 className="display mt-4 text-[clamp(3rem,8vw,6rem)]">{project.name}</h1>
        <p className="mt-3 max-w-[44rem] text-xl text-ink">{project.line}</p>

        <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_20rem]">
          <article className="min-w-0">
            <CaseSection title="The problem">
              {study.problem.map((t) => (
                <p key={t} className="max-w-[44rem] text-lg">
                  {t}
                </p>
              ))}
            </CaseSection>
            <CaseSection title="How it works">
              <p className="max-w-[44rem] text-lg">{project.detail}</p>
              <ProjectDiagram id={project.id} />
            </CaseSection>
            <CaseSection title="What I built">
              {study.built.map((t) => (
                <p key={t} className="max-w-[44rem] text-lg">
                  {t}
                </p>
              ))}
            </CaseSection>
            <CaseSection title="Measured results">
              <MeasuredResults />
            </CaseSection>
          </article>
          <CaseFacts project={project} />
        </div>

        <div className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-line/70 pt-6">
          <Button asChild variant="outline">
            <a href="/projects/">
              <HugeiconsIcon icon={ArrowLeft02Icon} size={18} />
              All projects
            </a>
          </Button>
          <Button asChild>
            <a href="/contact/">
              Contact Yash
              <HugeiconsIcon icon={ArrowRight02Icon} size={18} />
            </a>
          </Button>
        </div>
      </Container>
    </PageFrame>
  );
}

export default CaseStudy;
