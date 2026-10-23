import React from "react";
import { AbsoluteFill, Audio, Img, OffthreadVideo, Sequence, interpolate, staticFile, useCurrentFrame } from "remotion";
import { C, EASE, FONT, FPS } from "../theme";
import { PlatformBadge } from "../components/ui";
import s1 from "./data/short_1.json";
import s2 from "./data/short_2.json";
import s3 from "./data/short_3.json";
import s4 from "./data/short_4.json";
import s5 from "./data/short_5.json";

/**
 * Vertical 1080×1920 short cut from the long video's raw recording.
 * Layout: title on top, the author full-width in the middle (never covered by text),
 * subtitles at chest height above the Reels/Shorts UI, graphics in the top zone or as
 * short full overlays on key thoughts, animated YouTube end card.
 */
type Word = { w: string; s: number; e: number; hl?: boolean };
type Page = { start: number; end: number; lines: Word[][] };
type ShortData = { id: number; file: string; title: string[]; clips: { out: number; in: number; dur: number }[]; duration: number; captions: Page[]; pmap: number[][] };
export const SHORTS: Record<number, ShortData> = { 1: s1, 2: s2, 3: s3, 4: s4, 5: s5 } as unknown as Record<number, ShortData>;
export const END_CARD = 3.8;

const SRC = staticFile("media/raw_sanitized.mp4");
const YELLOW = "#FFD60A";
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const ease = (t: number, a: number, d = 0.4, e = EASE.out) => interpolate(t, [a, a + d], [0, 1], { ...clamp, easing: e });
const fadeOut = (t: number, b: number, d = 0.3) => interpolate(t, [b - d, b], [1, 0], clamp);

// The author's frame: raw crop around the face (1440×900 recording, letterbox 45 px top).
const CROP = { x: 390, y: 45, w: 720, h: 810 };
const FRAME = { y: 470, w: 1080, h: 1215 }; // CROP scaled ×1.5

/* ---------- helpers: times of spoken words inside this short ---------- */
const norm = (w: string) => w.toLowerCase().replace(/ё/g, "е").replace(/[^\p{L}\d.]/gu, "").replace(/\.$/, "");
// start of the nth spoken occurrence of a whole word; a missing cue is a bug, so fail loudly
export const wordAt = (d: ShortData, word: string, nth = 1) => {
  let k = 0;
  for (const p of d.captions) for (const ln of p.lines) for (const w of ln) if (norm(w.w) === norm(word) && ++k === nth) return w.s;
  throw new Error(`short ${d.id}: cue "${word}" #${nth} not found`);
};

/* ---------- footage ---------- */
// key-thought overlays: the frame shrinks into a round bubble around the face, graphics go below it
const BUBBLE = { cy: 720, r: 240 }; // on screen
const PIP_SCALE = 0.55;
const overlayP = (t: number, a: number, b: number) => ease(t, a, 0.3) * fadeOut(t, b + 0.25, 0.3);

const Footage: React.FC<{ d: ShortData; pip: (t: number) => number }> = ({ d, pip }) => (
  <>
    {d.clips.map((c, i) => {
      const from = Math.round(c.out * FPS);
      const n = Math.round((c.out + c.dur) * FPS) - from;
      if (n <= 0) return null;
      return (
        <Sequence key={i} from={from} durationInFrames={n} premountFor={FPS}>
          <ClipLayer clip={c} idx={d.pmap.findIndex((p) => c.out < p[3] - 0.001)} pmap={d.pmap} n={n} pip={pip} />
        </Sequence>
      );
    })}
  </>
);

