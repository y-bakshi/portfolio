import { MorphIcon } from 'morphicons/react';

/** A Hugeicons icon, as the data the Hugeicons package gives (a list of tagged shapes). */
export type GlyphData = readonly (readonly [string, Record<string, string | number>])[];

/**
 * An icon that morphs into another when `icon` changes, with a spring. The icons come from Hugeicons, whose
 * data has the same shape Morphicons reads. Under reduced motion it swaps at once.
 */
export function MorphGlyph({ icon, size = 24 }: { icon: GlyphData; size?: number }) {
  return (
    <MorphIcon
      icon={icon as never}
      size={size}
      strokeWidth={1.5}
      spring="smooth"
      reducedMotion="user"
      className="shrink-0"
    />
  );
}
