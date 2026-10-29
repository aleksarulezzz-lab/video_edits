import React from "react";
import { AbsoluteFill, Audio, Img, OffthreadVideo, Sequence, interpolate, staticFile, useCurrentFrame } from "remotion";
import { C, FPS, W } from "./theme";
import edl from "./data/edl.json";
import gfx from "./data/gfx.json";
import { Broll, Graphics, Subtitles, EV } from "./gfx";

/**
 * «Месяц занятий на тренажёре» — the author's recording (a video call, 1440×800) cropped to 16:9 and
 * scaled to 1080p, kid answers as full-frame inserts, graphics on the free white wall on the left.
 */
type Clip = { src: string; in: number; dur: number; out: number; item: number; piece: number; block: number; kid: boolean; screen: boolean };
const CLIPS = edl as Clip[];

// source crop: drop the call's black borders and the name label
export const CROP = { x: 16, y: 4, w: 1376, h: 774 };
export const S = W / CROP.w;
export const FACE = { x: 1026, y: 377 }; // author's face on the 1080p frame

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/** zoom per jump cut: alternate medium / closer on every piece, plus a very slow push. */
const zoomAt = (c: Clip, f: number, n: number) => {
  const prev = CLIPS.filter((x) => x.src === "main" && !x.screen && x.out < c.out).length;
  return (prev % 2 ? 1.07 : 1.0) + 0.015 * Math.min(1, f / Math.max(1, n));
};

const MainClip: React.FC<{ c: Clip; n: number }> = ({ c, n }) => {
  const f = useCurrentFrame();
  const t = c.out + f / FPS;
  const vol = (fr: number) => Math.min(1, (fr + 1) / 2, (n - fr) / 2);
  const video = (
    <OffthreadVideo
      src={staticFile("media/main.mp4")}
      trimBefore={Math.round(c.in * FPS)}
      volume={vol}
      style={{ position: "absolute", left: -CROP.x * S, top: -CROP.y * S, width: 1440 * S, height: 800 * S, maxWidth: "none" }}
    />
  );
  if (c.screen) return <ScreenLayer t={t} trim={Math.round(c.in * FPS)} vol={vol} />;
  const z = zoomAt(c, f, n);
  const depth = EV.filter((e) => e.kind === "depth" && t >= e.a - 0.05 && t < e.b + 0.05);
  return (
    <AbsoluteFill style={{ overflow: "hidden", backgroundColor: C.ink }}>
      <div style={{ position: "absolute", inset: 0, transformOrigin: `${FACE.x}px ${FACE.y}px`, transform: `scale(${z})` }}>
        {video}
        {depth.map((e, i) => <DepthWord key={i} e={e} t={t} />)}
      </div>
    </AbsoluteFill>
  );
};

// frames rendered by tools/trainer_matte.py for each depth word
const FG_FRAMES: Record<string, number> = { trenazher: 75, magazin: 75, olimp: 68, chas: 70, besplatno: 68 };

/** A word on the wall behind the author: footage, word, then her cut-out on top. */
const DepthWord: React.FC<{ e: (typeof EV)[number]; t: number }> = ({ e, t }) => {
  const k = Math.max(0, Math.floor((t - e.a) * FPS + 1e-3));
  const word = e.word as string;
  const size = Math.min(250, 820 / (word.length * 0.74));
  const pIn = interpolate(t, [e.a, e.a + 0.6], [0, 1], { ...clamp, easing: (x) => 1 - Math.pow(1 - x, 3) });
  const pOut = interpolate(t, [e.b - 0.35, e.b], [1, 0], clamp);
  return (
    <>
      <div style={{ position: "absolute", right: W - 835, top: 360 - size * 0.62, textAlign: "right", fontFamily: "Manrope", fontWeight: 800, fontSize: size, lineHeight: 1, letterSpacing: -2,
        color: C.ink, opacity: pIn * pOut, transform: `translateX(${(1 - pIn) * 260}px)`, whiteSpace: "nowrap" }}>
        {word}
        <div style={{ height: 14, marginTop: 8, marginLeft: "auto", width: `${pIn * 100}%`, background: C.lime, borderRadius: 7 }} />
      </div>
      <Img src={staticFile(`fg/${e.name}/${String(Math.min(k, FG_FRAMES[e.name as string] - 1)).padStart(4, "0")}.webp`)} style={{ position: "absolute", left: 0, top: 0, width: CROP.w * S, height: CROP.h * S }} />
    </>
  );
};

