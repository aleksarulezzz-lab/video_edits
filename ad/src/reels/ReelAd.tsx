import React from "react";
import { AbsoluteFill, Audio, Img, OffthreadVideo, Sequence, interpolate, staticFile, useCurrentFrame } from "remotion";
import { C, EASE, FPS, SERIF, UI } from "../theme";
import { Mark, ease, fade, glass } from "../glass";
import { Grain, Strip } from "../paper";
import data from "./data/reels.json";

/**
 * Vertical Reels cut from the finished long video (media/final.mp4) and from the ready vertical ad (media/rv.mp4).
 * While the author speaks she fills the frame (vertical crop); screencasts, inserts and tier lists play as a
 * 16:9 window in the middle. Title on paper strips at the top, subtitles in dark pills, end card with the cover.
 */
type Part = { src: string; a: number; b: number; out: number };
type Sub = { a: number; b: number; text: string };
type Win = { a: number; b: number; kind: string };
type Over = { a: number; b: number; img: string };
type RvIns = { a: number; b: number; at: number };
export type ReelData = { name: string; title: string[]; duration: number; parts: Part[]; subs: Sub[]; windows: Win[]; over?: Over[]; rvins?: RvIns[];
  intro?: { lines: string[]; d: number }; cta?: string };
export const REELS = data as ReelData[];
export const END = 4.0;
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

const CROP_X = 620; // a 760-px column around her face (the side captions of the long video stay outside)
const K = 1080 / 760;

const LongPart: React.FC<{ d: ReelData; p: Part; n: number }> = ({ d, p, n }) => {
  const f = useCurrentFrame();
  const t = p.out + f / FPS;
  const vol = (fr: number) => Math.min(1, (fr + 1) / 3, (n - fr) / 3);
  // 0 = author fills the frame, 1 = 16:9 window
  const ov = (d.over ?? []).find((x) => t >= x.a && t < x.b);
  const w = Math.max(0, ...[...d.windows, ...(d.over ?? [])].map((x) => interpolate(t, [x.a - 0.2, x.a, x.b, x.b + 0.2], [0, 1, 1, 0], clamp)));
  const src = staticFile("media/final.mp4");
  const trim = Math.round(p.a * FPS);
  return (
    <AbsoluteFill style={{ backgroundColor: C.navy }}>
      <AbsoluteFill style={{ overflow: "hidden" }}>
        <OffthreadVideo src={src} trimBefore={trim} muted style={{ position: "absolute", left: -1166, top: 0, width: 3413, height: 1920, maxWidth: "none", filter: "blur(40px) brightness(0.55)" }} />
        <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(29,42,85,0.55), rgba(29,42,85,0.15) 40%, rgba(29,42,85,0.65))" }} />
      </AbsoluteFill>
      {/* the author: vertical column, full height */}
      <div style={{ position: "absolute", left: 0, top: 380, width: 1080, height: 1080 * K, overflow: "hidden", opacity: 1 - w }}>
        <OffthreadVideo src={src} trimBefore={trim} volume={vol} style={{ position: "absolute", left: -CROP_X * K, top: 0, width: 1920 * K, height: 1080 * K, maxWidth: "none" }} />
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 260, background: "linear-gradient(0deg, rgba(29,42,85,0.7), rgba(29,42,85,0))" }} />
      </div>
      {/* windows, inserts, tier lists: the whole 16:9 frame */}
      {w > 0.001 ? (
        <div style={{ position: "absolute", left: 0, top: 650, width: 1080, height: 608, opacity: w, transform: `scale(${0.96 + 0.04 * w})`,
          boxShadow: "0 0 0 2px rgba(150,180,255,0.9), 0 0 30px rgba(47,95,208,0.7), 0 30px 60px rgba(0,0,0,0.5)" }}>
          {ov ? (
            // the order she is reading, as a still of the freelance site
            <div style={{ position: "absolute", inset: 0, background: "#fff", overflow: "hidden" }}>
              <Img src={staticFile(ov.img)} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "left top",
                transform: `scale(${1.32 + 0.05 * Math.min(1, (t - ov.a) / Math.max(0.5, ov.b - ov.a))})`, transformOrigin: "left top" }} />
            </div>
          ) : (
            <OffthreadVideo src={src} trimBefore={trim} muted style={{ width: 1080, height: 608 }} />
          )}
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

const RvPart: React.FC<{ p: Part; n: number }> = ({ p, n }) => (
  <AbsoluteFill>
    <OffthreadVideo src={staticFile("media/rv.mp4")} trimBefore={Math.round(p.a * FPS)} volume={(fr) => 0.85 * Math.min(1, (fr + 1) / 3, (n - fr) / 3)} style={{ width: 1080, height: 1920 }} />
  </AbsoluteFill>
);

