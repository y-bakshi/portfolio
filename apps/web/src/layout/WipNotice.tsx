/** A slim note at the very top that says the site is unfinished. Remove it at launch. */
export function WipNotice() {
  return (
    <div role="note" className="bg-(--wip) px-4 py-1 text-center text-xs font-medium text-ink">
      Work in progress: pages and answers are still being written.
    </div>
  );
}
