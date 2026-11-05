import React from "react";
import { AbsoluteFill, Audio, Img, OffthreadVideo, Sequence, interpolate, staticFile, useCurrentFrame } from "remotion";
import { C, EASE, FONT, FPS } from "../theme";
import { FOCUS, LABEL } from "../Main";
import r1 from "./data/reel_1.json";
import r2 from "./data/reel_2.json";
import r3 from "./data/reel_3.json";
import r4 from "./data/reel_4.json";
import r5 from "./data/reel_5.json";
import r6 from "./data/reel_6.json";
import r7 from "./data/reel_7.json";

/**
 * Vertical 1080×1920 Reels cut from «Тренажёр по китайскому»: title on top, the author in the middle,
 * subtitles in dark-blue pills, screencasts in neon-blue windows, the son's clips full frame,
 * end card pointing to the full video on YouTube and VK Video.
 */
type Word = { w: string; s: number; e: number; hl: boolean };
type Page = { start: number; end: number; lines: Word[][] };
type Clip = { src: string; in: number; dur: number; out: number };
type Ev = { kind: string; a: number; b: number; [k: string]: unknown };
type ReelData = { n: number; name: string; title: string[]; duration: number; clips: Clip[]; captions: Page[]; events: Ev[] };
export const REELS = [r1, r2, r3, r4, r5, r6, r7] as unknown as ReelData[];
export const END_CARD = 4.0;

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const ease = (t: number, a: number, d = 0.4, e = EASE.out) => interpolate(t, [a, a + d], [0, 1], { ...clamp, easing: e });
const fadeOut = (t: number, b: number, d = 0.3) => interpolate(t, [b - d, b], [1, 0], clamp);
const on = (e: Ev, t: number) => t >= e.a && t < e.b;

// the author's frame: a 1000×1080 crop of the 1920×1080 recording around her, ×1.08
const CROP = { x: 560, w: 1000 };
const S = 1.08;
const FRAME = { y: 430, w: 1080, h: 1080 * S };
const FACE = { x: (1060 - CROP.x) * S, y: 420 * S };

const glass: React.CSSProperties = {
  background: "linear-gradient(135deg, rgba(220,239,251,0.95), rgba(159,211,242,0.85))",
  border: "1.5px solid rgba(255,255,255,0.9)",
  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.95), 0 16px 44px rgba(28,46,68,0.3)",
  borderRadius: 26,
};
const neon = (k = 1) => `0 0 0 3px rgba(92,200,255,${0.9 * k}), 0 0 40px rgba(92,200,255,${0.45 * k}), 0 26px 70px rgba(0,0,0,0.45)`;

const MainClip: React.FC<{ c: Clip; idx: number; n: number }> = ({ c, idx, n }) => {
  const f = useCurrentFrame();
  const vol = (fr: number) => Math.min(1, (fr + 1) / 2, (n - fr) / 2);
  const zoom = (idx % 2 ? 1.1 : 1.0) + 0.02 * Math.min(1, f / Math.max(1, n));
  const src = staticFile("media/main.mp4");
  return (
    <AbsoluteFill style={{ backgroundColor: C.ink }}>
      <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
        <OffthreadVideo src={src} trimBefore={Math.round(c.in * FPS)} muted
          style={{ position: "absolute", left: -1170, top: 0, width: 3413, height: 1920, maxWidth: "none", filter: "blur(40px) brightness(0.55)" }} />
        <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(28,46,68,0.55), rgba(28,46,68,0.1) 40%, rgba(28,46,68,0.6))" }} />
      </div>
      <div style={{ position: "absolute", left: 0, top: FRAME.y, width: FRAME.w, height: FRAME.h, overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, transformOrigin: `${FACE.x}px ${FACE.y}px`, transform: `scale(${zoom})` }}>
          <OffthreadVideo src={src} trimBefore={Math.round(c.in * FPS)} volume={vol}
            style={{ position: "absolute", left: -CROP.x * S, top: 0, width: 1920 * S, height: 1080 * S, maxWidth: "none" }} />
        </div>
        <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: 120, background: "linear-gradient(180deg, rgba(28,46,68,0.45), rgba(28,46,68,0))" }} />
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 160, background: "linear-gradient(0deg, rgba(28,46,68,0.6), rgba(28,46,68,0))" }} />
      </div>
    </AbsoluteFill>
  );
};

