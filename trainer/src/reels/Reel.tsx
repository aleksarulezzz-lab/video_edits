import React from "react";
import { AbsoluteFill, Audio, Img, OffthreadVideo, Sequence, interpolate, staticFile, useCurrentFrame } from "remotion";
import { C, EASE, FONT, FPS } from "../theme";
import r1 from "./data/reel_1.json";
import r2 from "./data/reel_2.json";
import r3 from "./data/reel_3.json";
import r4 from "./data/reel_4.json";
import r5 from "./data/reel_5.json";
import r6 from "./data/reel_6.json";
import r7 from "./data/reel_7.json";
import r8 from "./data/reel_8.json";

/**
 * Vertical 1080×1920 Reels cut from the trainer video: title on top, the author full-width in the
 * middle, subtitles at chest height above the Reels UI, the son's answers and laptop shots as
 * full-frame vertical inserts, key graphics below a round face bubble, animated end card.
 */
type Word = { w: string; s: number; e: number; hl: boolean };
type Page = { start: number; end: number; kid: boolean; lines: Word[][] };
type Clip = { src: string; in: number; dur: number; out: number; kid: boolean; screen: boolean; piece: number };
type Ev = { kind: string; a: number; b: number; [k: string]: unknown };
type ReelData = { n: number; name: string; title: string[]; duration: number; clips: Clip[]; captions: Page[]; events: Ev[] };
export const REELS = [r1, r2, r3, r4, r5, r6, r7, r8] as unknown as ReelData[];
export const END_CARD = 4.0;

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const ease = (t: number, a: number, d = 0.4, e = EASE.out) => interpolate(t, [a, a + d], [0, 1], { ...clamp, easing: e });
const fadeOut = (t: number, b: number, d = 0.3) => interpolate(t, [b - d, b], [1, 0], clamp);

// the author's frame: source crop around her (1440×800 call recording) scaled ×1.5
const CROP = { x: 391, y: 4, w: 720, h: 796 };
const S = 1.5;
const FRAME = { y: 470, w: 1080, h: CROP.h * S };
const FACE = { x: 540, y: 405 }; // face centre inside the frame
const BUBBLE = { cy: 720, r: 240 };
const PIP = 0.55;
const overlayP = (t: number, a: number, b: number) => ease(t, a, 0.3) * fadeOut(t, b + 0.25, 0.3);
const BUBBLE_KINDS = ["shop", "sheet", "alarm", "branch", "summary"];

/** framing changes: every jump cut, plus a punch-in at sentence starts inside long pieces */
const framingIndex = (d: ReelData, t: number) => {
  const cuts = d.clips.filter((c) => c.out > 0 && c.out <= t).length;
  let punches = 0, last = 0;
  for (let i = 1; i < d.captions.length; i++) {
    const p = d.captions[i], prev = d.captions[i - 1];
    const endWord = prev.lines[prev.lines.length - 1].slice(-1)[0].w;
    if (p.start > t) break;
    if (/[.?!]$/.test(endWord) && p.start - last > 6.5 && !d.clips.some((c) => Math.abs(c.out - p.start) < 1.5)) { punches++; last = p.start; }
  }
  return cuts + punches;
};