const ClipLayer: React.FC<{ clip: { out: number; in: number; dur: number }; idx: number; pmap: number[][]; n: number; pip: (t: number) => number }> = ({ clip, idx, pmap, n, pip }) => {
  const f = useCurrentFrame();
  const p = pip(clip.out + f / FPS);
  // face centre sits at ~470 px inside the frame; move it to the bubble centre while shrinking
  const sc = 1 - (1 - PIP_SCALE) * p;
  const dy = (BUBBLE.cy - FRAME.y - 470) * p;
  const r = interpolate(p, [0, 1], [1400, BUBBLE.r / PIP_SCALE]);
  // jump-cut framing: alternate medium / close on every jump cut (idx = piece), plus a slow push
  const [, o0, , o1] = pmap[idx];
  const zoom = (idx % 2 ? 1.14 : 1.0) + 0.03 * Math.min(1, (clip.out + f / FPS - o0) / (o1 - o0));
  const s = FRAME.w / CROP.w;
  const vol = (fr: number) => Math.min(1, (fr + 1) / 2, (n - fr) / 2);
  const video = (style: React.CSSProperties, muted: boolean) => (
    <OffthreadVideo src={SRC} trimBefore={Math.round(clip.in * FPS)} volume={muted ? 0 : vol} muted={muted} style={{ position: "absolute", maxWidth: "none", ...style }} />
  );
  return (
    <AbsoluteFill>
      {/* blurred backdrop fills the zones above and below the frame */}
      <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
        {video({ left: -700, top: -60, width: 2480, height: 1550, filter: "blur(38px) brightness(0.45)" }, true)}
      </div>
      <div style={{ position: "absolute", left: 0, top: FRAME.y, width: FRAME.w, height: FRAME.h, overflow: "hidden" }}>
        {p > 0 ? <div style={{ position: "absolute", inset: 0, background: `rgba(10,11,14,${0.93 * p})` }} /> : null}
        <div style={{ position: "absolute", inset: 0, transformOrigin: "540px 470px", transform: `translateY(${dy}px) scale(${sc})`, clipPath: p > 0 ? `circle(${r}px at 540px 470px)` : undefined }}>
        <div style={{ position: "absolute", inset: 0, transformOrigin: "50% 38%", transform: `scale(${zoom})` }}>
          {video({ left: -CROP.x * s, top: -CROP.y * s, width: 1440 * s, height: 900 * s }, false)}
        </div>
        {/* soft side and bottom shading so text reads well (never over the face) */}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg, rgba(0,0,0,0.38) 0%, rgba(0,0,0,0) 22%, rgba(0,0,0,0) 78%, rgba(0,0,0,0.38) 100%)" }} />
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 520, background: "linear-gradient(0deg, rgba(0,0,0,0.55), rgba(0,0,0,0))" }} />
        <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: 120, background: "linear-gradient(180deg, rgba(0,0,0,0.35), rgba(0,0,0,0))" }} />
        </div>
        {p > 0.02 ? <div style={{ position: "absolute", left: 540 - BUBBLE.r, top: BUBBLE.cy - FRAME.y - BUBBLE.r, width: 2 * BUBBLE.r, height: 2 * BUBBLE.r, borderRadius: "50%", boxSizing: "border-box", border: `6px solid ${YELLOW}`, opacity: Math.max(0, (p - 0.6) / 0.4) }} /> : null}
      </div>
    </AbsoluteFill>
  );
};

/* ---------- title in the style of the channel thumbnail ---------- */
const Title: React.FC<{ lines: string[]; t: number; total: number }> = ({ lines, t, total }) => {
  const a = ease(t, 0.05, 0.45, EASE.pop);
  const b = ease(t, 0.25, 0.45, EASE.pop);
  const out = fadeOut(t, total, 0.3);
  const box = (txt: string, bg: string, p: number, rot: number): React.ReactNode => (
    <div style={{ display: "inline-block", padding: "10px 26px 12px", background: bg, transform: `rotate(${rot}deg) scale(${0.85 + 0.15 * p})`, opacity: p, boxShadow: "0 10px 30px rgba(0,0,0,0.35)" }}>
      <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 76, lineHeight: 1, color: "#111", letterSpacing: -1 }}>{txt}</div>
    </div>
  );
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: 120, display: "flex", flexDirection: "column", alignItems: "center", gap: 14, opacity: out }}>
      {box(lines[0], "#FFFFFF", a, -2)}
      {box(lines[1], YELLOW, b, 1.5)}
    </div>
  );
};

