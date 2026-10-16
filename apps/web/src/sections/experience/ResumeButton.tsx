import { HugeiconsIcon } from '@hugeicons/react';
import { Download04Icon, File02Icon } from '@hugeicons/core-free-icons';
import { Button } from '@/components/ui/button';

// the résumé file lives in public/; replace it there to update the download
export const RESUME_HREF = '/Yash_Bakshi_Resume.pdf';

/** A download button for the résumé. */
export function ResumeButton({ label = 'Download résumé' }: { label?: string }) {
  return (
    <Button asChild variant="outline" size="lg">
      <a href={RESUME_HREF} download>
        <HugeiconsIcon aria-hidden icon={File02Icon} size={18} />
        {label}
        <HugeiconsIcon aria-hidden icon={Download04Icon} size={18} />
      </a>
    </Button>
  );
}
