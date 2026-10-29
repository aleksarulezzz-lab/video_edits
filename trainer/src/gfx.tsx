import React from "react";
import { AbsoluteFill, Img, OffthreadVideo, interpolate, staticFile, useCurrentFrame } from "remotion";
import { C, EASE, FONT, FPS, W } from "./theme";
import gfx from "./data/gfx.json";
import captions from "./data/captions.json";

type Ev = { kind: string; a: number; b: number; [k: string]: unknown };
export const EV = gfx.events as Ev[];
type Clip = { src: string; out: number; dur: number; kid: boolean; screen: boolean };

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const ease = (t: number, a: number, d = 0.45, e = EASE.out) => interpolate(t, [a, a + d], [0, 1], { ...clamp, easing: e });
const out = (t: number, b: number, d = 0.35) => interpolate(t, [b - d, b], [1, 0], clamp);
const active = (e: Ev, t: number, pad = 0.4) => t >= e.a - 0.05 && t < e.b + pad;

/* ---------- Liquid Glass building blocks ---------- */
const glassDark: React.CSSProperties = {
  background: "linear-gradient(135deg, rgba(20,22,18,0.86), rgba(14,14,14,0.74))",
  backdropFilter: "blur(18px) saturate(1.3)",
  border: "1.5px solid rgba(255,255,255,0.22)",
  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.25), 0 18px 50px rgba(0,0,0,0.28)",
  borderRadius: 26,
};
const glassLight: React.CSSProperties = {
  background: "linear-gradient(135deg, rgba(255,255,255,0.55), rgba(255,255,255,0.22))",
  backdropFilter: "blur(22px) saturate(1.6)",
  border: "1.5px solid rgba(255,255,255,0.7)",
  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.9), 0 20px 60px rgba(0,0,0,0.18)",
  borderRadius: 28,
};

const Words: React.FC<{ text: string; hl?: string[]; color?: string }> = ({ text, hl = [], color = C.cream }) => (
  <>
    {text.split(" ").map((w, i, a) => (
      <span key={i} style={{ color: hl.includes(w) ? C.lime : color }}>{w}{i < a.length - 1 ? " " : ""}</span>
    ))}
  </>
);

/* ---------- theses on the left wall ---------- */
const THESES = EV.filter((e) => e.kind === "thesis");
const slotOf = (e: Ev) => THESES.filter((x) => x !== e && x.a < e.a && x.b > e.a).length % 2;

const Thesis: React.FC<{ e: Ev; t: number }> = ({ e, t }) => {
  const p = ease(t, e.a, 0.5) * out(t, e.b + 0.35);
  return (
    <div style={{ position: "absolute", left: 70, top: 250 + slotOf(e) * 170, maxWidth: 600, padding: "24px 32px", ...glassDark, opacity: p,
      transform: `translateX(${(1 - p) * -40}px)`, filter: `blur(${(1 - p) * 6}px)`, fontFamily: FONT, fontWeight: 800, fontSize: 46, lineHeight: 1.15, letterSpacing: -0.5 }}>
      <Words text={e.text as string} hl={e.hl as string[]} />
    </div>
  );
};

/* ---------- chapter card + glass sweep transition ---------- */
const Chapter: React.FC<{ e: Ev; t: number }> = ({ e, t }) => {
  const n = e.n as number;
  const p = ease(t, e.a + 0.1, 0.6) * out(t, e.b + 0.4, 0.45);
  return (
    <div style={{ position: "absolute", left: 70, top: 330, padding: "30px 40px 34px", ...glassLight, opacity: p, transform: `translateY(${(1 - p) * 30}px) scale(${0.96 + 0.04 * p})`, fontFamily: FONT, maxWidth: 640 }}>
      <div style={{ fontWeight: 700, fontSize: 26, letterSpacing: 4, color: "rgba(14,14,14,0.6)" }}>ГЛАВА {String(n + 3).padStart(2, "0")}</div>
      <div style={{ marginTop: 6, fontWeight: 800, fontSize: 58, lineHeight: 1.05, color: C.ink, letterSpacing: -1 }}>{e.title as string}</div>
      <div style={{ marginTop: 16, height: 8, width: `${p * 140}px`, background: C.lime, borderRadius: 4 }} />
    </div>
  );
};

