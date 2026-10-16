import { makePacer } from './pace';

/** Feeds the pacer frames of a fixed length and returns the stride it ends on. */
function run(frameMs: number, frames: number, stepAfter?: (stride: number) => number) {
  const pace = makePacer();
  let now = 1000;
  let stride = 1;
  for (let i = 0; i < frames; i++) {
    stride = pace(now);
    now += stepAfter ? stepAfter(stride) : frameMs;
  }
  return stride;
}

describe('the frame pacer', () => {
  it('draws every particle while frames are fast', () => {
    expect(run(16.7, 200)).toBe(1);
  });

  it('draws every other particle once frames run slower than about 30 fps', () => {
    expect(run(42, 60)).toBe(2);
  });

  it('draws one in three if frames stay slow even with half the load', () => {
    expect(run(70, 120)).toBe(3);
  });

  it('settles on two if halving the load brings frames back to a smooth rate', () => {
    // frames take 42 ms at stride 1 and 24 ms at stride 2
    expect(run(0, 200, (stride) => (stride === 1 ? 42 : 24))).toBe(2);
  });

  it('ignores a single long pause such as a hidden tab', () => {
    const pace = makePacer();
    let now = 1000;
    for (let i = 0; i < 20; i++) {
      pace(now);
      now += 16.7;
    }
    now += 5000;
    expect(pace(now)).toBe(1);
  });
});