/** The son repeating 眼睛 after the trainer: the native vertical clip, with its sound. */
const PronClip: React.FC<{ c: Clip; n: number }> = ({ c, n }) => {
  const f = useCurrentFrame();
  const vol = (fr: number) => 0.62 * Math.min(1, (fr + 1) / 4, (n - fr) / 4);
  const q = ease(f / FPS, 0.4, 0.5);
  return (
    <AbsoluteFill style={{ backgroundColor: C.ink }}>
      <OffthreadVideo src={staticFile("media/pron.mp4")} trimBefore={Math.round(c.in * FPS)} volume={vol} style={{ width: 1080, height: 1920 }} />
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 760, background: "linear-gradient(0deg, rgba(28,46,68,0.85), rgba(28,46,68,0))" }} />
      <div style={{ position: "absolute", left: 0, right: 0, top: 150, display: "flex", justifyContent: "center", opacity: q }}>
        <div style={{ padding: "14px 30px", ...glass, fontFamily: FONT, fontWeight: 800, fontSize: 44, color: C.ink }}>Тренажёр произносит — сын повторяет</div>
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 1300, textAlign: "center", opacity: q, transform: `translateY(${(1 - q) * 30}px)` }}>
        <div style={{ display: "inline-flex", alignItems: "baseline", gap: 26, color: C.white }}>
          <span style={{ fontFamily: "'WenQuanYi Zen Hei', sans-serif", fontSize: 190, lineHeight: 1, textShadow: "0 0 30px rgba(92,200,255,0.7)" }}>眼睛</span>
          <span style={{ fontFamily: FONT, fontWeight: 700, fontSize: 70, color: C.neon }}>yǎn jing</span>
        </div>
        <div style={{ marginTop: 18, fontFamily: FONT, fontWeight: 800, fontSize: 84, color: C.white }}>«глаза»</div>
      </div>
    </AbsoluteFill>
  );
};

/** Screencast of the trainer in a glowing window over the author's frame (her voice continues). */
const ScreenCard: React.FC<{ e: Ev; t: number }> = ({ e, t }) => {
  const R = FOCUS[e.focus as string];
  const p = ease(t, e.a, 0.4) * fadeOut(t, e.b, 0.3);
  const bw = 1000, bh = Math.min(840, (bw * R.h) / R.w);
  const k = Math.max(bw / R.w, bh / R.h) * interpolate(t, [e.a, e.b], [1, 1.05], clamp);
  return (
    <AbsoluteFill style={{ opacity: p }}>
      <AbsoluteFill style={{ background: "rgba(28,46,68,0.55)" }} />
      <div style={{ position: "absolute", left: 40, top: 900 - bh / 2, width: bw, height: bh, borderRadius: 26, overflow: "hidden", background: "#fff", boxShadow: neon(),
        transform: `scale(${0.94 + 0.06 * p})` }}>
          <OffthreadVideo src={staticFile("media/screen.mp4")} trimBefore={Math.round((e.at as number) * FPS)} muted
            style={{ position: "absolute", left: (bw - R.w * k) / 2 - R.x * k, top: (bh - R.h * k) / 2 - R.y * k, width: 1598 * k, height: 1362 * k, maxWidth: "none" }} />
      </div>
      <div style={{ position: "absolute", left: 60, top: 900 + bh / 2 + 18, padding: "10px 22px", borderRadius: 16, background: "rgba(28,46,68,0.9)", color: C.white,
        fontFamily: FONT, fontWeight: 800, fontSize: 36 }}>{LABEL[e.focus as string]}</div>
    </AbsoluteFill>
  );
};

/** B-roll: stock and the son's vertical clips full frame; the plan-of-day still as a window. */
const Broll: React.FC<{ e: Ev }> = ({ e }) => {
  const f = useCurrentFrame();
  const n = (e.b - e.a) * FPS;
  const p = interpolate(f, [0, 6], [0, 1], clamp) * interpolate(f, [n - 6, n], [1, 0], clamp);
  const src = staticFile(e.file as string);
  if (e.mode === "photo") {
    return (
      <AbsoluteFill style={{ opacity: p }}>
        <AbsoluteFill style={{ background: "rgba(28,46,68,0.55)" }} />
        <div style={{ position: "absolute", left: 40, top: 480, width: 1000, height: 815, borderRadius: 26, overflow: "hidden", boxShadow: neon() }}>
          <Img src={src} style={{ width: 1000, height: 815, objectFit: "cover", transform: `scale(${1 + 0.05 * (f / n)})`, transformOrigin: "50% 60%" }} />
        </div>
        <div style={{ position: "absolute", left: 60, top: 1313, padding: "10px 22px", borderRadius: 16, background: "rgba(28,46,68,0.9)", color: C.white, fontFamily: FONT, fontWeight: 800, fontSize: 36 }}>План дня</div>
      </AbsoluteFill>
    );
  }
  const vertical = e.mode === "card";
  return (
    <AbsoluteFill style={{ opacity: p, overflow: "hidden", backgroundColor: C.ink }}>
      <OffthreadVideo src={src} trimBefore={Math.round((e.at as number) * FPS)} muted
        style={vertical ? { width: 1080, height: 1920, transform: `scale(${1.02 + 0.03 * (f / n)})` }
          : { position: "absolute", left: -1166, top: 0, width: 3413, height: 1920, maxWidth: "none", transform: `scale(${1.02 + 0.04 * (f / n)})` }} />
    </AbsoluteFill>
  );
};