/* ---------- subtitles: phrase pages, keyword colour, gentle pop ---------- */
const Subtitles: React.FC<{ d: ShortData; t: number; hideAt: (t: number) => boolean }> = ({ d, t, hideAt }) => {
  const p = d.captions.find((c) => t >= c.start && t < c.end);
  if (!p || hideAt(t)) return null;
  const k = ease(t, p.start, 0.14);
  return (
    <div style={{ position: "absolute", left: 90, right: 120, top: 1300, display: "flex", flexDirection: "column", alignItems: "center", opacity: k, transform: `scale(${0.94 + 0.06 * k})` }}>
      {p.lines.map((ln, i) => (
        <div key={i} style={{ fontFamily: FONT, fontWeight: 800, fontSize: 62, lineHeight: 1.12, textAlign: "center", color: "#fff", textShadow: "0 3px 0 rgba(0,0,0,0.55), 0 0 18px rgba(0,0,0,0.6)", WebkitTextStroke: "1.5px rgba(0,0,0,0.35)" }}>
          {ln.map((w, j) => (
            <span key={j} style={{ color: w.hl ? YELLOW : "#fff" }}>
              {w.w}
              {j < ln.length - 1 ? " " : ""}
            </span>
          ))}
        </div>
      ))}
    </div>
  );
};

/* ---------- small building blocks for the graphics ---------- */
const Chip: React.FC<{ t: number; a: number; b: number; children: React.ReactNode; tone?: "ok" | "no" | "plain"; y?: number }> = ({ t, a, b, children, tone = "plain", y = 380 }) => {
  if (t < a - 0.1 || t > b + 0.2) return null;
  const p = ease(t, a, 0.35, EASE.pop) * fadeOut(t, b, 0.25);
  const col = tone === "ok" ? "#2ECC71" : tone === "no" ? "#FF4D3D" : YELLOW;
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: y, display: "flex", justifyContent: "center", opacity: p, transform: `translateY(${(1 - p) * 20}px)` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "14px 26px", borderRadius: 18, background: "rgba(12,13,16,0.86)", border: `3px solid ${col}`, fontFamily: FONT, fontWeight: 800, fontSize: 40, color: "#fff" }}>
        {tone !== "plain" ? <Mark ok={tone === "ok"} /> : null}
        {children}
      </div>
    </div>
  );
};

const Mark: React.FC<{ ok: boolean }> = ({ ok }) => (
  <svg width={40} height={40} viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="11" fill={ok ? "#2ECC71" : "#FF4D3D"} />
    {ok ? <path d="M6.5 12.5l3.5 3.5 7.5-8" stroke="#fff" strokeWidth={2.6} fill="none" strokeLinecap="round" /> : <path d="M8 8l8 8M16 8l-8 8" stroke="#fff" strokeWidth={2.6} strokeLinecap="round" />}
  </svg>
);

/** Graphics for a key thought, below the face bubble (title stays visible). */
const Overlay: React.FC<{ t: number; a: number; b: number; children: (t: number) => React.ReactNode }> = ({ t, a, b, children }) => {
  if (t < a - 0.05 || t > b + 0.3) return null;
  const p = overlayP(t, a, b);
  const top = BUBBLE.cy + BUBBLE.r + 24;
  return (
    <div style={{ position: "absolute", left: 0, top, width: FRAME.w, height: FRAME.y + FRAME.h - top, opacity: p, transform: `translateY(${(1 - p) * 30}px)` }}>
      {children(t)}
    </div>
  );
};

const Row: React.FC<{ t: number; items: { at: number; node: React.ReactNode }[]; y?: number; gap?: number }> = ({ t, items, y = 370, gap = 22 }) => (
  <div style={{ position: "absolute", left: 0, right: 0, top: y, display: "flex", justifyContent: "center", gap }}>
    {items.map((it, i) => {
      const p = it.at < 0 ? 0 : ease(t, it.at, 0.35, EASE.pop);
      return (
        <div key={i} style={{ opacity: p, transform: `scale(${0.6 + 0.4 * p})` }}>
          {it.node}
        </div>
      );
    })}
  </div>
);

const Tile: React.FC<{ id: string; label?: string; size?: number }> = ({ id, label, size = 74 }) => (
  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
    <div style={{ width: size + 26, height: size + 26, borderRadius: 26, background: "rgba(255,255,255,0.95)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 8px 20px rgba(0,0,0,0.35)" }}>
      <PlatformBadge id={id} size={size} />
    </div>
    {label ? <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 24, color: "#fff" }}>{label}</div> : null}
  </div>
);