const MainClip: React.FC<{ d: ReelData; c: Clip; n: number }> = ({ d, c, n }) => {
  const f = useCurrentFrame();
  const t = c.out + f / FPS;
  const vol = (fr: number) => Math.min(1, (fr + 1) / 2, (n - fr) / 2);
  const src = staticFile("media/main.mp4");
  const p = Math.max(0, ...d.events.filter((e) => BUBBLE_KINDS.includes(e.kind)).map((e) => overlayP(t, e.a, e.b)));
  const zoom = (framingIndex(d, t) % 2 ? 1.12 : 1.0) + 0.02 * Math.min(1, f / Math.max(1, n));
  const sc = 1 - (1 - PIP) * p;
  const dy = (BUBBLE.cy - FRAME.y - FACE.y) * p;
  const r = interpolate(p, [0, 1], [1600, BUBBLE.r / PIP]);
  if (c.screen) return <ScreenClip t={t} c={c} vol={vol} d={d} />;
  return (
    <AbsoluteFill style={{ backgroundColor: C.ink }}>
      <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
        <OffthreadVideo src={src} trimBefore={Math.round(c.in * FPS)} muted style={{ position: "absolute", left: -1100, top: -40, width: 3456, height: 1920, maxWidth: "none", filter: "blur(40px) brightness(0.5)" }} />
      </div>
      <div style={{ position: "absolute", left: 0, top: FRAME.y, width: FRAME.w, height: FRAME.h, overflow: "hidden" }}>
        {p > 0 ? <div style={{ position: "absolute", inset: 0, background: `rgba(14,14,14,${0.94 * p})` }} /> : null}
        <div style={{ position: "absolute", inset: 0, transformOrigin: `${FACE.x}px ${FACE.y}px`, transform: `translateY(${dy}px) scale(${sc})`, clipPath: p > 0 ? `circle(${r}px at ${FACE.x}px ${FACE.y}px)` : undefined }}>
          <div style={{ position: "absolute", inset: 0, transformOrigin: `${FACE.x}px ${FACE.y}px`, transform: `scale(${zoom})` }}>
            <OffthreadVideo src={src} trimBefore={Math.round(c.in * FPS)} volume={vol}
              style={{ position: "absolute", left: -CROP.x * S, top: -CROP.y * S, width: 1440 * S, height: 800 * S, maxWidth: "none" }} />
          </div>
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg, rgba(0,0,0,0.32) 0%, rgba(0,0,0,0) 20%, rgba(0,0,0,0) 80%, rgba(0,0,0,0.32) 100%)" }} />
          <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 480, background: "linear-gradient(0deg, rgba(0,0,0,0.55), rgba(0,0,0,0))" }} />
        </div>
        {p > 0.02 ? <div style={{ position: "absolute", left: FACE.x - BUBBLE.r, top: BUBBLE.cy - FRAME.y - BUBBLE.r, width: 2 * BUBBLE.r, height: 2 * BUBBLE.r, borderRadius: "50%", boxSizing: "border-box", border: `6px solid ${C.lime}`, opacity: Math.max(0, (p - 0.6) / 0.4) }} /> : null}
      </div>
    </AbsoluteFill>
  );
};

/** Screen share of the trainer: the page in a glowing window. */
const ScreenClip: React.FC<{ t: number; c: Clip; vol: (f: number) => number; d: ReelData }> = ({ t, c, vol, d }) => {
  const scr = d.events.find((e) => e.kind === "screen") ?? { a: c.out, b: c.out + c.dur };
  const p = ease(t, scr.a as number, 0.5);
  const push = interpolate(t, [scr.a as number, scr.b as number], [1, 1.08], clamp);
  const PG = { x: 250, y: 92, w: 940, h: 708 };
  const Wd = 1000, k = Wd / PG.w, Ht = PG.h * k;
  const pulse = 0.55 + 0.25 * Math.sin((t - (scr.a as number)) * 2.2);
  return (
    <AbsoluteFill style={{ background: `radial-gradient(70% 50% at 50% 50%, #1C2410 0%, ${C.ink} 75%)` }}>
      <div style={{ position: "absolute", left: 40, top: 480, width: Wd, height: Ht, borderRadius: 24, overflow: "hidden", opacity: p, transform: `scale(${(0.94 + 0.06 * p) * push})`,
        boxShadow: `0 0 0 2px rgba(200,255,0,${0.55 * pulse}), 0 0 60px rgba(200,255,0,${0.28 * pulse}), 0 30px 80px rgba(0,0,0,0.6)` }}>
        <OffthreadVideo src={staticFile("media/main.mp4")} trimBefore={Math.round(c.in * FPS)} volume={vol}
          style={{ position: "absolute", left: -PG.x * k, top: -PG.y * k, width: 1440 * k, height: 800 * k, maxWidth: "none" }} />
      </div>
    </AbsoluteFill>
  );
};

