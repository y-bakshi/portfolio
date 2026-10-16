import { blend } from './blend';
import { sample } from './engine';
import { blink, drift, moods, type Mood } from './moods';

const names = Object.keys(moods) as Mood[];

describe('the avatar engine', () => {
  it.each(names)('draws the %s mood as a finite, closed outline with two eyes', (name) => {
    for (const t of [0, 0.7, 3.1, 12.5]) {
      const face = sample(moods[name], t);
      expect(face.body).not.toMatch(/NaN|Infinity|undefined/);
      expect(face.body.startsWith('M')).toBe(true);
      expect(face.body.endsWith('Z')).toBe(true);
      expect(face.eyes).toHaveLength(2);
      for (const e of face.eyes)
        for (const v of Object.values(e)) expect(Number.isFinite(v)).toBe(true);
    }
  });

  it('is a pure function of time: the same time always draws the same face', () => {
    expect(sample(moods.thinking, 4.2)).toEqual(sample(moods.thinking, 4.2));
  });

  it('draws the moods differently from each other', () => {
    const faces = names.map((n) => sample(moods[n], 2).body);
    expect(new Set(faces).size).toBe(names.length);
  });

  it('keeps the eyes apart, one each side, and shuts them to a line', () => {
    const open = sample(moods.idle, 0).eyes;
    expect(open[0].cx).toBeLessThan(0);
    expect(open[1].cx).toBeGreaterThan(0);
    const shut = sample({ ...moods.idle, eyes: 0 }, 0).eyes;
    expect(shut[0].ry).toBeLessThan(open[0].ry / 4);
    expect(shut[0].ry).toBeGreaterThan(0);
  });

  it('keeps the body inside its box in every mood', () => {
    for (const name of names) {
      const nums = [...sample(moods[name], 1.3).body.matchAll(/-?\d+\.?\d*/g)].map((m) =>
        Math.abs(Number(m[0])),
      );
      expect(Math.max(...nums)).toBeLessThan(50);
    }
  });
});

describe('easing between moods', () => {
  it('moves toward the target without ever passing it', () => {
    let p = { ...moods.idle };
    let last = Math.abs(moods.thinking.lobe3 - p.lobe3);
    for (let i = 0; i < 200; i++) {
      p = blend(p, moods.thinking, 1 / 60, 0.18);
      const gap = moods.thinking.lobe3 - p.lobe3;
      expect(gap).toBeGreaterThanOrEqual(0);
      expect(gap).toBeLessThanOrEqual(last);
      last = gap;
    }
    expect(p.lobe3).toBe(moods.thinking.lobe3);
  });
});

describe('the blink and the drift', () => {
  it('blinks briefly and rarely, and the eyes wander only a little', () => {
    const shut = Array.from({ length: 1000 }, (_, i) => blink(i * 0.01)).filter((v) => v > 0.05);
    expect(shut.length).toBeGreaterThan(0);
    expect(shut.length).toBeLessThan(120);
    for (let t = 0; t < 60; t += 0.5) {
      expect(Math.abs(drift(t).x)).toBeLessThanOrEqual(0.5);
      expect(Math.abs(drift(t).y)).toBeLessThanOrEqual(0.2);
    }
  });
});