const VTile: React.FC<{ w?: number; h?: number; color?: string; label?: string }> = ({ w = 120, h = 210, color = YELLOW, label }) => (
  <div style={{ width: w, height: h, borderRadius: 18, background: "linear-gradient(160deg,#2A2E36,#14161A)", border: `3px solid ${color}`, display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
    <div style={{ width: 0, height: 0, borderTop: "16px solid transparent", borderBottom: "16px solid transparent", borderLeft: `26px solid ${color}`, marginLeft: 6 }} />
    {label ? <div style={{ position: "absolute", bottom: 10, fontFamily: FONT, fontWeight: 800, fontSize: 22, color: "#fff" }}>{label}</div> : null}
  </div>
);

const Big: React.FC<{ children: React.ReactNode; color?: string; size?: number }> = ({ children, color = "#fff", size = 66 }) => (
  <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: size, lineHeight: 1.08, color, textAlign: "center", letterSpacing: -1 }}>{children}</div>
);

/* ---------- per-short graphics ---------- */
const COLORS = ["#FF5A36", "#8EA6FF", "#F2C14E", "#5ED0A0", "#E8669B"];

const Graphics: React.FC<{ d: ShortData; t: number }> = ({ d, t }) => {
  const W = (w: string, n = 1) => wordAt(d, w, n);
  if (d.id === 1) {
    const ig = W("instagram");
    return (
      <>
        <Row t={t} y={360} gap={16} items={[{ at: W("youtube"), node: <Tile id="youtube" size={62} /> }, { at: ig, node: <Tile id="instagram" size={62} /> }, { at: W("telegram"), node: <Tile id="telegram" size={62} /> }, { at: W("вконтакте"), node: <Tile id="vk" size={62} /> }, { at: W("дзен"), node: <Tile id="dzen" size={62} /> }].map((x) => ({ ...x, at: t < W("теперь") - 0.3 ? x.at : -1 }))} />
        {t > ig - 0.1 && t < ig + 5 ? (
          <div style={{ position: "absolute", left: 40, right: 40, top: FRAME.y + 16, fontFamily: FONT, fontWeight: 600, fontSize: 24, lineHeight: 1.3, color: "#eee", background: "rgba(0,0,0,0.6)", padding: "8px 14px", borderRadius: 10, opacity: ease(t, ig, 0.3) * fadeOut(t, ig + 5) }}>
            * Instagram — продукт корпорации Meta, деятельность которой признана экстремистской в Российской Федерации.
          </div>
        ) : null}
        <Overlay t={t} a={W("одно")} b={W("причем") - 0.15}>
          {(tt) => (
            <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 24 }}>
              <div style={{ opacity: ease(tt, W("одно"), 0.4) }}>
                <div style={{ width: 380, height: 214, borderRadius: 20, background: "linear-gradient(160deg,#2A2E36,#14161A)", border: "3px solid #fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <PlatformBadge id="youtube" size={84} />
                </div>
                <Big size={52}>1 длинное видео</Big>
              </div>
              <div style={{ display: "flex", gap: 14 }}>
                {COLORS.map((c, i) => (
                  <div key={i} style={{ opacity: ease(tt, W("коротких") + i * 0.1, 0.35, EASE.pop) }}>
                    <VTile w={110} h={180} color={c} />
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", gap: 18 }}>
                {[["посты", W("текстовых")], ["статьи", W("статей")]].map(([l, a], i) => (
                  <div key={i} style={{ opacity: ease(tt, a as number, 0.35, EASE.pop), padding: "14px 30px", borderRadius: 16, background: i ? "#F5F2EC" : "#2A2E36", color: i ? "#111" : "#fff", fontFamily: FONT, fontWeight: 800, fontSize: 40 }}>
                    + {l as string}
                  </div>
                ))}
              </div>
            </div>
          )}
        </Overlay>
        <Chip t={t} a={W("каждую")} b={W("один") - 0.1} tone="no">каждый раз с нуля</Chip>
        <Chip t={t} a={W("один")} b={W("здесь") - 0.2} tone="ok">1 исходник → форматы</Chip>
        <Chip t={t} a={W("копируешь")} b={W("адаптируешь") - 0.05} tone="no">копия 1:1</Chip>
        <Chip t={t} a={W("адаптируешь")} b={d.duration} tone="ok">адаптация под площадку</Chip>
      </>
    );
  }
  if (d.id === 2) {
    return (
      <>
        <Chip t={t} a={0.6} b={W("когда", 2) - 0.2} tone="no">искать фрагменты после съёмки</Chip>
        <Chip t={t} a={W("кусочков")} b={W("поэтому") - 0.2}>5 кусочков Reels</Chip>
        <Chip t={t} a={W("поэтому")} b={W("поэтому", 2) - 0.2} tone="ok">заложить в сценарий</Chip>
        <Overlay t={t} a={W("поэтому", 2)} b={W("это") - 0.15}>
          {(tt) => {
            const a = W("поэтому", 2);
            const sp = ease(tt, W("линий"), 0.5);
            return (
              <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 22 }}>
                <Big size={52}>длинное видео</Big>
                <div style={{ width: 900 * ease(tt, a, 0.6, EASE.inOut), height: 70, borderRadius: 16, overflow: "hidden", display: "flex", background: "#2A2E36" }}>
                  {COLORS.map((c, i) => <div key={i} style={{ flex: 1, background: c, opacity: 0.25 + 0.75 * sp, borderRight: "4px solid #0A0B0E" }} />)}
                </div>
                <Big size={56} color={YELLOW}>5 смысловых линий</Big>
                <div style={{ display: "flex", gap: 14 }}>
                  {COLORS.map((c, i) => (
                    <div key={i} style={{ opacity: ease(tt, W("выделить") + i * 0.15, 0.35, EASE.pop) }}>
                      <VTile w={120} h={190} color={c} />
                    </div>
                  ))}
                </div>
                <Big size={52}>5 самостоятельных роликов</Big>
              </div>
            );
          }}
        </Overlay>
        <Chip t={t} a={W("это")} b={d.duration} tone="ok">всё решается на подготовке</Chip>
      </>
    );
  }
  if (d.id === 3) {
    const L = [["Собственная логика", W("логика")], ["Зацепка", W("зацепка")], ["Одна мысль", W("одна")], ["Завершение", W("завершение")]] as [string, number][];
    const K = [["Решает отдельную проблему", W("отдельную")], ["Понятен без контекста", W("без")], ["Даёт причину досмотреть", W("причину")]] as [string, number][];
    const list = (items: [string, number][], tt: number, hlIdx = -1) => (
      <div style={{ display: "flex", flexDirection: "column", gap: 20, padding: "0 90px" }}>
        {items.map(([txt, at], i) => {
          const p = ease(tt, at, 0.35, EASE.pop);
          return (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 24, opacity: p, transform: `translateX(${(1 - p) * 40}px)` }}>
              <Mark ok />
              <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 52, color: i === hlIdx ? YELLOW : "#fff" }}>{txt}</div>
            </div>
          );
        })}
      </div>
    );
    return (
      <>
        <Chip t={t} a={0.3} b={W("здесь") - 0.2} tone="no">5 случайных цитат ≠ 5 Reels</Chip>
        <Chip t={t} a={W("контексте")} b={W("короткого") - 0.3 - 0.1}>зритель не в контексте</Chip>
        <Overlay t={t} a={W("короткого") - 0.3} b={W("задаю") - 0.25}>
          {(tt) => <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", justifyContent: "center", gap: 28 }}><div style={{ textAlign: "center" }}><Big size={54} color={YELLOW}>у короткого ролика</Big></div>{list(L, tt)}</div>}
        </Overlay>
        <Overlay t={t} a={W("задаю")} b={W("именно") - 0.25}>
          {(tt) => <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", justifyContent: "center", gap: 28 }}><div style={{ textAlign: "center" }}><Big size={54} color={YELLOW}>критерии для нейросети</Big></div>{list(K, tt, 1)}</div>}
        </Overlay>
        <Chip t={t} a={W("именно")} b={d.duration} tone="ok">финальное решение — за вами</Chip>
      </>
    );
  }
  if (d.id === 4) {
    const tasks: [string, string, number, number][] = [
      ["youtube", "YouTube раскрывает тему целиком", W("youtube", 2), W("короткие")],
      ["reels", "Короткие цепляют одной мыслью", W("короткие"), W("telegram", 2)],
      ["telegram", "Telegram продолжает разговор", W("telegram", 2), W("текстовые")],
      ["text", "Тексты — удобно читать", W("текстовые"), W("то")],
    ];
    return (
      <>
        <Row t={t} y={360} gap={14} items={[{ at: W("youtube"), node: <Tile id="youtube" size={56} /> }, { at: W("пять"), node: <VTile w={82} h={82} label="" /> }, { at: W("telegram"), node: <Tile id="telegram" size={56} /> }, { at: W("вконтакте"), node: <Tile id="vk" size={56} /> }, { at: W("дзена"), node: <Tile id="dzen" size={56} /> }, { at: W("vc.ru"), node: <Tile id="vc" size={56} /> }].map((x) => ({ ...x, at: t < W("нюанс") ? x.at : -1 }))} />
        <Chip t={t} a={W("нюанс")} b={W("youtube", 2) - 0.2}>у каждой площадки — своя задача</Chip>
        {tasks.map(([id, txt, a, b], i) => (
          <Chip key={i} t={t} a={a} b={b - 0.15} tone="plain">
            {id === "reels" ? <VTile w={40} h={56} /> : id === "text" ? <span style={{ fontSize: 40 }}>Aa</span> : <PlatformBadge id={id} size={52} />}
            {txt}
          </Chip>
        ))}
        <Overlay t={t} a={W("систему") - 0.4} b={d.duration}>
          {(tt) => {
            const a = W("систему") - 0.4;
            return (
              <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 18 }}>
                <div style={{ opacity: ease(tt, a, 0.4), padding: "22px 40px", borderRadius: 20, background: YELLOW, fontFamily: FONT, fontWeight: 800, fontSize: 56, color: "#111" }}>1 идея</div>
                <svg width={700} height={80} style={{ opacity: ease(tt, a + 0.3, 0.4) }}>
                  {[0, 1, 2, 3, 4].map((i) => <path key={i} d={`M350 5 C350 45 ${70 + i * 140} 35 ${70 + i * 140} 78`} stroke="#fff" strokeWidth={4} fill="none" />)}
                </svg>
                <div style={{ display: "flex", gap: 14 }}>
                  {["youtube", "telegram", "vk", "dzen", "vc"].map((id, i) => (
                    <div key={id} style={{ opacity: ease(tt, a + 0.5 + i * 0.12, 0.35, EASE.pop) }}><Tile id={id} size={64} /></div>
                  ))}
                </div>
                <Big size={54} color={YELLOW}>разные форматы</Big>
              </div>
            );
          }}
        </Overlay>
      </>
    );
  }
  // id 5
  const days = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
  const filled = W("видео") ;
  return (
    <>
      <div style={{ position: "absolute", left: 0, right: 0, top: 352, display: "flex", justifyContent: "center", gap: 10, opacity: Math.max(1 - ease(t, W("опубликовать") - 0.25, 0.25), ease(t, W("знаю"), 0.3)) * (1 - ease(t, W("свободна") - 0.3, 0.3)) }}>
        {days.map((dn, i) => {
          const has = i < 5;
          const p = has ? ease(t, filled + i * 0.12, 0.35, EASE.pop) : 0;
          return (
            <div key={dn} style={{ width: 118, height: 128, borderRadius: 16, background: "rgba(12,13,16,0.85)", border: `2px solid ${has && p > 0.5 ? YELLOW : "#3A3F48"}`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8 }}>
              <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 26, color: "#ccc" }}>{dn}</div>
              <div style={{ opacity: p, transform: `scale(${0.6 + 0.4 * p})` }}>{has ? <VTile w={38} h={56} /> : null}</div>
            </div>
          );
        })}
      </div>
      <Chip t={t} a={W("опубликовать")} b={W("знаю") - 0.2} tone="no">«что публиковать завтра?»</Chip>
      <Chip t={t} a={W("свободна")} b={W("какие-то") - 0.2} tone="ok">свобода для творчества</Chip>
      <Chip t={t} a={W("один")} b={W("знаю", 2) - 0.2}>1 · 3 · 5 новых роликов — как пойдёт</Chip>
      <Chip t={t} a={W("знаю", 2)} b={W("постепенно") - 0.4} tone="ok">базовая история закрыта</Chip>
      <Row t={t} y={352} gap={18} items={["youtube", "telegram", "vk", "dzen"].map((id, i) => ({ at: t >= W("постепенно") ? W("постепенно") + i * 0.5 : -1, node: <Tile id={id} size={60} /> }))} />
    </>
  );
};