const Sweep: React.FC<{ e: Ev; t: number }> = ({ e, t }) => {
  const n = e.n as number;
  const p = interpolate(t, [e.a - 0.35, e.a + 0.5], [0, 1], { ...clamp, easing: EASE.inOut });
  if (p <= 0 || p >= 1) return null;
  const dir = n % 3; // left→right, right→left, top→down
  const band: React.CSSProperties = {
    position: "absolute", backdropFilter: "blur(16px) saturate(1.5) brightness(1.08)",
    background: "linear-gradient(90deg, rgba(255,255,255,0.0), rgba(255,255,255,0.22) 45%, rgba(200,255,0,0.12) 55%, rgba(255,255,255,0.0))",
    boxShadow: "inset 0 0 0 1.5px rgba(255,255,255,0.35)",
  };
  if (dir === 2) return <div style={{ ...band, left: -100, width: W + 200, height: 420, top: -500 + p * 2100, transform: "skewY(-6deg)" }} />;
  const x = dir === 0 ? -700 + p * 3300 : W + 100 - p * 3300;
  return <div style={{ ...band, top: -100, height: 1300, width: 560, left: x, transform: `skewX(${dir === 0 ? -14 : 14}deg)` }} />;
};

/* ---------- small cards ---------- */
const About: React.FC<{ e: Ev; t: number }> = ({ e, t }) => {
  const p = ease(t, e.a, 0.5) * out(t, e.b);
  return (
    <div style={{ position: "absolute", left: 70, top: 640, padding: "26px 34px", ...glassDark, opacity: p, transform: `translateX(${(1 - p) * -40}px)`, fontFamily: FONT, color: C.cream, maxWidth: 700 }}>
      <div style={{ fontWeight: 800, fontSize: 48 }}>Александра Рулёва</div>
      <div style={{ marginTop: 6, fontWeight: 600, fontSize: 28, lineHeight: 1.3 }}>маркетолог и продюсер · <span style={{ color: C.lime }}>сайты, боты и автоматизации с нейросетями</span></div>
    </div>
  );
};

const List: React.FC<{ e: Ev; t: number }> = ({ e, t }) => {
  const items = e.items as { text: string; at: number }[];
  const p = ease(t, e.a, 0.5) * out(t, e.b);
  return (
    <div style={{ position: "absolute", left: 70, top: 190, width: 640, padding: "28px 32px", ...glassDark, opacity: p, fontFamily: FONT, color: C.cream }}>
      <div style={{ fontWeight: 700, fontSize: 26, letterSpacing: 3, color: C.lime }}>{(e.title as string).toUpperCase()}</div>
      {items.map((it, i) => {
        const q = ease(t, it.at, 0.45, EASE.pop);
        return (
          <div key={i} style={{ display: "flex", gap: 16, alignItems: "baseline", marginTop: 18, opacity: q, transform: `translateX(${(1 - q) * -30}px)` }}>
            <div style={{ fontWeight: 800, fontSize: 30, color: C.lime, minWidth: 30 }}>{i + 1}</div>
            <div style={{ fontWeight: 800, fontSize: 38, lineHeight: 1.15 }}>{it.text}</div>
          </div>
        );
      })}
    </div>
  );
};

