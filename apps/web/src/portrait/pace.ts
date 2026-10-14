/**
 * Watches how long frames take. Returns how many particles to skip between drawn ones: 1 draws them
 * all, 2 once frames run slower than about 30 fps for a short while, and 3 if they are still slower
 * than about 20 fps. The animation never stays on a device that cannot keep up.
 */
export function makePacer() {
  let last = 0;
  let smoothed = 16.7;
  let measured = 0;
  let stride = 1;
  return (now: number) => {
    if (last && now - last < 100) {
      smoothed = smoothed * 0.85 + (now - last) * 0.15;
      measured++;
      if (stride === 1 && measured > 12 && smoothed > 34) {
        stride = 2;
        measured = 0;
        smoothed = 20; // measure again with the lighter load
      } else if (stride === 2 && measured > 20 && smoothed > 48) {
        stride = 3;
        measured = 0;
        smoothed = 20;
      }
    }
    last = now;
    return stride;
  };
}