/* ---------- text ---------- */
const Title: React.FC<{ lines: string[]; t: number; total: number; hidden: boolean }> = ({ lines, t, total, hidden }) => {
  const a = ease(t, 0.05, 0.45, EASE.pop), b = ease(t, 0.25, 0.45, EASE.pop);
  const vis = (hidden ? 0 : 1) * fadeOut(t, total, 0.3);
  const fs = Math.min(68, 940 / (Math.max(...lines.map((l) => l.length)) * 0.66));
  const box = (txt: string, bg: string, p: number, rot: number) => (
    <div style={{ display: "inline-block", padding: "10px 24px 12px", background: bg, borderRadius: 14, transform: `rotate(${rot}deg) scale(${0.85 + 0.15 * p})`, opacity: p, boxShadow: "0 10px 30px rgba(0,0,0,0.3)" }}>
      <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: fs, lineHeight: 1, color: C.ink, letterSpacing: -0.5 }}>{txt}</div>
    </div>
  );
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: 120, display: "flex", flexDirection: "column", alignItems: "center", gap: 14, opacity: vis }}>
      {box(lines[0], C.white, a, -1.5)}
      {box(lines[1], C.blue, b, 1.2)}
    </div>
  );
};

const Subtitles: React.FC<{ d: ReelData; t: number; top: number }> = ({ d, t, top }) => {
  const p = d.captions.find((c) => t >= c.start && t < c.end);
  if (!p) return null;
  const k = ease(t, p.start, 0.14);
  return (
    <div style={{ position: "absolute", left: 60, right: 60, top, display: "flex", flexDirection: "column", alignItems: "center", gap: 8, opacity: k, transform: `translateY(${(1 - k) * 8}px)` }}>
      {p.lines.map((ln, i) => (
        <div key={i} style={{ padding: "8px 22px 10px", borderRadius: 18, background: "rgba(28,46,68,0.85)", fontFamily: FONT, fontWeight: 800, fontSize: 54, lineHeight: 1.12, textAlign: "center", color: C.white }}>
          {ln.map((w, j) => <span key={j} style={{ color: w.hl ? C.blue : C.white }}>{w.w}{j < ln.length - 1 ? " " : ""}</span>)}
        </div>
      ))}
    </div>
  );
};

const Chip: React.FC<{ text: string; hl?: string[]; t: number; a: number; b: number; y: number }> = ({ text, hl = [], t, a, b, y }) => {
  if (t < a - 0.1 || t > b + 0.4) return null;
  const p = ease(t, a, 0.4, EASE.pop) * fadeOut(t, b + 0.3, 0.3);
  return (
    <div style={{ position: "absolute", left: 50, right: 50, top: y, display: "flex", justifyContent: "center", opacity: p, transform: `translateY(${(1 - p) * 18}px)` }}>
      <div style={{ padding: "16px 28px", ...glass, fontFamily: FONT, fontWeight: 800, fontSize: 48, lineHeight: 1.15, color: C.ink, textAlign: "center" }}>
        {text.split(" ").map((w, i, arr) => <span key={i} style={{ color: hl.includes(w) ? C.accent : C.ink }}>{w}{i < arr.length - 1 ? " " : ""}</span>)}
      </div>
    </div>
  );
};

/* ---------- end card: full video on YouTube and VK Video ---------- */
const YouTubeLogo: React.FC<{ h?: number }> = ({ h = 64 }) => (
  <svg width={h * 1.4} height={h} viewBox="0 0 28 20"><rect width="28" height="20" rx="5.5" fill="#FF0000" /><path d="M11 6v8l7-4z" fill="#fff" /></svg>
);
const VKLogo: React.FC<{ h?: number }> = ({ h = 64 }) => (
  <svg width={h} height={h} viewBox="0 0 48 48">
    <rect width="48" height="48" rx="12" fill="#0077FF" />
    <path d="M25.5 34.6c-10.4 0-16.3-7.1-16.6-19h5.2c.2 8.7 4 12.4 7.1 13.2V15.6h4.9v7.5c3-.3 6.2-3.7 7.2-7.5h4.9c-.8 4.6-4.2 8-6.6 9.4 2.4 1.1 6.3 4.1 7.8 9.6h-5.4c-1.2-3.6-4-6.4-7.9-6.8v6.8h-.6z" fill="#fff" />
  </svg>
);

