import React from "react";
import { AbsoluteFill, Audio, Img, OffthreadVideo, Sequence, interpolate, staticFile, useCurrentFrame } from "remotion";
import { C, EASE, FONT, FPS, W } from "./theme";
import edl from "./data/edl.json";
import gfx from "./data/gfx.json";
import { Graphics, Subtitles } from "./gfx";

/**
 * «Тренажёр по китайскому»: the author's recording (1920×1080, 30 fps) with graphics on the free
 * white wall on the left, full-width words behind her, screencasts in neon-blue frames, sparse b-roll.
 */
type Clip = { src: string; in: number; dur: number; out: number; item: number; piece: number; block: number };
type Ev = { kind: string; a: number; b: number; [k: string]: unknown };
const CLIPS = edl as Clip[];
export const EV = gfx.events as Ev[];
export const FACE = { x: 1060, y: 420 };
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const ease = (t: number, a: number, d = 0.45, e = EASE.out) => interpolate(t, [a, a + d], [0, 1], { ...clamp, easing: e });

/** zoom per jump cut: medium / closer alternating, plus a very slow push; denser in the first 90 s */
const zoomAt = (idx: number, f: number, n: number, out: number) => {
  const close = out < 90 ? 1.1 : 1.07;
  return (idx % 2 ? close : 1.0) + 0.015 * Math.min(1, f / Math.max(1, n));
};

// frames of the cut-outs rendered by tools/chinese_matte.py
const FG_FRAMES: Record<string, number> = { kitayskiy: 81, ieroglify: 81, intonaciya: 78, magazin: 69, chasy: 87, chestno: 81, kafe: 75 };

const MainClip: React.FC<{ c: Clip; idx: number; n: number }> = ({ c, idx, n }) => {
  const f = useCurrentFrame();
  const t = c.out + f / FPS;
  const vol = (fr: number) => Math.min(1, (fr + 1) / 2, (n - fr) / 2);
  const z = zoomAt(idx, f, n, c.out);
  const depth = EV.filter((e) => e.kind === "depth" && t >= e.a - 0.05 && t < e.b + 0.05);
  return (
    <AbsoluteFill style={{ overflow: "hidden", backgroundColor: "#fff" }}>
      <div style={{ position: "absolute", inset: 0, transformOrigin: `${FACE.x}px ${FACE.y}px`, transform: `scale(${z})` }}>
        <OffthreadVideo src={staticFile("media/main.mp4")} trimBefore={Math.round(c.in * FPS)} volume={vol} style={{ width: 1920, height: 1080 }} />
        {depth.map((e, i) => <DepthWord key={i} e={e} t={t} src={c.in + f / FPS} />)}
      </div>
    </AbsoluteFill>
  );
};

/** A word across the whole frame behind the author: footage, word, then her cut-out on top. */
const DepthWord: React.FC<{ e: Ev; t: number; src: number }> = ({ e, t, src }) => {
  const k = Math.max(0, Math.min(FG_FRAMES[e.name as string] - 1, Math.round((src - (e.src_a as number)) * FPS)));
  const word = e.word as string;
  const size = Math.min(330, (W * 0.86) / (word.length * 0.66));
  const pIn = ease(t, e.a, 0.6);
  const pOut = interpolate(t, [e.b - 0.35, e.b], [1, 0], clamp);
  return (
    <>
      <div style={{ position: "absolute", left: 0, right: 0, top: (word.includes(" ") ? 175 : 330) - size * 0.55, textAlign: "center", fontFamily: FONT, fontWeight: 800, fontSize: size, lineHeight: 1,
        letterSpacing: -2, whiteSpace: "nowrap", opacity: pIn * pOut, transform: `translateY(${(1 - pIn) * 40}px) scale(${0.96 + 0.04 * pIn})`,
        background: `linear-gradient(180deg, ${C.accent} 0%, ${C.blue} 100%)`, WebkitBackgroundClip: "text", color: "transparent",
        filter: `drop-shadow(0 6px 18px rgba(28,46,68,0.18)) blur(${(1 - pIn) * 6}px)` }}>
        {word}
      </div>
      <Img src={staticFile(`fg/${e.name}/${String(k).padStart(4, "0")}.webp`)} style={{ position: "absolute", left: 0, top: 0, width: 1920, height: 1080 }} />
    </>
  );
};

