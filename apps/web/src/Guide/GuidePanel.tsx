import { cn } from '@/lib/cn';
import { GuideChat } from './GuideChat';
import { useGuideContext } from './GuideContext';

/**
 * The chat panel: a right-hand column on wide screens. The page behind it stays usable so a "Show on
 * the page" button can scroll to what an answer cites. Phones get a chat page of their own instead.
 */
export function GuidePanel() {
  const g = useGuideContext();
  return (
    <aside
      id="guide-panel"
      aria-label="Guide chat"
      onKeyDown={g.onDockKey}
      inert={!g.open}
      className={cn(
        'fixed z-50 flex flex-col bg-ground shadow-lift transition-[translate,opacity] duration-250 ease-out motion-reduce:duration-150',
        'inset-x-0 top-(--vvt,0px) h-(--vvh,100dvh)',
        'md:inset-y-0 md:right-0 md:left-auto md:top-0 md:h-auto md:w-[26rem] md:border-l md:border-line',
        g.open
          ? 'translate-y-0 opacity-100 md:translate-x-0'
          : 'pointer-events-none translate-y-8 opacity-0 md:translate-x-8 md:translate-y-0 motion-reduce:translate-x-0! motion-reduce:translate-y-0!',
      )}
    >
      <GuideChat variant="panel" onLeave={g.closeDock} />
    </aside>
  );
}
