import type { RefObject } from 'react';
import { BLEED } from './config';

/**
 * The portrait's canvas. It is laid over a box the size of the picture and reaches BLEED past it on every
 * side, so specks that are pushed off an edge keep going instead of being cut off in a straight line.
 */
export function PortraitCanvas({
  canvasRef,
  width,
  height,
  alt,
}: {
  canvasRef: RefObject<HTMLCanvasElement | null>;
  width: number;
  height: number;
  alt: string;
}) {
  return (
    <div className="relative w-full" style={{ aspectRatio: `${width} / ${height}` }}>
      <canvas
        ref={canvasRef}
        className="absolute block max-w-none touch-pan-y"
        role="img"
        aria-label={alt}
        style={{
          left: -BLEED,
          top: -BLEED,
          width: `calc(100% + ${2 * BLEED}px)`,
          height: `calc(100% + ${2 * BLEED}px)`,
        }}
      />
    </div>
  );
}