/* ---------- screencast pieces ---------- */
// regions of the 1598×1362 screen recording to show for each kind of screen
const FOCUS: Record<string, { x: number; y: number; w: number; h: number }> = {
  write: { x: 330, y: 380, w: 940, h: 900 },
  cards: { x: 40, y: 220, w: 1500, h: 1000 },
  listen: { x: 40, y: 250, w: 1500, h: 900 },
  plan: { x: 20, y: 290, w: 1180, h: 400 },
  shop: { x: 0, y: 0, w: 1598, h: 1362 },
  shophero: { x: 40, y: 30, w: 1520, h: 1000 },
  hero: { x: 40, y: 0, w: 1520, h: 1330 },
};
const LABEL: Record<string, string> = { write: "Цифровая пропись", cards: "Карточки", listen: "Послушай и выбери", plan: "План дня", shop: "Магазин", shophero: "Магазин", hero: "Герой" };

const Screen: React.FC<{ e: Ev }> = ({ e }) => {
  const f = useCurrentFrame();
  const t = e.a + f / FPS;
  const full = e.mode === "full";
  const R = FOCUS[e.focus as string];
  const p = ease(t, e.a, 0.45) * interpolate(t, [e.b - 0.35, e.b], [1, 0], clamp);
  const pulse = 0.65 + 0.25 * Math.sin(f / 9);
  const boxW = full ? Math.min(1500, (940 * R.w) / R.h) : e.focus === "plan" ? 740 : 660;
  const boxH = full ? Math.min(940, (1500 * R.h) / R.w) : (660 * R.h) / R.w;
  const k = Math.min(boxW / R.w, boxH / R.h) * interpolate(f, [0, (e.b - e.a) * FPS], [1, 1.06], clamp);
  const left = full ? (W - boxW) / 2 : 70, top = full ? (1080 - boxH) / 2 - 10 : Math.max(120, 430 - boxH / 2);
  const video = (style: React.CSSProperties) => (
    <OffthreadVideo src={staticFile("media/screen.mp4")} trimBefore={Math.round((e.at as number) * FPS)} muted style={{ position: "absolute", maxWidth: "none", ...style }} />
  );
  const glow = `0 0 0 2px rgba(92,200,255,${0.9 * pulse}), 0 0 26px rgba(92,200,255,${0.55 * pulse}), 0 0 70px rgba(92,200,255,${0.25 * pulse}), 0 24px 60px rgba(28,46,68,0.35)`;
  return (
    <AbsoluteFill style={{ opacity: p }}>
      {full ? (
        <AbsoluteFill style={{ background: "#EAF5FC", overflow: "hidden" }}>
          {video({ left: -200, top: -400, width: 2320, height: 1977, filter: "blur(36px) saturate(1.1) brightness(1.05)", opacity: 0.55 })}
          <div style={{ position: "absolute", inset: 10, borderRadius: 26, boxShadow: `inset 0 0 0 3px rgba(92,200,255,${0.9 * pulse}), inset 0 0 40px rgba(92,200,255,${0.35 * pulse}), 0 0 30px rgba(92,200,255,${0.4 * pulse})` }} />
        </AbsoluteFill>
      ) : null}
      <div style={{ position: "absolute", left, top, width: boxW, height: boxH, borderRadius: 22, overflow: "hidden", background: "#fff", boxShadow: glow,
        transform: `perspective(1600px) rotateY(${full ? 0 : (1 - p) * 10 + 3}deg) translateY(${(1 - p) * 30}px)` }}>
        {video({ left: (boxW - R.w * k) / 2 - R.x * k, top: (boxH - R.h * k) / 2 - R.y * k, width: 1598 * k, height: 1362 * k })}
      </div>
      <div style={{ position: "absolute", left: left + 18, top: top + boxH - 58, padding: "8px 18px", borderRadius: 14, background: "rgba(28,46,68,0.82)", color: C.glass,
        fontFamily: FONT, fontWeight: 800, fontSize: 26 }}>{LABEL[e.focus as string]}</div>
    </AbsoluteFill>
  );
};