const EndCard: React.FC<{ t: number }> = ({ t }) => {
  const bg = ease(t, 0, 0.35), head = ease(t, 0.15, 0.45, EASE.pop), phone = ease(t, 0.35, 0.6), shot = ease(t, 0.75, 0.45, EASE.pop);
  const meta = ease(t, 1.05, 0.4), yt = ease(t, 1.35, 0.45, EASE.pop), vk = ease(t, 1.6, 0.45, EASE.pop), handle = ease(t, 1.9, 0.45, EASE.pop);
  const tap = interpolate(t, [2.5, 2.75, 3.0], [0, 1, 0], clamp);
  const pill = (p: number, logo: React.ReactNode, txt: string) => (
    <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "14px 26px", borderRadius: 999, background: "#fff", opacity: p, transform: `scale(${0.8 + 0.2 * p})`, boxShadow: "0 14px 34px rgba(0,0,0,0.35)" }}>
      {logo}<div style={{ fontWeight: 800, fontSize: 44, color: C.ink }}>{txt}</div>
    </div>
  );
  return (
    <AbsoluteFill style={{ background: `radial-gradient(120% 80% at 50% 30%, #2C5A86 0%, ${C.ink} 72%)`, opacity: bg, fontFamily: FONT }}>
      <div style={{ position: "absolute", top: 150, left: 0, right: 0, textAlign: "center", opacity: head, transform: `translateY(${(1 - head) * 30}px)` }}>
        <div style={{ display: "inline-block", padding: "10px 26px", background: C.white, borderRadius: 14, transform: "rotate(-1.5deg)" }}>
          <div style={{ fontWeight: 800, fontSize: 72, color: C.ink, lineHeight: 1 }}>ПОЛНОЕ ВИДЕО</div>
        </div>
        <div style={{ marginTop: 14 }}>
          <div style={{ display: "inline-block", padding: "10px 26px", background: C.blue, borderRadius: 14, transform: "rotate(1.2deg)" }}>
            <div style={{ fontWeight: 800, fontSize: 62, color: C.ink, lineHeight: 1 }}>НА YOUTUBE И VK ВИДЕО</div>
          </div>
        </div>
        <div style={{ marginTop: 24, fontWeight: 700, fontSize: 36, color: C.glass }}>Месяц с тренажёром по китайскому</div>
      </div>
      <div style={{ position: "absolute", left: 120, top: 580, width: 840, height: 760, opacity: phone, transform: `translateY(${(1 - phone) * 120}px) rotate(${(1 - phone) * 4}deg)` }}>
        <div style={{ width: 840, height: 760, borderRadius: 70, background: "#0A0F16", padding: 22, boxSizing: "border-box", boxShadow: `0 40px 90px rgba(0,0,0,0.55), inset 0 0 0 3px #2B3442, 0 0 50px rgba(92,200,255,0.25)` }}>
          <div style={{ width: "100%", height: "100%", borderRadius: 52, overflow: "hidden", background: "#0F1218", position: "relative" }}>
            <div style={{ height: 70, display: "flex", alignItems: "center", gap: 14, padding: "0 30px", marginTop: 22 }}>
              <YouTubeLogo h={40} /><div style={{ fontWeight: 800, fontSize: 30, color: "#fff" }}>·</div><VKLogo h={42} />
            </div>
            <div style={{ margin: "8px 0 0", opacity: shot, transform: `scale(${0.9 + 0.1 * shot})` }}>
              <Img src={staticFile("assets/long_thumb.jpg")} style={{ width: "100%", display: "block" }} />
            </div>
            <div style={{ padding: "20px 30px", opacity: meta, transform: `translateY(${(1 - meta) * 16}px)` }}>
              <div style={{ fontWeight: 800, fontSize: 36, lineHeight: 1.2, color: "#fff" }}>Сама не знаю китайский, а сын учит: тренажёр за месяц</div>
              <div style={{ marginTop: 12, fontWeight: 700, fontSize: 28, color: "#9AA8B8" }}>Александра Рулёва</div>
            </div>
          </div>
        </div>
        <div style={{ position: "absolute", left: 540, top: 290, width: 90, height: 90, borderRadius: 90, background: "rgba(255,255,255,0.75)", opacity: tap, transform: `scale(${0.6 + 0.6 * tap})` }} />
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 1420, display: "flex", justifyContent: "center", gap: 22 }}>
        {pill(yt, <YouTubeLogo h={50} />, "YouTube")}
        {pill(vk, <VKLogo h={54} />, "VK Видео")}
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 1550, display: "flex", justifyContent: "center", opacity: handle, transform: `scale(${0.85 + 0.15 * handle})` }}>
        <div style={{ padding: "16px 34px", borderRadius: 999, background: "rgba(255,255,255,0.1)", border: `2px solid ${C.neon}`, fontWeight: 800, fontSize: 60, color: C.white, boxShadow: "0 0 30px rgba(92,200,255,0.35)" }}>@Aleksarulezzz</div>
      </div>
    </AbsoluteFill>
  );
};