const Summary: React.FC<{ e: Ev; t: number }> = ({ e, t }) => {
  const p = ease(t, e.a, 0.5) * out(t, e.b);
  return (
    <div style={{ position: "absolute", left: 70, top: 300, width: 640, padding: "34px 38px", ...glassLight, opacity: p, transform: `scale(${0.95 + 0.05 * p})`, fontFamily: FONT }}>
      <div style={{ fontWeight: 700, fontSize: 26, letterSpacing: 3, color: "rgba(14,14,14,0.6)" }}>ГЛАВНЫЙ ВЫВОД</div>
      <div style={{ marginTop: 10, fontWeight: 800, fontSize: 54, lineHeight: 1.1, color: C.ink }}>Не красиво, а чтобы <span style={{ background: C.lime, padding: "0 8px" }}>ничего не отвлекало</span></div>
    </div>
  );
};

/** The trainer's shop (author's screenshot) in a glowing window; focus moves to the buy button. */
const Shop: React.FC<{ e: Ev; t: number }> = ({ e, t }) => {
  const p = ease(t, e.a, 0.5) * out(t, e.b);
  const buy = e.focus === "buy";
  // regions of the 2000×1403 screenshot: shop header with XP, then the item with its buy button
  const R0 = buy ? { x: 40, y: 960, w: 1100, h: 400 } : { x: 60, y: 400, w: 1150, h: 560 };
  const pulse = 0.6 + 0.3 * Math.sin((t - e.a) * 3);
  const Wd = 700, Ht = (700 * 1403) / 2000;
  return (
    <div style={{ position: "absolute", left: 50, top: 250, width: Wd, height: Ht, borderRadius: 22, overflow: "hidden", opacity: p, background: "#fff",
      transform: `perspective(1400px) rotateY(${(1 - p) * 12 + 4}deg) translateX(${(1 - p) * -60}px)`,
      boxShadow: `0 0 0 2px rgba(200,255,0,${0.6 * pulse}), 0 0 60px rgba(200,255,0,${0.3 * pulse}), 0 30px 70px rgba(0,0,0,0.35)` }}>
      {(() => {
        const k = Math.min(Wd / R0.w, Ht / R0.h) * interpolate(t, [e.a, e.b], [1, 1.05], clamp);
        return (
          <div style={{ position: "absolute", left: (Wd - R0.w * k) / 2 - R0.x * k, top: (Ht - R0.h * k) / 2 - R0.y * k, width: 2000 * k, height: 1403 * k }}>
            <Img src={staticFile("assets/shop.png")} style={{ width: 2000 * k, height: 1403 * k }} />
            {buy ? <div style={{ position: "absolute", left: 92 * k, top: 1242 * k, width: 116 * k, height: 42 * k, borderRadius: 8 * k, boxShadow: `0 0 0 3px ${C.lime}, 0 0 18px ${C.lime}`, opacity: ease(t, e.a + 0.8, 0.4) }} /> : null}
          </div>
        );
      })()}
      <div style={{ position: "absolute", left: 18, bottom: 16, padding: "8px 16px", borderRadius: 14, background: "rgba(14,14,14,0.82)", color: C.lime, fontFamily: FONT, fontWeight: 800, fontSize: 24 }}>
        {buy ? "покупки за XP" : "Магазин мира"}
      </div>
    </div>
  );
};

