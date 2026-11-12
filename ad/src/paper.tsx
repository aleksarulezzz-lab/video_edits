import React from "react";
import { C, SERIF } from "./theme";

/** Paper-collage helpers: torn edges, paper grain, stepped "stop-motion" jitter at ~12 fps. */

// deterministic pseudo-random
export const rnd = (seed: number) => {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

/** polygon clip-path with torn edges (percent coordinates) */
export const torn = (seed: number, amp = 1.2, n = 26, edges = "tblr") => {
  const pts: string[] = [];
  const j = (k: number) => (rnd(seed + k) - 0.5) * 2 * amp;
  for (let i = 0; i <= n; i++) pts.push(`${(100 * i) / n}% ${edges.includes("t") ? Math.max(0, amp + j(i)) : 0}%`);
  for (let i = 0; i <= n; i++) pts.push(`${edges.includes("r") ? 100 - Math.max(0, amp + j(100 + i)) : 100}% ${(100 * i) / n}%`);
  for (let i = n; i >= 0; i--) pts.push(`${(100 * i) / n}% ${edges.includes("b") ? 100 - Math.max(0, amp + j(200 + i)) : 100}%`);
  for (let i = n; i >= 0; i--) pts.push(`${edges.includes("l") ? Math.max(0, amp + j(300 + i)) : 0}% ${(100 * i) / n}%`);
  return `polygon(${pts.join(",")})`;
};

/** stop-motion step: the same value is held for 2-3 frames (12-15 fps feel) */
export const step = (frame: number, every = 2.5) => Math.floor(frame / every);
export const jitter = (frame: number, seed: number, px = 2.2, deg = 0.6) => {
  const s = step(frame) + seed * 13;
  return `translate(${(rnd(s) - 0.5) * px}px, ${(rnd(s + 7) - 0.5) * px}px) rotate(${(rnd(s + 3) - 0.5) * deg}deg)`;
};

/** grain + fibres over any paper surface */
export const Grain: React.FC<{ opacity?: number; seed?: number }> = ({ opacity = 0.35, seed = 1 }) => (
  <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", mixBlendMode: "multiply", opacity, pointerEvents: "none" }}>
    <filter id={`g${seed}`}>
      <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={3} seed={seed} />
      <feColorMatrix values="0 0 0 0 0.45  0 0 0 0 0.38  0 0 0 0 0.3  0 0 0 0.55 0" />
    </filter>
    <rect width="100%" height="100%" filter={`url(#g${seed})`} />
  </svg>
);

/** a sheet of paper with torn edges, grain and a soft drop shadow */
export const Sheet: React.FC<{ w: number; h: number; color?: string; seed?: number; style?: React.CSSProperties; children?: React.ReactNode; amp?: number }> = ({
  w, h, color = C.cream, seed = 1, style, children, amp = 1.6,
}) => (
  <div style={{ position: "absolute", width: w, height: h, filter: "drop-shadow(0 10px 14px rgba(20,20,30,0.35))", ...style }}>
    <div style={{ position: "absolute", inset: 0, background: color, clipPath: torn(seed, amp) }}>
      <Grain seed={seed} opacity={0.4} />
      {children}
    </div>
  </div>
);

/** a strip of paper with a short label (yellow / navy / red / white) */
export const Strip: React.FC<{ text: string; bg?: string; fg?: string; size?: number; seed?: number; rot?: number; style?: React.CSSProperties; italic?: boolean }> = ({
  text, bg = C.yellow, fg = C.ink, size = 46, seed = 3, rot = -1.5, style, italic,
}) => (
  <div style={{ display: "inline-block", position: "relative", transform: `rotate(${rot}deg)`, filter: "drop-shadow(0 6px 8px rgba(20,20,30,0.35))", ...style }}>
    <div style={{ background: bg, clipPath: torn(seed, 2.5, 18, "lr"), padding: `${size * 0.22}px ${size * 0.55}px ${size * 0.28}px`, position: "relative" }}>
      <Grain seed={seed} opacity={0.3} />
      <div style={{ position: "relative", fontFamily: SERIF, fontWeight: 700, fontStyle: italic ? "italic" : "normal", fontSize: size, lineHeight: 1.1, color: fg, whiteSpace: "nowrap" }}>{text}</div>
    </div>
  </div>
);

/** the paper background used behind motion inserts */
export const PaperBg: React.FC<{ color?: string; seed?: number }> = ({ color = C.cream, seed = 9 }) => (
  <div style={{ position: "absolute", inset: 0, background: color }}>
    <Grain seed={seed} opacity={0.5} />
    <div style={{ position: "absolute", inset: 0, background: "radial-gradient(120% 90% at 50% 45%, rgba(255,255,255,0) 55%, rgba(60,40,20,0.18) 100%)" }} />
  </div>
);