const Title: React.FC<{ lines: string[]; t: number; until: number }> = ({ lines, t, until }) => {
  const a = ease(t, 0.05, 0.45, EASE.spring), b = ease(t, 0.25, 0.45, EASE.spring);
  const o = fade(t, until, 0.35);
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: 120, display: "flex", flexDirection: "column", alignItems: "center", gap: 10, opacity: o }}>
      <div style={{ opacity: a, transform: `scale(${0.85 + 0.15 * a})` }}><Strip text={lines[0]} bg={C.cream} fg={C.navy} size={64} seed={301} rot={-1.5} /></div>
      <div style={{ opacity: b, transform: `scale(${0.85 + 0.15 * b})` }}><Strip text={lines[1]} bg={C.yellow} size={64} seed={302} rot={1.2} /></div>
    </div>
  );
};

const Subs: React.FC<{ d: ReelData; t: number; top: number }> = ({ d, t, top }) => {
  const s = d.subs.find((x) => t >= x.a && t < x.b);
  if (!s) return null;
  const k = ease(t, s.a, 0.12);
  return (
    <div style={{ position: "absolute", left: 70, right: 70, top, display: "flex", justifyContent: "center", opacity: k, transform: `translateY(${(1 - k) * 8}px)` }}>
      <div style={{ maxWidth: 900, padding: "12px 26px 14px", borderRadius: 22, background: "rgba(29,42,85,0.86)", fontFamily: UI, fontWeight: 700, fontSize: 52, lineHeight: 1.18, color: "#fff", textAlign: "center" }}>{s.text}</div>
    </div>
  );
};