/** Olympiad scoring: a bare answer vs a written solution (no invented numbers). */
const Sheet: React.FC<{ e: Ev; t: number }> = ({ e, t }) => {
  const p = ease(t, e.a, 0.5) * out(t, e.b);
  const r2 = e.a + 5.2;
  const rows = [
    { label: "Только ответ", note: "минимальный балл", w: 0.22, col: C.grey, at: e.a + 0.6 },
    { label: "Ответ + ход решения", note: "баллов больше", w: 0.92, col: C.lime, at: r2 },
  ];
  return (
    <div style={{ position: "absolute", left: 60, top: 230, width: 660, padding: "34px 36px 38px", background: "#FBFAF6", borderRadius: 18, opacity: p,
      transform: `rotate(${-1.5 + (1 - p) * -4}deg) translateY(${(1 - p) * 30}px)`, boxShadow: "0 24px 60px rgba(0,0,0,0.25)", fontFamily: FONT,
      backgroundImage: "repeating-linear-gradient(0deg, transparent 0 46px, rgba(120,140,200,0.18) 46px 48px)" }}>
      <div style={{ fontWeight: 800, fontSize: 30, letterSpacing: 2, color: "#6A6F78" }}>ОЛИМПИАДА · ЗА ЧТО БАЛЛЫ</div>
      {rows.map((r, i) => {
        const q = ease(t, r.at, 0.6);
        return (
          <div key={i} style={{ marginTop: 34, opacity: q }}>
            <div style={{ fontWeight: 800, fontSize: 34, color: C.ink }}>{r.label}</div>
            <div style={{ marginTop: 12, height: 26, borderRadius: 13, background: "rgba(14,14,14,0.08)" }}>
              <div style={{ height: 26, width: `${r.w * q * 100}%`, borderRadius: 13, background: r.col }} />
            </div>
            <div style={{ marginTop: 8, fontWeight: 700, fontSize: 30, color: i ? "#4C7A00" : "#6A6F78" }}>{r.note}</div>
          </div>
        );
      })}
    </div>
  );
};

/** Alarm for a one-hour session (planned feature). */
const Alarm: React.FC<{ e: Ev; t: number }> = ({ e, t }) => {
  const p = ease(t, e.a, 0.5) * out(t, e.b);
  const run = interpolate(t, [e.a + 1, e.b - 2.5], [0, 1], clamp);
  const ring = run >= 1 ? 1 + 0.06 * Math.sin((t - e.b) * 40) : 1;
  const mins = Math.max(0, Math.round(60 * (1 - run)));
  const R = 130, L = 2 * Math.PI * R;
  return (
    <div style={{ position: "absolute", left: 70, top: 200, width: 600, padding: "30px 34px", ...glassDark, opacity: p, fontFamily: FONT, color: C.cream, display: "flex", flexDirection: "column", alignItems: "center" }}>
      <div style={{ alignSelf: "flex-start", fontWeight: 700, fontSize: 26, letterSpacing: 3, color: C.lime }}>В ПЛАНАХ</div>
      <div style={{ position: "relative", width: 320, height: 320, marginTop: 10, transform: `scale(${ring})` }}>
        <svg width={320} height={320}>
          <circle cx={160} cy={160} r={R} stroke="rgba(255,255,255,0.15)" strokeWidth={18} fill="none" />
          <circle cx={160} cy={160} r={R} stroke={C.lime} strokeWidth={18} fill="none" strokeLinecap="round" strokeDasharray={L} strokeDashoffset={L * run} transform="rotate(-90 160 160)" />
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 84 }}>{String(mins).padStart(2, "0")}:00</div>
      </div>
      <div style={{ marginTop: 14, fontWeight: 800, fontSize: 44 }}>Будильник на <span style={{ color: C.lime }}>час</span></div>
    </div>
  );
};

/** School branch first, olympiad after: confidence → difficulty grows gradually. */
const Branch: React.FC<{ e: Ev; t: number }> = ({ e, t }) => {
  const p = ease(t, e.a, 0.5) * out(t, e.b);
  const box = (txt: string, sub: string, col: string, at: number) => {
    const q = ease(t, at, 0.5, EASE.pop);
    return (
      <div style={{ padding: "22px 28px", ...glassDark, borderColor: col, opacity: q, transform: `scale(${0.85 + 0.15 * q})` }}>
        <div style={{ fontWeight: 800, fontSize: 40, color: C.cream }}>{txt}</div>
        <div style={{ fontWeight: 600, fontSize: 26, color: col, marginTop: 4 }}>{sub}</div>
      </div>
    );
  };
  return (
    <div style={{ position: "absolute", left: 70, top: 210, width: 620, opacity: p, fontFamily: FONT, display: "flex", flexDirection: "column", gap: 18 }}>
      {box("Школьная ветка", "с опережением · уверенность", C.lime, e.a + 0.2)}
      <div style={{ marginLeft: 60, fontSize: 50, color: C.lime, opacity: ease(t, e.a + 1.6, 0.4), fontWeight: 800 }}>↓</div>
      {box("Олимпиадный режим", "сложность растёт постепенно", C.amber, e.a + 2.0)}
      <div style={{ marginTop: 8, padding: "16px 22px", ...glassLight, opacity: ease(t, e.a + 3.4, 0.5) }}>
        <div style={{ fontWeight: 800, fontSize: 38, color: C.ink }}>Сначала уверенность, потом олимпиада</div>
      </div>
    </div>
  );
};

