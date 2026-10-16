import { diagrams } from '../content/diagrams';
import { projects } from '../content';
import { DiagramFigure } from './DiagramFigure';

/** The animated figure for a project, or nothing for a project that has none yet. */
export function ProjectDiagram({ id, compact = false }: { id: string; compact?: boolean }) {
  const diagram = diagrams[id];
  const project = projects.find((p) => p.id === id);
  if (!diagram || !project) return null;
  return <DiagramFigure diagram={diagram} name={project.name} compact={compact} />;
}