/* ---------- composition ---------- */
const SFX: React.FC<{ at: number; kind: string; vol?: number }> = ({ at, kind, vol = 0.2 }) => (
  <Sequence from={Math.max(0, Math.round(at * FPS))} durationInFrames={Math.round(1.2 * FPS)}>
    <Audio src={staticFile(`sfx/${kind}.wav`)} volume={vol} />
  </Sequence>
);

export const Reel: React.FC<{ n: number }> = ({ n }) => {
  const d = REELS[n - 1];
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const total = d.duration;
  const cur = d.clips.find((c) => t >= c.out && t < c.out + c.dur);
  const pron = cur?.src === "pron";
  const fullB = d.events.find((e) => e.kind === "broll" && e.mode !== "photo" && on(e, t));
  const card = d.events.find((e) => (e.kind === "screen" || (e.kind === "broll" && e.mode === "photo")) && t >= e.a - 0.1 && t < e.b + 0.2);
  const chips: { text: string; hl?: string[]; a: number; b: number }[] = [];
  for (const e of d.events) {
    if (e.kind === "thesis") chips.push({ text: e.text as string, hl: (e.hl as string[]) ?? [], a: e.a, b: e.b });
    if (e.kind === "list") {
      const items = e.items as { text: string; at: number }[];
      items.forEach((it, i) => chips.push({ text: `${i + 1}. ${it.text}`, a: it.at, b: Math.min(it.at + 4.2, items[i + 1]?.at ?? it.at + 4.2) - 0.1 }));
    }
  }
  let k = 0;
  return (
    <AbsoluteFill style={{ backgroundColor: C.ink }}>
      {d.clips.map((c, i) => {
        const from = Math.round(c.out * FPS);
        const len = Math.round((c.out + c.dur) * FPS) - from;
        if (len <= 0) return null;
        const idx = c.src === "main" ? k++ : k;
        return (
          <Sequence key={i} from={from} durationInFrames={len} premountFor={FPS}>
            {c.src === "pron" ? <PronClip c={c} n={len} /> : <MainClip c={c} idx={idx} n={len} />}
          </Sequence>
        );
      })}
      {d.events.filter((e) => e.kind === "broll").map((e, i) => (
        <Sequence key={`b${i}`} from={Math.round(e.a * FPS)} durationInFrames={Math.max(1, Math.round((e.b - e.a) * FPS))} premountFor={FPS}>
          <Broll e={e} />
        </Sequence>
      ))}
      {d.events.filter((e) => e.kind === "screen").map((e, i) => (
        <Sequence key={`s${i}`} from={Math.round(e.a * FPS)} durationInFrames={Math.max(1, Math.round((e.b - e.a) * FPS))} premountFor={FPS}>
          <ScreenCard e={e} t={e.a + (frame - Math.round(e.a * FPS)) / FPS} />
        </Sequence>
      ))}
      {t < total ? (
        <>
          {!pron && !fullB && !card ? chips.map((c, i) => <Chip key={i} {...c} t={t} y={400} />) : null}
          {!pron ? <Subtitles d={d} t={t} top={card ? 1390 : 1350} /> : null}
          <Title lines={d.title} t={t} total={total} hidden={pron} />
        </>
      ) : null}
      <Sequence from={Math.round(total * FPS)} durationInFrames={Math.round(END_CARD * FPS)}>
        <EndCard t={(frame - Math.round(total * FPS)) / FPS} />
      </Sequence>
      <SFX at={total} kind="whoosh" vol={0.25} />
      <SFX at={total + 0.1} kind="swell" vol={0.25} />
      <SFX at={total + 1.4} kind="pop" vol={0.22} />
    </AbsoluteFill>
  );
};
