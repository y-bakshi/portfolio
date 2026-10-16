import type { Diagram } from '../../content/diagrams/types';
import { boxCorners, fitProjection, iso, type Projection } from '../iso/vendor/kit';
import { layoutOf } from './layout';
import type { Layout } from './types';

/** The drawing is always this wide; its height follows the shape of the line so no figure is mostly empty. */
export const VIEW_WIDTH = 560;
export const AZIMUTH = 58;
export const ELEVATION = 30;
const PAD = 14;
const TALLEST = 64;

export type View = { width: number; height: number };

/** The size of a diagram's drawing and the camera that fits it. Cheap: nothing is drawn. */
export function viewOf(
  diagram: Diagram,
  layout: Layout = layoutOf(diagram),
): { view: View; P: Projection } {
  const points = boxCorners(layout.bench, -20, TALLEST);
  // how tall the drawing needs to be for this shape, at the width it always has
  const flat = points.map((p) =>
    iso(p, { origin: [0, 0], scale: 1, azimuth: AZIMUTH, elevation: ELEVATION }),
  );
  const xs = flat.map((p) => p[0]);
  const ys = flat.map((p) => p[1]);
  const shape = (Math.max(...ys) - Math.min(...ys)) / (Math.max(...xs) - Math.min(...xs));
  const height = Math.round(Math.min(460, Math.max(240, (VIEW_WIDTH - PAD * 2) * shape + PAD * 2)));
  const view = { width: VIEW_WIDTH, height };
  const P = fitProjection(points, view.width, view.height, {
    pad: PAD,
    azimuth: AZIMUTH,
    elevation: ELEVATION,
  });
  return { view, P };
}
