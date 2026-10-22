import { interpolate } from "remotion";
import edlJson from "./data/edl.json";
import scenesJson from "./data/scenes.json";
import { camMoves, screenKeys, splits } from "./plan";
import { EASE } from "./theme";

export type Clip = { out: number; in: number; dur: number };
export const edl: Clip[] = edlJson as Clip[];
export const TOTAL = edl.length ? edl[edl.length - 1].out + edl[edl.length - 1].dur : 10;

type Scene = { start: number; end: number; kind: "head" | "screen" };
const scenes = scenesJson as Scene[];

export const sceneAt = (rawT: number): Scene =>
  scenes.find((s) => rawT >= s.start && rawT < s.end) ?? { start: 0, end: 1e9, kind: "head" };

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/** 0..1 weight of a range [a, b] with eased ramps of `ramp` seconds on both sides. */
const rangeWeight = (t: number, a: number, b: number, ramp: number) =>
  Math.min(
    interpolate(t, [a - ramp, a], [0, 1], { ...clamp, easing: EASE.inOut }),
    interpolate(t, [b, b + ramp], [1, 0], { ...clamp, easing: EASE.inOut }),
  );

const BASE = { zoom: 1.08, ox: 1000, oy: 430 };

export const headCam = (t: number) => {
  // Slow breathing push so static stretches never feel frozen.
  let zoom = BASE.zoom + 0.025 * (0.5 - 0.5 * Math.cos((t / 24) * Math.PI * 2));
  let ox = BASE.ox;
  let oy = BASE.oy;
  for (const m of camMoves) {
    const w = rangeWeight(t, m.a, m.b, m.ramp ?? 0.6);
    if (w > 0) {
      zoom = zoom + (m.zoom - zoom) * w;
      ox = ox + ((m.ox ?? BASE.ox) - ox) * w;
      oy = oy + ((m.oy ?? BASE.oy) - oy) * w;
    }
  }
  return { zoom, ox, oy };
};

const FULL: [number, number, number, number] = [0, 0, 1440, 900];

export const screenCam = (t: number) => {
  let [x, y, w, h] = FULL;
  let dim = 0;
  let hl: [number, number, number, number] | undefined;
  for (const k of screenKeys) {
    const wt = rangeWeight(t, k.a, k.b, k.ramp ?? 0.7);
    if (wt > 0) {
      const [rx, ry, rw, rh] = k.rect ?? FULL;
      x += (rx - x) * wt;
      y += (ry - y) * wt;
      w += (rw - w) * wt;
      h += (rh - h) * wt;
      if (k.hl) {
        hl = k.hl;
        dim = Math.max(dim, wt);
      }
    }
  }
  return { x, y, w, h, dim, hl };
};

export const splitAt = (t: number) => {
  let v = 0;
  for (const s of splits) v = Math.max(v, rangeWeight(t, s.a, s.b, 0.55));
  return v;
};

export const rawAtOut = (t: number) => {
  const c = edl.find((x) => t >= x.out && t < x.out + x.dur) ?? edl[edl.length - 1];
  return c.in + (t - c.out);
};
export const sceneAtOut = (t: number) => sceneAt(rawAtOut(t));