/** The son: native vertical clip, full frame. */
const KidClip: React.FC<{ c: Clip; n: number }> = ({ c, n }) => {
  const vol = (fr: number) => Math.min(1, (fr + 1) / 2, (n - fr) / 2);
  return (
    <AbsoluteFill style={{ backgroundColor: C.ink }}>
      <OffthreadVideo src={staticFile(`media/${c.src}.mp4`)} trimBefore={Math.round(c.in * FPS)} volume={vol} style={{ width: 1080, height: 1920 }} />
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 700, background: "linear-gradient(0deg, rgba(0,0,0,0.55), rgba(0,0,0,0))" }} />
    </AbsoluteFill>
  );
};

/** The son at the laptop: full-frame vertical cutaway, the author keeps talking. */
const Broll: React.FC<{ e: Ev }> = ({ e }) => {
  const f = useCurrentFrame();
  const p = interpolate(f, [0, 6], [0, 1], clamp) * interpolate(f, [(e.b - e.a) * FPS - 6, (e.b - e.a) * FPS], [1, 0], clamp);
  return (
    <AbsoluteFill style={{ opacity: p }}>
      <OffthreadVideo src={staticFile(`media/${e.src}.mp4`)} trimBefore={Math.round((e.at as number) * FPS)} muted style={{ width: 1080, height: 1920, transform: `scale(${1.04 + 0.03 * (f / ((e.b - e.a) * FPS))})` }} />
    </AbsoluteFill>
  );
};

/* ---------- text ---------- */
const Title: React.FC<{ lines: string[]; t: number; total: number; hidden: boolean }> = ({ lines, t, total, hidden }) => {
  const a = ease(t, 0.05, 0.45, EASE.pop), b = ease(t, 0.25, 0.45, EASE.pop);
  const vis = (hidden ? 0 : 1) * fadeOut(t, total, 0.3);
  const box = (txt: string, bg: string, p: number, rot: number) => (
    <div style={{ display: "inline-block", padding: "10px 26px 12px", background: bg, borderRadius: 6, transform: `rotate(${rot}deg) scale(${0.85 + 0.15 * p})`, opacity: p, boxShadow: "0 10px 30px rgba(0,0,0,0.35)" }}>
      <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 70, lineHeight: 1, color: C.ink, letterSpacing: -1 }}>{txt}</div>
    </div>
  );
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: 120, display: "flex", flexDirection: "column", alignItems: "center", gap: 14, opacity: vis, transition: "none" }}>
      {box(lines[0], C.cream, a, -2)}
      {box(lines[1], C.lime, b, 1.5)}
    </div>
  );
};

const Subtitles: React.FC<{ d: ReelData; t: number; hidden: boolean }> = ({ d, t, hidden }) => {
  const p = d.captions.find((c) => t >= c.start && t < c.end);
  if (!p || hidden) return null;
  const k = ease(t, p.start, 0.14);
  return (
    <div style={{ position: "absolute", left: 80, right: 110, top: 1300, display: "flex", flexDirection: "column", alignItems: "center", opacity: k, transform: `scale(${0.94 + 0.06 * k})` }}>
      {p.lines.map((ln, i) => (
        <div key={i} style={{ fontFamily: FONT, fontWeight: 800, fontSize: 60, lineHeight: 1.12, textAlign: "center", color: C.cream, textShadow: "0 3px 0 rgba(0,0,0,0.55), 0 0 18px rgba(0,0,0,0.6)", WebkitTextStroke: "1.5px rgba(0,0,0,0.35)" }}>
          {ln.map((w, j) => <span key={j} style={{ color: w.hl ? C.lime : C.cream }}>{w.w}{j < ln.length - 1 ? " " : ""}</span>)}
        </div>
      ))}
    </div>
  );
};

const glass: React.CSSProperties = { background: "linear-gradient(135deg, rgba(20,22,18,0.88), rgba(14,14,14,0.78))", border: "2px solid rgba(255,255,255,0.22)", borderRadius: 22, boxShadow: "inset 0 1px 0 rgba(255,255,255,0.22), 0 14px 40px rgba(0,0,0,0.35)" };

