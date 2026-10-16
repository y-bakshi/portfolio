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
      for (const e of [...face.eyes, face.mouth])
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

  it('shows a mouth only when the guide is talking or thinking, and opens and shuts it as it talks', () => {
    expect(sample(moods.idle, 1).mouth.rx).toBe(0);
    expect(sample(moods.listening, 1).mouth.rx).toBe(0);
    expect(sample(moods.thinking, 1).mouth.rx).toBeGreaterThan(0);
    const heights = Array.from(
      { length: 40 },
      (_, i) => sample(moods.answering, i * 0.05).mouth.ry,
    );
    expect(Math.max(...heights)).toBeGreaterThan(3);
    expect(Math.min(...heights)).toBeLessThan(1);
  });

  it('makes the moods plainly different at the size they are drawn', () => {
    // about 36 pixels across for a 100 unit drawing: a gap of 3 units is about a pixel
    const eyes = (m: Mood) => sample(moods[m], 0).eyes[0];
    expect(Math.abs(eyes('thinking').cy - eyes('idle').cy)).toBeGreaterThan(3);
    expect(Math.abs(eyes('listening').ry - eyes('idle').ry)).toBeGreaterThan(1);
    // while it thinks the eyes sweep across, so look at how far they travel
    const across = Array.from({ length: 60 }, (_, i) => sample(moods.thinking, i * 0.1).eyes[0].cx);
    expect(Math.max(...across) - Math.min(...across)).toBeGreaterThan(6);
  });

  it('shuts the eyes and settles low when it sleeps', () => {
    const asleep = sample(moods.sleeping, 3);
    const awake = sample(moods.idle, 3);
    expect(asleep.eyes[0].ry).toBeLessThan(awake.eyes[0].ry / 4);
    expect(asleep.mouth.rx).toBe(0);
  });

  it('winks with one eye only', () => {
    const [left, right] = sample(moods.wink, 1).eyes;
    expect(right.ry).toBeLessThan(left.ry / 4);
    const [l, r] = sample(moods.idle, 1).eyes;
    expect(r.ry).toBeCloseTo(l.ry, 5);
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
