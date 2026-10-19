import { useEffect, useRef, useState } from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  AlertCircleIcon,
  CheckmarkCircle02Icon,
  Download04Icon,
  File02Icon,
  Loading03Icon,
} from '@hugeicons/core-free-icons';
import { Button } from '@/components/ui/button';

// the file is served by the Worker from storage (worker/app.ts), so it is not in the repository
export const RESUME_HREF = '/resume.pdf';
const SAVED_NAME = 'Yash_Bakshi_SWE.pdf';

type State = 'idle' | 'downloading' | 'done' | 'failed';

/** What the button says in each state, given the label it carries when nothing is happening. */
export function labelFor(state: State, idle: string): string {
  if (state === 'downloading') return 'Downloading…';
  if (state === 'done') return 'Downloaded';
  if (state === 'failed') return 'Not available, try again';
  return idle;
}

/** Hands the file to the browser's download, as a click on a link would. */
function save(blob: Blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = SAVED_NAME;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

/**
 * A download button for the résumé. It fetches the file itself so it can say "Downloading…" while
 * it waits and say so if the file is missing. Without scripts it is still a plain download link.
 */
export function ResumeButton({ label = 'Download résumé' }: { label?: string }) {
  const [state, setState] = useState<State>('idle');
  const reset = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(reset.current), []);

  async function download(event: React.MouseEvent) {
    // a click with a modifier (a new tab, say) keeps the browser's own behaviour
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
    event.preventDefault();
    if (state === 'downloading') return;
    setState('downloading');
    try {
      const res = await fetch(RESUME_HREF);
      if (!res.ok) throw new Error(`status ${res.status}`);
      save(await res.blob());
      setState('done');
    } catch {
      setState('failed');
    }
    clearTimeout(reset.current);
    reset.current = setTimeout(() => setState('idle'), 3000);
  }

  const icon =
    state === 'downloading'
      ? Loading03Icon
      : state === 'done'
        ? CheckmarkCircle02Icon
        : state === 'failed'
          ? AlertCircleIcon
          : File02Icon;
  return (
    <Button asChild variant="outline" size="lg">
      <a
        href={RESUME_HREF}
        download={SAVED_NAME}
        onClick={download}
        aria-busy={state === 'downloading'}
      >
        <HugeiconsIcon
          aria-hidden
          icon={icon}
          size={18}
          className={state === 'downloading' ? 'motion-safe:animate-spin' : undefined}
        />
        <span aria-live="polite">{labelFor(state, label)}</span>
        {state === 'idle' && <HugeiconsIcon aria-hidden icon={Download04Icon} size={18} />}
      </a>
    </Button>
  );
}
