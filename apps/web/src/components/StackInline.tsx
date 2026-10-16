/** A project's technologies as one line of plain text, with a dot between each. */
export function StackInline({ name, stack }: { name: string; stack: string[] }) {
  return (
    <ul
      aria-label={`${name} technologies`}
      className="flex flex-wrap gap-x-2 text-[0.95rem] text-action"
    >
      {stack.map((s, i) => (
        <li key={s} className="flex gap-2">
          {i > 0 && (
            <span aria-hidden="true" className="text-ink/60">
              •
            </span>
          )}
          {s}
        </li>
      ))}
    </ul>
  );
}