/** B-roll: stock full frame, or the son at the laptop as a vertical card on the wall (muted). */
const Broll: React.FC<{ e: Ev }> = ({ e }) => {
  const f = useCurrentFrame();
  const n = (e.b - e.a) * FPS;
  const p = interpolate(f, [0, 8], [0, 1], clamp) * interpolate(f, [n - 8, n], [1, 0], clamp);
  const src = staticFile(e.file as string);
  if (e.mode === "card") {
    return (
      <div style={{ position: "absolute", left: 200, top: 110, width: 430, height: 764, borderRadius: 28, overflow: "hidden", opacity: p,
        transform: `translateY(${(1 - p) * 30}px)`, boxShadow: "0 0 0 2px rgba(92,200,255,0.85), 0 0 30px rgba(92,200,255,0.4), 0 24px 60px rgba(28,46,68,0.35)" }}>
        <OffthreadVideo src={src} trimBefore={Math.round((e.at as number) * FPS)} muted style={{ width: 430, height: 764 }} />
      </div>
    );
  }
  return (
    <AbsoluteFill style={{ opacity: p, overflow: "hidden" }}>
      <OffthreadVideo src={src} trimBefore={Math.round((e.at as number) * FPS)} muted style={{ width: 1920, height: 1080, transform: `scale(${1.02 + 0.04 * (f / n)})` }} />
    </AbsoluteFill>
  );
};

/* ---------- music: a quiet bed under the voice, short phrases of «A Decade in Beijing» on chapter cards ---------- */
const BED_VOL = 0.028; // ~21 dB under the voice
const STING_AT = 6.2; // a gentle phrase of the track, seconds

export const Main: React.FC = () => {
  const total = gfx.total;
  const chapters = EV.filter((e) => e.kind === "chapter");
  let k = 0;
  return (
    <AbsoluteFill style={{ backgroundColor: "#fff" }}>
      {CLIPS.map((c, i) => {
        const from = Math.round(c.out * FPS);
        const n = Math.round((c.out + c.dur) * FPS) - from;
        if (n <= 0) return null;
        const idx = k++;
        return (
          <Sequence key={i} from={from} durationInFrames={n} premountFor={FPS}>
            <MainClip c={c} idx={idx} n={n} />
          </Sequence>
        );
      })}
      {EV.filter((e) => e.kind === "broll").map((e, i) => (
        <Sequence key={`b${i}`} from={Math.round(e.a * FPS)} durationInFrames={Math.round((e.b - e.a) * FPS)} premountFor={FPS}>
          <Broll e={e} />
        </Sequence>
      ))}
      {EV.filter((e) => e.kind === "screen").map((e, i) => (
        <Sequence key={`s${i}`} from={Math.round(e.a * FPS)} durationInFrames={Math.round((e.b - e.a) * FPS)} premountFor={FPS}>
          <Screen e={e} />
        </Sequence>
      ))}
      <Graphics />
      <Subtitles />
      {/* the bed fades out under the chapter stings and dips a little under screencasts with speech */}
      <Audio src={staticFile("music/mixkit-serene-view-443.mp3")} loop
        volume={(fr) => {
          const t = fr / FPS;
          const sting = chapters.some((c) => t > c.a - 0.4 && t < c.a + 2.2) ? 0.3 : 1;
          const fade = Math.min(1, t / 2, (total - t) / 2);
          return BED_VOL * sting * Math.max(0, fade);
        }} />
      {chapters.map((c, i) => (
        <Sequence key={`m${i}`} from={Math.max(0, Math.round((c.a - 0.3) * FPS))} durationInFrames={Math.round(2.4 * FPS)}>
          <Audio src={staticFile("music/mixkit-a-decade-in-beijing-863.mp3")} trimBefore={Math.round((STING_AT + i * 4.0) * FPS)}
            volume={(fr) => 0.12 * Math.min(1, fr / 6, (2.4 * FPS - fr) / 15)} />
        </Sequence>
      ))}
      {EV.map((e, i) => {
        const s = e.kind === "chapter" ? ["whoosh", 0.1] : e.kind === "depth" ? ["swell", 0.07] : e.kind === "tier" ? ["whoosh", 0.1] : null;
        if (!s) return null;
        return (
          <Sequence key={`x${i}`} from={Math.max(0, Math.round((e.a - (e.kind === "chapter" ? 0.3 : 0)) * FPS))} durationInFrames={Math.round(1.4 * FPS)}>
            <Audio src={staticFile(`sfx/${s[0]}.wav`)} volume={s[1] as number} />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
