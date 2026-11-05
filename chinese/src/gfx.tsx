import React from "react";
import { AbsoluteFill, Audio, Sequence, interpolate, staticFile, useCurrentFrame } from "remotion";
import { C, EASE, FONT, FPS, W } from "./theme";
import gfx from "./data/gfx.json";
import captions from "./data/captions.json";

type Ev = { kind: string; a: number; b: number; [k: string]: unknown };
const EV = gfx.events as Ev[];
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const ease = (t: number, a: number, d = 0.45, e = EASE.out) => interpolate(t, [a, a + d], [0, 1], { ...clamp, easing: e });
const out = (t: number, b: number, d = 0.35) => interpolate(t, [b - d, b], [1, 0], clamp);
const on = (e: Ev, t: number, pad = 0.4) => t >= e.a - 0.05 && t < e.b + pad;

/* ---------- Liquid Glass in light blue ---------- */
const glass: React.CSSProperties = {
  background: "linear-gradient(135deg, rgba(220,239,251,0.92), rgba(159,211,242,0.72))",
  backdropFilter: "blur(20px) saturate(1.4)",
  border: "1.5px solid rgba(255,255,255,0.85)",
  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.95), inset 0 -10px 30px rgba(58,143,214,0.12), 0 16px 44px rgba(28,46,68,0.22)",
  borderRadius: 26,
};

const Words: React.FC<{ text: string; hl?: string[] }> = ({ text, hl = [] }) => (
  <>
    {text.split(" ").map((w, i, a) => (
      <span key={i} style={{ color: hl.includes(w) ? C.accent : C.ink }}>{w}{i < a.length - 1 ? " " : ""}</span>
    ))}
  </>
);

const THESES = EV.filter((e) => e.kind === "thesis");
const slotOf = (e: Ev) => THESES.filter((x) => x !== e && x.a < e.a && x.b > e.a).length % 2;

const Thesis: React.FC<{ e: Ev; t: number }> = ({ e, t }) => {
  const p = ease(t, e.a, 0.5) * out(t, e.b + 0.35);
  return (
    <div style={{ position: "absolute", left: 70, top: 200 + slotOf(e) * 160, maxWidth: 640, padding: "22px 32px", ...glass, opacity: p,
      transform: `translateX(${(1 - p) * -40}px)`, filter: `blur(${(1 - p) * 6}px)`, fontFamily: FONT, fontWeight: 800, fontSize: 46, lineHeight: 1.15, letterSpacing: -0.5 }}>
      <Words text={e.text as string} hl={e.hl as string[]} />
    </div>
  );
};

const Chapter: React.FC<{ e: Ev; t: number }> = ({ e, t }) => {
  const p = ease(t, e.a + 0.1, 0.55) * out(t, e.b + 0.4, 0.45);
  return (
    <div style={{ position: "absolute", left: 70, top: 300, padding: "28px 40px 32px", ...glass, opacity: p, transform: `translateY(${(1 - p) * 30}px) scale(${0.96 + 0.04 * p})`, fontFamily: FONT }}>
      <div style={{ fontWeight: 700, fontSize: 24, letterSpacing: 5, color: C.accent }}>ГЛАВА {String((e.n as number) + 3).padStart(2, "0")}</div>
      <div style={{ marginTop: 6, fontWeight: 800, fontSize: 60, lineHeight: 1.05, color: C.ink, letterSpacing: -1 }}>{e.title as string}</div>
      <div style={{ marginTop: 16, height: 7, width: `${p * 150}px`, background: C.accent, borderRadius: 4 }} />
    </div>
  );
};

/** glass wave across the frame at a chapter boundary; the direction changes every time */
const Sweep: React.FC<{ e: Ev; t: number }> = ({ e, t }) => {
  const n = e.n as number;
  const p = interpolate(t, [e.a - 0.35, e.a + 0.55], [0, 1], { ...clamp, easing: EASE.inOut });
  if (p <= 0 || p >= 1) return null;
  const band: React.CSSProperties = {
    position: "absolute", backdropFilter: "blur(14px) saturate(1.5) brightness(1.06)",
    background: "linear-gradient(90deg, rgba(220,239,251,0), rgba(220,239,251,0.38) 45%, rgba(159,211,242,0.28) 55%, rgba(220,239,251,0))",
    boxShadow: "inset 0 0 0 1.5px rgba(255,255,255,0.6)",
  };
  const dir = n % 3;
  if (dir === 2) return <div style={{ ...band, left: -100, width: W + 200, height: 420, top: -500 + p * 2100, transform: "skewY(-6deg)" }} />;
  const x = dir === 0 ? -700 + p * 3300 : W + 100 - p * 3300;
  return <div style={{ ...band, top: -100, height: 1300, width: 560, left: x, transform: `skewX(${dir === 0 ? -14 : 14}deg)` }} />;
};