const Chip: React.FC<{ text: string; hl?: string[]; t: number; a: number; b: number; y?: number }> = ({ text, hl = [], t, a, b, y = 335 }) => {
  if (t < a - 0.1 || t > b + 0.4) return null;
  const p = ease(t, a, 0.4, EASE.pop) * fadeOut(t, b + 0.3, 0.3);
  return (
    <div style={{ position: "absolute", left: 50, right: 50, top: y, display: "flex", justifyContent: "center", opacity: p, transform: `translateY(${(1 - p) * 18}px)` }}>
      <div style={{ padding: "16px 28px", ...glass, fontFamily: FONT, fontWeight: 800, fontSize: 46, lineHeight: 1.15, color: C.cream, textAlign: "center" }}>
        {text.split(" ").map((w, i, arr) => <span key={i} style={{ color: hl.includes(w) ? C.lime : C.cream }}>{w}{i < arr.length - 1 ? " " : ""}</span>)}
      </div>
    </div>
  );
};

/** Graphics under the face bubble. */
const Below: React.FC<{ t: number; e: Ev; children: React.ReactNode }> = ({ t, e, children }) => {
  if (t < e.a - 0.05 || t > e.b + 0.3) return null;
  const p = overlayP(t, e.a, e.b);
  const top = BUBBLE.cy + BUBBLE.r + 30;
  return <div style={{ position: "absolute", left: 0, right: 0, top, height: FRAME.y + FRAME.h - top, display: "flex", alignItems: "center", justifyContent: "center", opacity: p, transform: `translateY(${(1 - p) * 30}px)` }}>{children}</div>;
};

const ShopCard: React.FC<{ t: number; e: Ev }> = ({ t, e }) => {
  const buy = e.focus === "buy";
  const R0 = buy ? { x: 40, y: 960, w: 1100, h: 400 } : { x: 60, y: 400, w: 1150, h: 560 };
  const Wd = 940, Ht = 560;
  const k = Math.min(Wd / R0.w, Ht / R0.h) * interpolate(t, [e.a, e.b], [1, 1.05], clamp);
  const pulse = 0.6 + 0.3 * Math.sin((t - e.a) * 3);
  return (
    <div style={{ position: "relative", width: Wd, height: Ht, borderRadius: 22, overflow: "hidden", background: "#fff", boxShadow: `0 0 0 3px rgba(200,255,0,${0.6 * pulse}), 0 0 60px rgba(200,255,0,${0.3 * pulse})` }}>
      <div style={{ position: "absolute", left: (Wd - R0.w * k) / 2 - R0.x * k, top: (Ht - R0.h * k) / 2 - R0.y * k, width: 2000 * k, height: 1403 * k }}>
        <Img src={staticFile("assets/shop.png")} style={{ width: 2000 * k, height: 1403 * k }} />
        {buy ? <div style={{ position: "absolute", left: 92 * k, top: 1242 * k, width: 116 * k, height: 42 * k, borderRadius: 8 * k, boxShadow: `0 0 0 4px ${C.lime}, 0 0 20px ${C.lime}`, opacity: ease(t, e.a + 0.8, 0.4) }} /> : null}
      </div>
      <div style={{ position: "absolute", left: 18, bottom: 16, padding: "8px 16px", borderRadius: 14, background: "rgba(14,14,14,0.85)", color: C.lime, fontFamily: FONT, fontWeight: 800, fontSize: 30 }}>{buy ? "покупки за XP" : "Магазин мира"}</div>
    </div>
  );
};

const SheetCard: React.FC<{ t: number; e: Ev }> = ({ t, e }) => {
  const rows = [
    { label: "Только ответ", note: "минимальный балл", w: 0.22, col: C.grey, at: e.a + 0.6 },
    { label: "Ответ + ход решения", note: "баллов больше", w: 0.92, col: C.lime, at: e.a + 5.2 },
  ];
  return (
    <div style={{ width: 900, padding: "34px 40px 40px", background: "#FBFAF6", borderRadius: 18, transform: "rotate(-1.5deg)", fontFamily: FONT, backgroundImage: "repeating-linear-gradient(0deg, transparent 0 50px, rgba(120,140,200,0.18) 50px 52px)" }}>
      <div style={{ fontWeight: 800, fontSize: 34, letterSpacing: 2, color: "#6A6F78" }}>ОЛИМПИАДА · ЗА ЧТО БАЛЛЫ</div>
      {rows.map((r, i) => {
        const q = ease(t, r.at, 0.6);
        return (
          <div key={i} style={{ marginTop: 34, opacity: q }}>
            <div style={{ fontWeight: 800, fontSize: 48, color: C.ink }}>{r.label}</div>
            <div style={{ marginTop: 12, height: 30, borderRadius: 15, background: "rgba(14,14,14,0.08)" }}><div style={{ height: 30, width: `${r.w * q * 100}%`, borderRadius: 15, background: r.col }} /></div>
            <div style={{ marginTop: 8, fontWeight: 700, fontSize: 36, color: i ? "#4C7A00" : "#6A6F78" }}>{r.note}</div>
          </div>
        );
      })}
    </div>
  );
};