/** What worked after a month: keep / redo / remove. */
const Tier: React.FC<{ e: Ev; t: number }> = ({ e, t }) => {
  const p = ease(t, e.a, 0.5) * out(t, e.b, 0.45);
  const rows = [
    { label: "ОСТАВЛЯЕМ", col: C.lime, items: ["Герой, который растёт вместе с ребёнком"] },
    { label: "ПЕРЕДЕЛЫВАЕМ", col: C.amber, items: ["Проверка только ответа", "10–15 минут в день"] },
    { label: "УБИРАЕМ", col: C.red, items: ["Магазин"] },
  ];
  let k = 0;
  return (
    <AbsoluteFill style={{ opacity: p, backdropFilter: `blur(${14 * p}px)`, background: `rgba(14,14,14,${0.55 * p})`, fontFamily: FONT }}>
      <div style={{ position: "absolute", left: 230, top: 90, fontWeight: 800, fontSize: 58, color: C.cream, letterSpacing: -1 }}>Что сработало за месяц</div>
      {rows.map((r, i) => (
        <div key={i} style={{ position: "absolute", left: 230, top: 210 + i * 220, width: 1460, height: 190, display: "flex", alignItems: "center", gap: 26, ...glassDark }}>
          <div style={{ width: 330, height: "100%", borderRadius: 26, background: r.col, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 34, color: C.ink }}>{r.label}</div>
          {r.items.map((it) => {
            const at = e.a + 0.8 + 0.75 * k++;
            const q = ease(t, at, 0.5, EASE.pop);
            return (
              <div key={it} style={{ padding: "22px 30px", borderRadius: 20, background: "rgba(255,255,255,0.92)", fontWeight: 800, fontSize: 36, color: C.ink, opacity: q,
                transform: `translateY(${(1 - q) * -80}px) rotate(${(1 - q) * -6}deg)`, boxShadow: "0 12px 30px rgba(0,0,0,0.25)" }}>{it}</div>
            );
          })}
        </div>
      ))}
    </AbsoluteFill>
  );
};

/** B-roll: the son at the laptop in a vertical glass card on the wall (muted, author's voice continues). */
export const Broll: React.FC<{ e: Ev }> = ({ e }) => {
  const t = e.a + useCurrentFrame() / FPS;
  const p = ease(t, e.a, 0.4) * out(t, e.b, 0.3);
  const from = Math.round((e.at as number) * FPS);
  return (
    <div style={{ position: "absolute", left: 150, top: 120, width: 450, height: 800, borderRadius: 28, overflow: "hidden", opacity: p,
      transform: `translateY(${(1 - p) * 40}px) scale(${0.95 + 0.05 * p})`, boxShadow: "0 0 0 2px rgba(255,255,255,0.6), 0 30px 70px rgba(0,0,0,0.35)" }}>
      <OffthreadVideo src={staticFile(`media/${e.src}.mp4`)} trimBefore={from} muted style={{ width: 450, height: 800 }} />
    </div>
  );
};