const About: React.FC<{ e: Ev; t: number }> = ({ e, t }) => {
  const p = ease(t, e.a, 0.5) * out(t, e.b);
  return (
    <div style={{ position: "absolute", left: 70, top: 640, padding: "24px 34px", ...glass, opacity: p, transform: `translateX(${(1 - p) * -40}px)`, fontFamily: FONT, maxWidth: 720 }}>
      <div style={{ fontWeight: 800, fontSize: 48, color: C.ink }}>Александра Рулёва</div>
      <div style={{ marginTop: 6, fontWeight: 700, fontSize: 30, color: C.accent }}>сайты, боты и тренажёры с нейросетями</div>
    </div>
  );
};

const List: React.FC<{ e: Ev; t: number }> = ({ e, t }) => {
  const items = e.items as { text: string; at: number }[];
  const p = ease(t, e.a, 0.5) * out(t, e.b);
  return (
    <div style={{ position: "absolute", left: 70, top: 160, width: 680, padding: "26px 32px", ...glass, opacity: p, fontFamily: FONT }}>
      <div style={{ fontWeight: 700, fontSize: 26, letterSpacing: 3, color: C.accent }}>{(e.title as string).toUpperCase()}</div>
      {items.map((it, i) => {
        const q = ease(t, it.at, 0.45, EASE.pop);
        return (
          <div key={i} style={{ display: "flex", gap: 16, alignItems: "baseline", marginTop: 16, opacity: q, transform: `translateX(${(1 - q) * -30}px)` }}>
            <div style={{ fontWeight: 800, fontSize: 32, color: C.accent, minWidth: 28 }}>{i + 1}</div>
            <div style={{ fontWeight: 800, fontSize: 36, lineHeight: 1.15, color: C.ink }}>{it.text}</div>
          </div>
        );
      })}
    </div>
  );
};