const AlarmCard: React.FC<{ t: number; e: Ev }> = ({ t, e }) => {
  const run = interpolate(t, [e.a + 1, e.b - 2.5], [0, 1], clamp);
  const mins = Math.max(0, Math.round(60 * (1 - run)));
  const R = 150, L = 2 * Math.PI * R;
  return (
    <div style={{ width: 760, padding: "30px 34px", ...glass, fontFamily: FONT, color: C.cream, display: "flex", flexDirection: "column", alignItems: "center" }}>
      <div style={{ alignSelf: "flex-start", fontWeight: 700, fontSize: 30, letterSpacing: 3, color: C.lime }}>В ПЛАНАХ</div>
      <div style={{ position: "relative", width: 360, height: 360 }}>
        <svg width={360} height={360}>
          <circle cx={180} cy={180} r={R} stroke="rgba(255,255,255,0.15)" strokeWidth={20} fill="none" />
          <circle cx={180} cy={180} r={R} stroke={C.lime} strokeWidth={20} fill="none" strokeLinecap="round" strokeDasharray={L} strokeDashoffset={L * run} transform="rotate(-90 180 180)" />
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 96 }}>{String(mins).padStart(2, "0")}:00</div>
      </div>
      <div style={{ marginTop: 10, fontWeight: 800, fontSize: 52 }}>Будильник на <span style={{ color: C.lime }}>час</span></div>
    </div>
  );
};

const BranchCard: React.FC<{ t: number; e: Ev }> = ({ t, e }) => {
  const box = (txt: string, sub: string, col: string, at: number) => {
    const q = ease(t, at, 0.5, EASE.pop);
    return (
      <div style={{ width: 820, padding: "24px 30px", ...glass, borderColor: col, opacity: q, transform: `scale(${0.85 + 0.15 * q})` }}>
        <div style={{ fontWeight: 800, fontSize: 50, color: C.cream }}>{txt}</div>
        <div style={{ fontWeight: 600, fontSize: 32, color: col, marginTop: 4 }}>{sub}</div>
      </div>
    );
  };
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, fontFamily: FONT }}>
      {box("Школьная ветка", "с опережением · уверенность", C.lime, e.a + 0.2)}
      <div style={{ fontSize: 56, color: C.lime, opacity: ease(t, e.a + 1.6, 0.4), fontWeight: 800 }}>↓</div>
      {box("Олимпиадный режим", "сложность растёт постепенно", C.amber, e.a + 2.0)}
    </div>
  );
};

const SummaryCard: React.FC = () => (
  <div style={{ width: 860, padding: "36px 40px", background: C.cream, borderRadius: 26, fontFamily: FONT }}>
    <div style={{ fontWeight: 700, fontSize: 32, letterSpacing: 3, color: "rgba(14,14,14,0.6)" }}>ГЛАВНЫЙ ВЫВОД</div>
    <div style={{ marginTop: 10, fontWeight: 800, fontSize: 66, lineHeight: 1.1, color: C.ink }}>Не красиво, а чтобы <span style={{ background: C.lime, padding: "0 8px" }}>ничего не отвлекало</span></div>
  </div>
);

