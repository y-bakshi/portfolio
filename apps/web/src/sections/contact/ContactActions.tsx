import { useState } from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  ArrowUpRight01Icon,
  Calendar03Icon,
  Copy01Icon,
  GithubIcon,
  Linkedin01Icon,
  Mail01Icon,
  Tick02Icon,
} from '@hugeicons/core-free-icons';
import { Button } from '@/components/ui/button';
import { BOOKING_URL, EMAILS, GITHUB_URL, LINKEDIN_URL } from '../../layout/nav';
import { useGuideContext } from '../../Guide';
import { cn } from '@/lib/cn';

/** The ways to reach Yash: email with a copy button, the school address, and his profiles. */
export function ContactLinks() {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(EMAILS.work);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // the address is also a mail link, so nothing is lost when copying is blocked
    }
  };
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <Button asChild size="lg">
          <a href={`mailto:${EMAILS.work}`}>
            <HugeiconsIcon icon={Mail01Icon} size={20} />
            {EMAILS.work}
          </a>
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={() => void copy()}
          aria-label={copied ? 'Email address copied' : 'Copy email address'}
        >
          <HugeiconsIcon icon={copied ? Tick02Icon : Copy01Icon} size={18} />
        </Button>
      </div>
      <p className="text-muted">
        University email:{' '}
        <a
          className="underline underline-offset-4 hover:text-action"
          href={`mailto:${EMAILS.university}`}
        >
          {EMAILS.university}
        </a>
      </p>
      <ul className="flex flex-wrap gap-6 font-semibold">
        <li>
          <a
            href={LINKEDIN_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 underline-offset-4 hover:text-action hover:underline"
          >
            <HugeiconsIcon icon={Linkedin01Icon} size={20} />
            LinkedIn
            <HugeiconsIcon icon={ArrowUpRight01Icon} size={16} />
            <span className="sr-only">(opens in a new tab)</span>
          </a>
        </li>
        <li>
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 underline-offset-4 hover:text-action hover:underline"
          >
            <HugeiconsIcon icon={GithubIcon} size={20} />
            GitHub
            <HugeiconsIcon icon={ArrowUpRight01Icon} size={16} />
            <span className="sr-only">(opens in a new tab)</span>
          </a>
        </li>
      </ul>
    </div>
  );
}

/** The booking card. */
export function BookingCard() {
  const { marked } = useGuideContext();
  return (
    <section
      id="contact"
      tabIndex={-1}
      aria-labelledby="booking-title"
      className={cn(
        'space-y-4 rounded-2xl border border-line/70 bg-panel p-7 shadow-soft',
        'data-marked:ring-2 data-marked:ring-mark',
      )}
      data-marked={marked === 'contact' || undefined}
    >
      <h2 id="booking-title" className="display text-3xl">
        Prefer a conversation?
      </h2>
      <p className="text-lg">Book a 30 minute call.</p>
      <Button asChild size="lg">
        <a href={BOOKING_URL} target="_blank" rel="noopener noreferrer">
          <HugeiconsIcon icon={Calendar03Icon} size={20} />
          Choose a time
          <span className="sr-only">(opens in a new tab)</span>
        </a>
      </Button>
      <p className="text-sm text-muted">Scheduling opens in a new tab.</p>
    </section>
  );
}
