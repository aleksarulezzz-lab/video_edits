import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { EASE } from "./theme";

/** Seconds since the enclosing <Sequence> started. */
export const useSec = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return frame / fps;
};

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/** 0→1 entrance progress starting at `at`, lasting `dur` seconds. */
export const enter = (t: number, at: number, dur = 0.5, ease = EASE.out) =>
  interpolate(t, [at, at + dur], [0, 1], { ...clamp, easing: ease });

/** 1→0 exit progress: 1 before `at`, 0 after `at + dur`. */
export const exit = (t: number, at: number, dur = 0.35) =>
  interpolate(t, [at, at + dur], [1, 0], { ...clamp, easing: EASE.in });

/** Combined visibility for an element that lives from `a` to `b` (seconds). */
export const life = (t: number, a: number, b: number, inDur = 0.5, outDur = 0.35) =>
  Math.min(enter(t, a, inDur), exit(t, b - outDur, outDur));

export const lerp = (p: number, a: number, b: number) => a + (b - a) * p;
