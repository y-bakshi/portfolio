import type { Ref } from 'react';
import type { Scene } from './scene/buildScene';

/** The drawing itself: every part of the scene, in painting order. */
export function SceneSvg({
  scene,
  label,
  svgRef,
}: {
  scene: Scene;
  label: string;
  svgRef?: Ref<SVGSVGElement>;
}) {
  return (
    <svg
      ref={svgRef}
      className="iso-svg"
      viewBox={`0 0 ${scene.view.width} ${scene.view.height}`}
      role="img"
      aria-label={label}
      focusable="false"
    >
      {scene.items.map((item) => (
        <g key={item.key}>{item.node}</g>
      ))}
    </svg>
  );
}