const ScreenNote: React.FC<{ e: Ev; t: number }> = ({ e, t }) => {
  const p = ease(t, e.a, 0.45) * out(t, e.b);
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: 40, display: "flex", justifyContent: "center", opacity: p, transform: `translateY(${(1 - p) * -20}px)` }}>
      <div style={{ padding: "16px 28px", ...glassDark, fontFamily: FONT, fontWeight: 800, fontSize: 42, color: C.cream }}>{e.text as string}</div>
    </div>
  );
};

/* ---------- graphics layer ---------- */
export const Graphics: React.FC<{ clips: Clip[] }> = ({ clips }) => {
  const t = useCurrentFrame() / FPS;
  const cur = clips.find((c) => t >= c.out && t < c.out + c.dur);
  const kid = !!cur?.kid;
  const screen = !!cur?.screen;
  const on = EV.filter((e) => active(e, t, 0.6));
  const wall = (e: Ev) => !kid && !screen && active(e, t, 0.6);
  return (
    <AbsoluteFill>
      {on.filter((e) => e.kind === "thesis" && wall(e)).map((e, i) => <Thesis key={`t${i}`} e={e} t={t} />)}
      {on.filter((e) => e.kind === "list" && wall(e)).map((e, i) => <List key={`l${i}`} e={e} t={t} />)}
      {on.filter((e) => e.kind === "summary" && wall(e)).map((e, i) => <Summary key={`s${i}`} e={e} t={t} />)}
      {on.filter((e) => e.kind === "about" && wall(e)).map((e, i) => <About key={`a${i}`} e={e} t={t} />)}
      {on.filter((e) => e.kind === "shop" && wall(e)).map((e, i) => <Shop key={`sh${i}`} e={e} t={t} />)}
      {on.filter((e) => e.kind === "sheet" && wall(e)).map((e, i) => <Sheet key={`sx${i}`} e={e} t={t} />)}
      {on.filter((e) => e.kind === "alarm" && wall(e)).map((e, i) => <Alarm key={`al${i}`} e={e} t={t} />)}
      {on.filter((e) => e.kind === "branch" && wall(e)).map((e, i) => <Branch key={`br${i}`} e={e} t={t} />)}
      {on.filter((e) => e.kind === "screen_note").map((e, i) => <ScreenNote key={`n${i}`} e={e} t={t} />)}
      {on.filter((e) => e.kind === "chapter" && !kid).map((e, i) => <Chapter key={`c${i}`} e={e} t={t} />)}
      {on.filter((e) => e.kind === "tier").map((e, i) => <Tier key={`tr${i}`} e={e} t={t} />)}
      {EV.filter((e) => e.kind === "chapter" && t > e.a - 0.4 && t < e.a + 0.6).map((e, i) => <Sweep key={`w${i}`} e={e} t={t} />)}
    </AbsoluteFill>
  );
};

/* ---------- subtitles ---------- */
type Page = { start: number; end: number; kid: boolean; words: { w: string; s: number; e: number; hl: boolean }[] };
const PAGES = captions as Page[];
export const Subtitles: React.FC<{ clips: Clip[] }> = () => {
  const t = useCurrentFrame() / FPS;
  const p = PAGES.find((x) => t >= x.start && t < x.end);
  if (!p) return null;
  const k = ease(t, p.start, 0.12);
  return (
    <div style={{ position: "absolute", left: 0, right: 0, bottom: 64, display: "flex", justifyContent: "center", opacity: k }}>
      <div style={{ maxWidth: 1400, padding: "12px 26px 14px", borderRadius: 18, background: "rgba(14,14,14,0.62)", backdropFilter: "blur(10px)",
        fontFamily: FONT, fontWeight: 700, fontSize: 42, lineHeight: 1.2, color: C.cream, textAlign: "center", transform: `translateY(${(1 - k) * 6}px)` }}>
        {p.words.map((w, i) => (
          <span key={i} style={{ color: w.hl ? C.lime : C.cream }}>{w.w}{i < p.words.length - 1 ? " " : ""}</span>
        ))}
      </div>
    </div>
  );
};