/** Screen share: the trainer's page in a floating window with a soft lime glow. */
const ScreenLayer: React.FC<{ t: number; trim: number; vol: (f: number) => number }> = ({ t, trim, vol }) => {
  const scr = EV.find((e) => e.kind === "screen" && t >= e.a - 0.1 && t < e.b + 0.1)!;
  const p = interpolate(t, [scr.a, scr.a + 0.5], [0, 1], { ...clamp, easing: (x) => 1 - Math.pow(1 - x, 3) });
  const push = interpolate(t, [scr.a, scr.b], [1, 1.06], clamp);
  const pulse = 0.55 + 0.25 * Math.sin((t - scr.a) * 2.2);
  // page area of the shared screen (no browser bars, no webcam thumbnail)
  const PG = { x: 250, y: 92, w: 940, h: 708 };
  const WIN = { w: 1010, h: (1010 * PG.h) / PG.w };
  const k = WIN.w / PG.w;
  return (
    <AbsoluteFill style={{ background: `radial-gradient(60% 70% at 50% 45%, #1C2410 0%, ${C.ink} 70%)` }}>
      <div style={{ position: "absolute", left: (W - WIN.w) / 2, top: 140, width: WIN.w, height: WIN.h, borderRadius: 22, overflow: "hidden",
        transform: `perspective(1600px) rotateY(${(1 - p) * -10 - 2}deg) scale(${(0.92 + 0.08 * p) * push})`, opacity: p,
        boxShadow: `0 0 0 2px rgba(200,255,0,${0.55 * pulse}), 0 0 60px rgba(200,255,0,${0.28 * pulse}), 0 30px 80px rgba(0,0,0,0.6)` }}>
        <OffthreadVideo src={staticFile("media/main.mp4")} trimBefore={trim} volume={vol}
          style={{ position: "absolute", left: -PG.x * k, top: -PG.y * k, width: 1440 * k, height: 800 * k, maxWidth: "none" }} />
      </div>
    </AbsoluteFill>
  );
};

/** Kid answers: vertical clip centred in a glass frame over its own blurred copy. */
const KidClip: React.FC<{ c: Clip; n: number }> = ({ c, n }) => {
  const f = useCurrentFrame();
  const src = staticFile(`media/${c.src}.mp4`);
  const vol = (fr: number) => Math.min(1, (fr + 1) / 2, (n - fr) / 2);
  const first = !CLIPS.some((x) => x.kid && x.out < c.out && x.out + x.dur > c.out - 0.5);
  const p = first ? interpolate(f, [0, 8], [0, 1], clamp) : 1;
  return (
    <AbsoluteFill style={{ backgroundColor: C.ink, overflow: "hidden" }}>
      <OffthreadVideo src={src} trimBefore={Math.round(c.in * FPS)} muted style={{ position: "absolute", left: 0, top: -660, width: W, height: 3413, filter: "blur(40px) brightness(0.55)", maxWidth: "none" }} />
      <div style={{ position: "absolute", left: (W - 576) / 2, top: 40, width: 576, height: 1024, borderRadius: 30, overflow: "hidden", opacity: p, transform: `scale(${0.96 + 0.04 * p})`,
        boxShadow: "0 0 0 2px rgba(200,255,0,0.5), 0 0 50px rgba(200,255,0,0.22), 0 30px 80px rgba(0,0,0,0.6)" }}>
        <OffthreadVideo src={src} trimBefore={Math.round(c.in * FPS)} volume={vol} style={{ width: 576, height: 1024 }} />
      </div>
      <div style={{ position: "absolute", left: 120, top: 430, opacity: p, padding: "22px 30px", borderRadius: 24, background: "rgba(255,255,255,0.12)", backdropFilter: "blur(18px)",
        border: "1.5px solid rgba(255,255,255,0.28)", fontFamily: "Manrope", color: C.cream }}>
        <div style={{ fontWeight: 600, fontSize: 26, opacity: 0.8 }}>отвечает</div>
        <div style={{ fontWeight: 800, fontSize: 44 }}>Главный <span style={{ color: C.lime }}>пользователь</span></div>
      </div>
    </AbsoluteFill>
  );
};

export const Main: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: C.ink }}>
    {CLIPS.map((c, i) => {
      const from = Math.round(c.out * FPS);
      const n = Math.round((c.out + c.dur) * FPS) - from;
      if (n <= 0) return null;
      return (
        <Sequence key={i} from={from} durationInFrames={n} premountFor={FPS}>
          {c.src === "main" ? <MainClip c={c} n={n} /> : <KidClip c={c} n={n} />}
        </Sequence>
      );
    })}
    {EV.filter((e) => e.kind === "broll").map((e, i) => (
      <Sequence key={`b${i}`} from={Math.round(e.a * FPS)} durationInFrames={Math.round((e.b - e.a + 0.3) * FPS)} premountFor={FPS}>
        <Broll e={e} />
      </Sequence>
    ))}
    <Graphics clips={CLIPS} />
    <Subtitles clips={CLIPS} />
    {gfx.events.map((e, i) => {
      const s = e.kind === "chapter" ? ["whoosh", 0.16] : e.kind === "depth" ? ["swell", 0.1] : e.kind === "tier" ? ["whoosh", 0.12] : e.kind === "thesis" ? ["pop", 0.05] : null;
      if (!s) return null;
      return (
        <Sequence key={`s${i}`} from={Math.max(0, Math.round((e.a - (e.kind === "chapter" ? 0.3 : 0)) * FPS))} durationInFrames={Math.round(1.4 * FPS)}>
          <Audio src={staticFile(`sfx/${s[0]}.wav`)} volume={s[1] as number} />
        </Sequence>
      );
    })}
  </AbsoluteFill>
);
