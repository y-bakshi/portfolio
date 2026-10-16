import logos from './tech-logos.json';

const slugs: Record<string, string> = logos;

/** The brand mark for a technology, or nothing when there is none. Decorative: the name is always written beside it. */
export function TechLogo({ name, className }: { name: string; className?: string }) {
  const slug = slugs[name];
  if (!slug) return null;
  return (
    <img
      src={`/logos/tech/${slug}.svg`}
      alt=""
      width={20}
      height={20}
      loading="lazy"
      decoding="async"
      className={`${className ?? ''} object-contain`}
    />
  );
}