/** What worked in the trainer: keep / add / working on. Only what she names in the video. */
const TIER = [
  { label: "ОСТАВЛЯЕМ", bg: C.accent, fg: C.white, items: ["Цифровая пропись", "Проверка интонации", "План дня из 3 пунктов", "Герой и магазин"] },
  { label: "ДОБАВЛЯЕМ", bg: C.blue, fg: C.ink, items: ["Будильник", "Красивый дизайн", "Работа над героем"] },
  { label: "НАД ЧЕМ РАБОТАЕМ", bg: C.glass, fg: C.ink, items: ["Заниматься каждый день"] },
];
const Tier: React.FC<{ e: Ev; t: number }> = ({ e, t }) => {
  const p = ease(t, e.a, 0.45) * out(t, e.b, 0.4);
  let k = 0;
  return (
    <AbsoluteFill style={{ opacity: p, backdropFilter: `blur(${16 * p}px)`, background: `rgba(234,245,252,${0.7 * p})`, fontFamily: FONT }}>
      <div style={{ position: "absolute", left: 190, top: 90, fontWeight: 800, fontSize: 58, color: C.ink, letterSpacing: -1 }}>Что в тренажёре сработало</div>
      {TIER.map((r, i) => (
        <div key={i} style={{ position: "absolute", left: 190, top: 205 + i * 235, width: 1540, height: 205, display: "flex", alignItems: "center", gap: 20, ...glass }}>
          <div style={{ width: 330, height: "100%", borderRadius: 26, background: r.bg, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 32,
            color: r.fg, textAlign: "center", padding: "0 16px", boxSizing: "border-box", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.6)" }}>{r.label}</div>
          {r.items.map((it) => {
            const at = e.a + 0.4 + 0.33 * k++;
            const q = ease(t, at, 0.4, EASE.pop);
            return (
              <div key={it} style={{ padding: "18px 24px", borderRadius: 18, background: "rgba(255,255,255,0.95)", fontWeight: 800, fontSize: 30, color: C.ink, opacity: q,
                transform: `translateY(${(1 - q) * -70}px) rotate(${(1 - q) * -5}deg)`, boxShadow: "0 10px 26px rgba(28,46,68,0.18)", border: `2px solid ${C.blue}` }}>{it}</div>
            );
          })}
        </div>
      ))}
    </AbsoluteFill>
  );
};

/* ---------- graphics layer ---------- */
const covers = (t: number) =>
  EV.some((e) => (e.kind === "broll" && e.mode === "full" && on(e, t, 0)) || (e.kind === "screen" && e.mode === "full" && on(e, t, 0)) || (e.kind === "tier" && on(e, t, 0)) || (e.kind === "pron" && on(e, t, 0)));
const wallBusy = (t: number) => EV.some((e) => ((e.kind === "screen" && e.mode === "window") || (e.kind === "broll" && (e.mode === "card" || e.mode === "photo"))) && on(e, t, 0.2));

export const Graphics: React.FC = () => {
  const t = useCurrentFrame() / FPS;
  const vis = EV.filter((e) => on(e, t, 0.6));
  const hidden = covers(t);
  const wall = !hidden && !wallBusy(t);
  return (
    <AbsoluteFill>
      {wall ? vis.filter((e) => e.kind === "thesis").map((e, i) => <Thesis key={`t${i}`} e={e} t={t} />) : null}
      {!hidden ? vis.filter((e) => e.kind === "list").map((e, i) => <List key={`l${i}`} e={e} t={t} />) : null}
      {!hidden ? vis.filter((e) => e.kind === "about").map((e, i) => <About key={`a${i}`} e={e} t={t} />) : null}
      {!hidden ? vis.filter((e) => e.kind === "chapter").map((e, i) => <Chapter key={`c${i}`} e={e} t={t} />) : null}
      {vis.filter((e) => e.kind === "tier").map((e, i) => <Tier key={`r${i}`} e={e} t={t} />)}
      {EV.filter((e) => e.kind === "chapter" && t > e.a - 0.4 && t < e.a + 0.6).map((e, i) => <Sweep key={`w${i}`} e={e} t={t} />)}
      {EV.filter((e) => e.kind === "tier").map((e, i) => (
        <React.Fragment key={`ts${i}`}>
          {[0, 1, 2, 3, 4, 5, 6, 7].map((j) => (
            <Sequence key={j} from={Math.round((e.a + 0.4 + 0.33 * j) * FPS)} durationInFrames={20}>
              <Audio src={staticFile("sfx/click.wav")} volume={0.07} />
            </Sequence>
          ))}
        </React.Fragment>
      ))}
    </AbsoluteFill>
  );
};

/* ---------- subtitles: white on a dark-blue pill, keywords in soft blue ---------- */
type Page = { start: number; end: number; words: { w: string; s: number; e: number; hl: boolean }[] };
const PAGES = captions as Page[];
export const Subtitles: React.FC = () => {
  const t = useCurrentFrame() / FPS;
  const p = PAGES.find((x) => t >= x.start && t < x.end);
  if (!p) return null;
  const k = ease(t, p.start, 0.12);
  const compact = EV.some((e) => (e.kind === "depth" || e.kind === "tier") && on(e, t, 0));
  return (
    <div style={{ position: "absolute", left: 0, right: 0, bottom: compact ? 50 : 64, display: "flex", justifyContent: "center", opacity: k }}>
      <div style={{ maxWidth: 1400, padding: compact ? "8px 20px 10px" : "12px 26px 14px", borderRadius: 18, background: "rgba(28,46,68,0.78)", backdropFilter: "blur(10px)",
        fontFamily: FONT, fontWeight: 700, fontSize: compact ? 36 : 42, lineHeight: 1.2, color: C.white, textAlign: "center", transform: `translateY(${(1 - k) * 6}px)` }}>
        {p.words.map((w, i) => (
          <span key={i} style={{ color: w.hl ? C.blue : C.white }}>{w.w}{i < p.words.length - 1 ? " " : ""}</span>
        ))}
      </div>
    </div>
  );
};
