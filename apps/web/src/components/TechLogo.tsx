import { techLogos } from './techLogos';

/** The brand mark for a technology, or nothing when there is none. Decorative: the name is always written beside it. */
export function TechLogo({ name, className }: { name: string; className?: string }) {
  const Logo = techLogos[name];
  if (!Logo) return null;
  return <Logo className={className} aria-hidden="true" focusable="false" />;
}