const Graphics: React.FC<{ d: ReelData; t: number; full: boolean }> = ({ d, t, full }) => {
  const ev = d.events;
  const chips: { text: string; hl?: string[]; a: number; b: number }[] = [];
  for (const e of ev) {
    if (e.kind === "thesis" || e.kind === "screen_note") chips.push({ text: e.text as string, hl: (e.hl as string[]) ?? [], a: e.a, b: e.b });
    if (e.kind === "list") {
      const items = e.items as { text: string; at: number }[];
      items.forEach((it, i) => chips.push({ text: `${i + 1}. ${it.text}`, a: it.at, b: Math.min(it.at + 4.2, items[i + 1]?.at ?? it.at + 4.2) - 0.1 }));
    }
  }
  return (
    <AbsoluteFill>
      {!full ? chips.map((c, i) => <Chip key={i} {...c} t={t} />) : null}
      {ev.filter((e) => e.kind === "screen_note").map((e, i) => (full ? <Chip key={`n${i}`} text={e.text as string} t={t} a={e.a} b={e.b} y={400} /> : null))}
      {!full ? ev.filter((e) => BUBBLE_KINDS.includes(e.kind)).map((e, i) => (
        <Below key={`o${i}`} t={t} e={e}>
          {e.kind === "shop" ? <ShopCard t={t} e={e} /> : e.kind === "sheet" ? <SheetCard t={t} e={e} /> : e.kind === "alarm" ? <AlarmCard t={t} e={e} /> : e.kind === "branch" ? <BranchCard t={t} e={e} /> : <SummaryCard />}
        </Below>
      )) : null}
    </AbsoluteFill>
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
    <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "14px 26px", borderRadius: 999, background: "#fff", opacity: p, transform: `scale(${0.8 + 0.2 * p})`, boxShadow: "0 14px 34px rgba(0,0,0,0.4)" }}>
      {logo}<div style={{ fontWeight: 800, fontSize: 44, color: C.ink }}>{txt}</div>
    </div>
  );
  return (
    <AbsoluteFill style={{ background: `radial-gradient(120% 80% at 50% 30%, #1E2414 0%, ${C.ink} 70%)`, opacity: bg, fontFamily: FONT }}>
      <div style={{ position: "absolute", top: 150, left: 0, right: 0, textAlign: "center", opacity: head, transform: `translateY(${(1 - head) * 30}px)` }}>
        <div style={{ display: "inline-block", padding: "10px 26px", background: C.cream, borderRadius: 6, transform: "rotate(-2deg)" }}>
          <div style={{ fontWeight: 800, fontSize: 72, color: C.ink, lineHeight: 1 }}>ПОЛНОЕ ВИДЕО</div>
        </div>
        <div style={{ marginTop: 14 }}>
          <div style={{ display: "inline-block", padding: "10px 26px", background: C.lime, borderRadius: 6, transform: "rotate(1.5deg)" }}>
            <div style={{ fontWeight: 800, fontSize: 64, color: C.ink, lineHeight: 1 }}>НА YOUTUBE И VK ВИДЕО</div>
          </div>
        </div>
        <div style={{ marginTop: 24, fontWeight: 700, fontSize: 36, color: "#ddd" }}>Все выводы после месяца занятий</div>
      </div>
      <div style={{ position: "absolute", left: 140, top: 560, width: 800, height: 780, opacity: phone, transform: `translateY(${(1 - phone) * 120}px) rotate(${(1 - phone) * 4}deg)` }}>
        <div style={{ width: 800, height: 780, borderRadius: 70, background: "#0A0A0C", padding: 22, boxSizing: "border-box", boxShadow: "0 40px 90px rgba(0,0,0,0.6), inset 0 0 0 3px #2B2E35" }}>
          <div style={{ width: "100%", height: "100%", borderRadius: 52, overflow: "hidden", background: "#0F0F10", position: "relative" }}>
            <div style={{ height: 70, display: "flex", alignItems: "center", gap: 14, padding: "0 30px", marginTop: 26 }}>
              <YouTubeLogo h={40} /><div style={{ fontWeight: 800, fontSize: 30, color: "#fff" }}>·</div><VKLogo h={42} />
            </div>
            <div style={{ margin: "8px 0 0", opacity: shot, transform: `scale(${0.9 + 0.1 * shot})` }}>
              <Img src={staticFile("assets/long_thumb.jpg")} style={{ width: "100%", display: "block" }} />
            </div>
            <div style={{ padding: "22px 30px", opacity: meta, transform: `translateY(${(1 - meta) * 16}px)` }}>
              <div style={{ fontWeight: 800, fontSize: 36, lineHeight: 1.2, color: "#fff" }}>Месяц занятий на тренажёре, который я сделала сыну</div>
              <div style={{ marginTop: 14, fontWeight: 700, fontSize: 28, color: "#aaa" }}>Александра Рулёва</div>
            </div>
          </div>
        </div>
        <div style={{ position: "absolute", left: 520, top: 300, width: 90, height: 90, borderRadius: 90, background: "rgba(255,255,255,0.75)", opacity: tap, transform: `scale(${0.6 + 0.6 * tap})` }} />
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 1400, display: "flex", justifyContent: "center", gap: 22 }}>
        {pill(yt, <YouTubeLogo h={50} />, "YouTube")}
        {pill(vk, <VKLogo h={54} />, "VK Видео")}
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 1530, display: "flex", justifyContent: "center", opacity: handle, transform: `scale(${0.85 + 0.15 * handle})` }}>
        <div style={{ padding: "16px 34px", borderRadius: 999, background: "rgba(255,255,255,0.1)", border: `2px solid ${C.lime}`, fontWeight: 800, fontSize: 60, color: C.cream }}>@Aleksarulezzz</div>
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
  const t = useCurrentFrame() / FPS;
  const total = d.duration;
  const cur = d.clips.find((c) => t >= c.out && t < c.out + c.dur);
  const broll = d.events.find((e) => e.kind === "broll" && t >= e.a && t < e.b);
  const kid = !!cur?.kid, screen = !!cur?.screen;
  const bubble = d.events.some((e) => BUBBLE_KINDS.includes(e.kind) && t >= e.a && t < e.b + 0.2);
  return (
    <AbsoluteFill style={{ backgroundColor: C.ink }}>
      {d.clips.map((c, i) => {
        const from = Math.round(c.out * FPS);
        const len = Math.round((c.out + c.dur) * FPS) - from;
        if (len <= 0) return null;
        return (
          <Sequence key={i} from={from} durationInFrames={len} premountFor={FPS}>
            {c.src === "main" ? <MainClip d={d} c={c} n={len} /> : <KidClip c={c} n={len} />}
          </Sequence>
        );
      })}
      {d.events.filter((e) => e.kind === "broll").map((e, i) => (
        <Sequence key={`b${i}`} from={Math.round(e.a * FPS)} durationInFrames={Math.max(1, Math.round((e.b - e.a) * FPS))} premountFor={FPS}>
          <Broll e={e} />
        </Sequence>
      ))}
      {t < total ? (
        <>
          <Graphics d={d} t={t} full={kid || screen || !!broll} />
          {kid ? (
            <div style={{ position: "absolute", left: 0, right: 0, top: 130, display: "flex", justifyContent: "center" }}>
              <div style={{ padding: "14px 30px", ...glass, fontFamily: FONT, fontWeight: 800, fontSize: 44, color: C.cream }}>Отвечает <span style={{ color: C.lime }}>главный пользователь</span></div>
            </div>
          ) : null}
          <Subtitles d={d} t={t} hidden={bubble} />
          <Title lines={d.title} t={t} total={total} hidden={kid} />
        </>
      ) : null}
      <Sequence from={Math.round(total * FPS)} durationInFrames={Math.round(END_CARD * FPS)}>
        <EndCard t={(useCurrentFrame() - Math.round(total * FPS)) / FPS} />
      </Sequence>
      {d.events.filter((e) => BUBBLE_KINDS.includes(e.kind)).map((e, i) => <SFX key={`w${i}`} at={e.a} kind="whoosh" vol={0.14} />)}
      <SFX at={total} kind="whoosh" vol={0.25} />
      <SFX at={total + 0.1} kind="swell" vol={0.25} />
      <SFX at={total + 1.4} kind="pop" vol={0.22} />
    </AbsoluteFill>
  );
};