/* ---------- end card: the full video (cover), YouTube + VK Video, @Aleksarulezzz, the channel ---------- */
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
  const bg = ease(t, 0, 0.35), head = ease(t, 0.15, 0.45, EASE.spring), shot = ease(t, 0.4, 0.5, EASE.spring);
  const meta = ease(t, 0.9, 0.4), logos = ease(t, 1.2, 0.45, EASE.spring), tg = ease(t, 1.6, 0.45, EASE.spring);
  return (
    <AbsoluteFill style={{ background: C.cream, opacity: bg }}>
      <Grain seed={77} opacity={0.45} />
      <div style={{ position: "absolute", left: 0, right: 0, top: 150, display: "flex", flexDirection: "column", alignItems: "center", gap: 12, opacity: head, transform: `translateY(${(1 - head) * 30}px)` }}>
        <Strip text="Полное видео" bg={C.navy} fg={C.cream} size={74} seed={311} rot={-1.5} />
        <Strip text="на YouTube и VK Видео" bg={C.yellow} size={60} seed={312} rot={1.2} />
      </div>
      <div style={{ position: "absolute", left: 60, top: 470, width: 960, opacity: shot, transform: `scale(${0.9 + 0.1 * shot}) rotate(-1.5deg)` }}>
        <div style={{ background: "#fff", padding: 14, boxShadow: "0 24px 50px rgba(20,25,45,0.4)" }}>
          <Img src={staticFile("assets/long_thumb.jpg")} style={{ width: "100%", display: "block" }} />
        </div>
      </div>
      <div style={{ position: "absolute", left: 80, right: 80, top: 1050, textAlign: "center", opacity: meta, fontFamily: SERIF, fontWeight: 700, fontSize: 46, lineHeight: 1.2, color: C.navy }}>
        5 000 ₽ за ролик, который ты сделаешь в нейросети за час
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 1240, display: "flex", justifyContent: "center", gap: 22, opacity: logos, transform: `scale(${0.85 + 0.15 * logos})` }}>
        {[[<YouTubeLogo key="y" h={48} />, "YouTube"], [<VKLogo key="v" h={52} />, "VK Видео"]].map(([logo, txt], i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 26px", borderRadius: 999, background: "#fff", boxShadow: "0 10px 26px rgba(20,25,45,0.25)" }}>
            {logo}<div style={{ fontFamily: UI, fontWeight: 700, fontSize: 40, color: C.navy }}>{txt as string}</div>
          </div>
        ))}
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 1360, display: "flex", justifyContent: "center", opacity: logos }}>
        <div style={{ fontFamily: UI, fontWeight: 700, fontSize: 56, color: C.navy }}>@Aleksarulezzz</div>
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 1480, display: "flex", justifyContent: "center", opacity: tg, transform: `translateY(${(1 - tg) * 20}px)` }}>
        <div style={{ ...glass(true), padding: "18px 30px", display: "flex", alignItems: "center", gap: 18 }}>
          <div style={{ width: 64, height: 64, borderRadius: 18, background: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}><Mark name="telegram" size={44} /></div>
          <div>
            <div style={{ fontFamily: UI, fontWeight: 600, fontSize: 32, color: "rgba(255,255,255,0.85)" }}>Гайд и промпты в канале</div>
            <div style={{ fontFamily: UI, fontWeight: 700, fontSize: 44, color: "#fff" }}>t.me/zapuskator_A</div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

/* ---------- card before the reel: what the viewer gets from it ---------- */
const IntroCard: React.FC<{ lines: string[]; t: number; d: number }> = ({ lines, t, d }) => {
  const a = ease(t, 0.05, 0.45, EASE.spring), b = ease(t, 0.3, 0.45, EASE.spring);
  const o = interpolate(t, [d - 0.25, d], [1, 0], clamp);
  return (
    <AbsoluteFill style={{ background: C.kraft, opacity: o }}>
      <Grain seed={23} opacity={0.6} />
      <AbsoluteFill style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 26 }}>
        <div style={{ opacity: a, transform: `scale(${0.8 + 0.2 * a}) rotate(-2deg)` }}><Strip text={lines[0]} bg={C.cream} fg={C.navy} size={76} seed={331} rot={0} /></div>
        <div style={{ opacity: b, transform: `scale(${0.8 + 0.2 * b}) rotate(1.5deg)` }}><Strip text={lines[1]} bg={C.yellow} size={76} seed={332} rot={0} /></div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/* ---------- Instagram / Dzen end card: the lesson for a comment ---------- */
const CommentCard: React.FC<{ t: number }> = ({ t }) => {
  const bg = ease(t, 0, 0.35), a = ease(t, 0.15, 0.45, EASE.spring), b = ease(t, 0.5, 0.45, EASE.spring), c = ease(t, 0.9, 0.45, EASE.spring);
  return (
    <AbsoluteFill style={{ background: C.cream, opacity: bg }}>
      <Grain seed={78} opacity={0.45} />
      <AbsoluteFill style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 34 }}>
        <div style={{ opacity: a, transform: `translateY(${(1 - a) * 30}px)` }}><Strip text="Напиши в комментариях" bg={C.navy} fg={C.cream} size={70} seed={341} rot={-1.5} /></div>
        <div style={{ opacity: b, transform: `scale(${0.7 + 0.3 * b})` }}>
          <div style={{ ...glass(true), background: C.blue, padding: "26px 60px", fontFamily: UI, fontWeight: 700, fontSize: 110, color: "#fff", letterSpacing: -1 }}>«Анимация»</div>
        </div>
        <div style={{ opacity: c, transform: `translateY(${(1 - c) * 30}px)` }}><Strip text="и забирай урок" bg={C.yellow} size={70} seed={342} rot={1.5} /></div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export const ReelAd: React.FC<{ n: number }> = ({ n }) => {
  const d = REELS[n - 1];
  const f = useCurrentFrame();
  const t = f / FPS;
  const rv = d.parts[0].src === "rv";
  return (
    <AbsoluteFill style={{ backgroundColor: C.navy }}>
      {d.parts.map((p, i) => {
        const from = Math.round(p.out * FPS);
        const len = Math.round((p.out + p.b - p.a) * FPS) - from;
        return (
          <Sequence key={i} from={from} durationInFrames={len} premountFor={FPS}>
            {p.src === "rv" ? <RvPart p={p} n={len} /> : <LongPart d={d} p={p} n={len} />}
          </Sequence>
        );
      })}
      {(d.rvins ?? []).map((x, i) => (
        // pieces of the ready vertical ad over her speech (muted): more motion design on screen
        <Sequence key={`r${i}`} from={Math.round(x.a * FPS)} durationInFrames={Math.round((x.b - x.a) * FPS)}>
          <AbsoluteFill style={{ opacity: interpolate(f / FPS - x.a, [0, 0.15, x.b - x.a - 0.15, x.b - x.a], [0, 1, 1, 0], clamp) }}>
            <OffthreadVideo src={staticFile("media/rv.mp4")} trimBefore={Math.round(x.at * FPS)} muted style={{ width: 1080, height: 1920 }} />
          </AbsoluteFill>
        </Sequence>
      ))}
      {d.intro ? (
        <Sequence from={0} durationInFrames={Math.round(d.intro.d * FPS)}>
          <IntroCard lines={d.intro.lines} t={t} d={d.intro.d} />
          <Audio src={staticFile("sfx/paper.wav")} volume={0.2} />
        </Sequence>
      ) : null}
      {t < d.duration && t >= (d.intro?.d ?? 0) ? (
        <>
          {!rv && !(d.rvins ?? []).some((x) => t >= x.a - 0.1 && t < x.b + 0.1) ? <Title lines={d.title} t={t} until={d.duration} /> : null}
          <Subs d={d} t={t} top={rv ? 1580 : 1430} />
        </>
      ) : null}
      <Sequence from={Math.round(d.duration * FPS)} durationInFrames={Math.round(END * FPS)}>
        {d.cta === "comment" ? <CommentCard t={(f - Math.round(d.duration * FPS)) / FPS} /> : <EndCard t={(f - Math.round(d.duration * FPS)) / FPS} />}
        <Audio src={staticFile("sfx/paper.wav")} volume={0.18} />
      </Sequence>
    </AbsoluteFill>
  );
};