/* ---------- end card: phone with the long video, channel handle ---------- */
const EndCard: React.FC<{ t: number }> = ({ t }) => {
  const bg = ease(t, 0, 0.35);
  const head = ease(t, 0.15, 0.45, EASE.pop);
  const phone = ease(t, 0.35, 0.6, EASE.out);
  const thumb = ease(t, 0.75, 0.45, EASE.pop);
  const meta = ease(t, 1.05, 0.4);
  const handle = ease(t, 1.4, 0.45, EASE.pop);
  const tap = interpolate(t, [2.2, 2.45, 2.7], [0, 1, 0], clamp);
  return (
    <AbsoluteFill style={{ background: `radial-gradient(120% 80% at 50% 30%, #23262D 0%, #0B0C0F 70%)`, opacity: bg, fontFamily: FONT }}>
      <div style={{ position: "absolute", top: 170, left: 0, right: 0, textAlign: "center", opacity: head, transform: `translateY(${(1 - head) * 30}px)` }}>
        <div style={{ display: "inline-block", padding: "10px 26px", background: "#fff", transform: "rotate(-2deg)" }}>
          <div style={{ fontWeight: 800, fontSize: 70, color: "#111", lineHeight: 1 }}>ПОДРОБНОЕ ВИДЕО</div>
        </div>
        <div style={{ marginTop: 14 }}>
          <div style={{ display: "inline-block", padding: "10px 26px", background: YELLOW, transform: "rotate(1.5deg)" }}>
            <div style={{ fontWeight: 800, fontSize: 70, color: "#111", lineHeight: 1 }}>УЖЕ НА YOUTUBE</div>
          </div>
        </div>
        <div style={{ marginTop: 26, fontWeight: 700, fontSize: 38, color: "#ddd" }}>Вся система — от идеи до публикаций</div>
      </div>
      {/* phone */}
      <div style={{ position: "absolute", left: 160, top: 560, width: 760, height: 900, opacity: phone, transform: `translateY(${(1 - phone) * 120}px) rotate(${(1 - phone) * 4}deg)` }}>
        <div style={{ width: 760, height: 900, borderRadius: 70, background: "#0A0A0C", padding: 22, boxSizing: "border-box", boxShadow: "0 40px 90px rgba(0,0,0,0.6), inset 0 0 0 3px #2B2E35" }}>
          <div style={{ width: "100%", height: "100%", borderRadius: 52, overflow: "hidden", background: "#0F0F10", position: "relative" }}>
            <div style={{ height: 70, display: "flex", alignItems: "center", gap: 14, padding: "0 30px", marginTop: 34 }}>
              <PlatformBadge id="youtube" size={46} />
              <div style={{ fontWeight: 800, fontSize: 30, color: "#fff" }}>YouTube</div>
            </div>
            <div style={{ margin: "10px 0 0", opacity: thumb, transform: `scale(${0.9 + 0.1 * thumb})` }}>
              <Img src={staticFile("assets/yt_thumbnail.jpg")} style={{ width: "100%", display: "block" }} />
            </div>
            <div style={{ padding: "24px 30px", opacity: meta, transform: `translateY(${(1 - meta) * 16}px)` }}>
              <div style={{ fontWeight: 800, fontSize: 34, lineHeight: 1.2, color: "#fff" }}>Снимаю одно видео и получаю контент на всю неделю. Показываю как</div>
              <div style={{ marginTop: 18, display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ width: 56, height: 56, borderRadius: 56, background: "linear-gradient(135deg,#E8B59A,#A0715B)" }} />
                <div style={{ fontWeight: 700, fontSize: 28, color: "#aaa" }}>Александра Рулёва</div>
              </div>
            </div>
          </div>
        </div>
        {/* tap on the video */}
        <div style={{ position: "absolute", left: 500, top: 330, width: 90, height: 90, borderRadius: 90, background: "rgba(255,255,255,0.75)", opacity: tap, transform: `scale(${0.6 + 0.6 * tap})` }} />
      </div>
      {/* handle */}
      <div style={{ position: "absolute", left: 0, right: 0, top: 1500, display: "flex", justifyContent: "center", opacity: handle, transform: `scale(${0.8 + 0.2 * handle})` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 20, padding: "18px 34px", borderRadius: 999, background: "#fff", boxShadow: "0 16px 40px rgba(0,0,0,0.45)" }}>
          <svg width={74} height={52} viewBox="0 0 28 20"><rect width="28" height="20" rx="5.5" fill="#FF0000" /><path d="M11 6v8l7-4z" fill="#fff" /></svg>
          <div style={{ fontWeight: 800, fontSize: 54, color: "#111" }}>@aleksarulezzz</div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

/* ---------- composition ---------- */
const SFX: React.FC<{ at: number; kind: string; vol?: number }> = ({ at, kind, vol = 0.25 }) =>
  at < 0 ? null : (
    <Sequence from={Math.max(0, Math.round(at * FPS))} durationInFrames={Math.round(1.2 * FPS)}>
      <Audio src={staticFile(`sfx/${kind}.wav`)} volume={vol} />
    </Sequence>
  );

export const Short: React.FC<{ id: number }> = ({ id }) => {
  const d = SHORTS[id];
  const t = useCurrentFrame() / FPS;
  const total = d.duration;
  const W = (w: string, n = 1) => wordAt(d, w, n);
  // subtitles are hidden while a full overlay explains the same words
  const overlayRanges: [number, number][] =
    id === 1 ? [[W("одно"), W("причем") - 0.15]] : id === 2 ? [[W("поэтому", 2), W("это") - 0.15]] : id === 3 ? [[W("короткого") - 0.3, W("задаю") - 0.25], [W("задаю"), W("именно") - 0.25]] : id === 4 ? [[W("систему") - 0.4, total]] : [];
  const sfx: [number, string][] =
    id === 1 ? [[W("одно"), "whoosh"], [W("каждую"), "click"], [W("один"), "pop"], [W("адаптируешь"), "pop"]] :
    id === 2 ? [[0.6, "click"], [W("поэтому", 2), "whoosh"], [W("это"), "pop"]] :
    id === 3 ? [[0.3, "click"], [W("короткого") - 0.3, "whoosh"], [W("задаю"), "whoosh"], [W("именно"), "pop"]] :
    id === 4 ? [[W("нюанс"), "click"], [W("систему") - 0.4, "whoosh"]] :
    [[W("видео"), "pop"], [W("свободна"), "pop"], [W("постепенно"), "click"]];
  return (
    <AbsoluteFill style={{ backgroundColor: "#0B0C0F" }}>
      <Footage d={d} pip={(x) => Math.max(0, ...overlayRanges.map(([a, b]) => overlayP(x, a, b)))} />
      {t < total ? (
        <>
          <Graphics d={d} t={t} />
          <Subtitles d={d} t={t} hideAt={(x) => overlayRanges.some(([a, b]) => x >= a && x < b + 0.2)} />
          <Title lines={d.title} t={t} total={total} />
        </>
      ) : null}
      <Sequence from={Math.round(total * FPS)} durationInFrames={Math.round(END_CARD * FPS)}>
        <EndCard t={(useCurrentFrame() - Math.round(total * FPS)) / FPS} />
      </Sequence>
      {sfx.map(([at, k], i) => <SFX key={i} at={at} kind={k} />)}
      <SFX at={total} kind="whoosh" vol={0.3} />
      <SFX at={total + 0.1} kind="swell" vol={0.3} />
      <SFX at={total + 1.4} kind="pop" vol={0.28} />
    </AbsoluteFill>
  );
};
