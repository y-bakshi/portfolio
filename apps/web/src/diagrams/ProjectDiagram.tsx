/** The animated figure for a project. Replaced by the isometric figures; this keeps the layout slot. */
export function ProjectDiagram({ id }: { id: string; compact?: boolean }) {
  return <div data-diagram={id} className="aspect-[5/4] w-full rounded-xl bg-panel/60" />;
}
