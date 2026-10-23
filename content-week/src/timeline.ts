import { interpolate } from "remotion";
import edlJson from "./data/edl.json";
import insertsJson from "./data/inserts.json";
import timemapJson from "./data/timemap.json";
import autocutsJson from "./data/autocuts.json";
import scenesJson from "./data/scenes.json";
import { camMoves, screenKeys, splits } from "./plan";
import { EASE } from "./theme";

export type Clip = { out: number; in: number; dur: number };
export const edl: Clip[] = edlJson as Clip[];
export type Insert = { out: number; dur: number; kind: string; props?: Record<string, unknown> };
export const INSERTS: Insert[] = insertsJson as Insert[];
export const TOTAL = Math.max(
  edl.length ? edl[edl.length - 1].out + edl[edl.length - 1].dur : 10,
  ...INSERTS.map((i) => i.out + i.dur),
);

/**
 * The plan is authored in the author's-cut timeline ("edit"); cuts, the restored word and
 * inserted cards move everything after them. timemap rows: [edit0, out0, edit1, out1].
 */
const TM = timemapJson as [number, number, number, number][];
export const T = (te: number) => {
  for (const [e0, o0, e1] of TM) if (e1 > e0 && te >= e0 && te < e1) return o0 + (te - e0);
  const next = TM.find(([e0]) => e0 >= te);
  return next ? next[1] : TOTAL;
};
export const invT = (to: number) => {
  for (const [e0, o0, e1, o1] of TM) {
    if (to >= o0 && to < o1) return e1 > e0 ? e0 + (to - o0) : e0;
  }
  return TM.length ? TM[TM.length - 1][2] : to;
};

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
const AUTOCUTS = autocutsJson as [number, number][];

export const headCam = (t: number) => {
  // Slow breathing push so static stretches never feel frozen.
  let zoom = BASE.zoom + 0.025 * (0.5 - 0.5 * Math.cos((t / 24) * Math.PI * 2));
  // second "camera": a tighter framing cut in on sentence pauses
  if (AUTOCUTS.some(([a, b]) => t >= a && t < b)) zoom += 0.09;
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

/** Output-time ranges where a screen recording is on, merged across cuts (inserted cards break them). */
const SCREEN_RUNS: [number, number][] = (() => {
  const runs: [number, number][] = [];
  for (const c of edl) {
    for (const sc of scenes) {
      if (sc.kind !== "screen") continue;
      const lo = Math.max(c.in, sc.start);
      const hi = Math.min(c.in + c.dur, sc.end);
      if (hi <= lo) continue;
      const a = c.out + (lo - c.in);
      const b = c.out + (hi - c.in);
      const last = runs[runs.length - 1];
      if (last && Math.abs(last[1] - a) < 0.05) last[1] = b;
      else runs.push([a, b]);
    }
  }
  return runs;
})();
/** Start of the continuous screen-recording stretch that contains output time `to`. */
export const screenRunStart = (to: number) => (SCREEN_RUNS.find(([a, b]) => to >= a - 0.01 && to < b) ?? [to])[0];
