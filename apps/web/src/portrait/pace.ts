/**
 * Watches how long frames take. Returns how many particles to skip between drawn ones: 1 draws
 * them all, and 2 once frames have run slower than about 25 fps for a while.
 */
export function makePacer() {
  let last = 0;
  let smoothed = 16.7;
  let measured = 0;
  let stride = 1;
  return (now: number) => {
    if (last && now - last < 100) {
      smoothed = smoothed * 0.9 + (now - last) * 0.1;
      if (++measured > 30 && smoothed > 40 && stride === 1) stride = 2;
    }
    last = now;
    return stride;
  };
}
