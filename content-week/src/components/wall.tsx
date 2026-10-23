import React from "react";
import { enter, exit, life, useEditT } from "../anim";
import { C, EASE, FONT } from "../theme";
import { Card, Chip, PLATFORM, PlatformBadge } from "./ui";

/**
 * Graphics that live on the clean wall to the left of the author.
 * The face starts around x≈680 even at the closest camera zoom, so nothing here
 * goes right of WALL.x + WALL.w. Text is dark, sitting directly on the light wall.
 */
export const WALL = { x: 80, y: 90, w: 560, h: 820 };
const INK = "#14171B";
const MUTED = "#4C535C";
const ACCENT = "#D23A1C"; // darker coral that holds contrast on the grey wall
const AI = "#3B57D4";

type Span = { a: number; b: number };
const useT = (a: number) => useEditT(a);
const slide = (p: number, d = 30): React.CSSProperties => ({ opacity: p, transform: `translateX(${(1 - p) * -d}px)` });

const WallBox: React.FC<{ children: React.ReactNode; justify?: "center" | "flex-start"; style?: React.CSSProperties }> = ({
  children,
  justify = "center",
  style,
}) => (
  <div
    style={{
      position: "absolute",
      left: WALL.x,
      top: WALL.y,
      width: WALL.w,
      height: WALL.h,
      display: "flex",
      flexDirection: "column",
      justifyContent: justify,
      fontFamily: FONT,
      ...style,
    }}
  >
    {children}
  </div>
);

const WallLabel: React.FC<{ color?: string; children: React.ReactNode }> = ({ color = MUTED, children }) => (
  <div style={{ fontWeight: 800, fontSize: 24, letterSpacing: 2.5, textTransform: "uppercase", color }}>{children}</div>
);

const Tick: React.FC<{ color: string; p: number; size: number }> = ({ color, p, size }) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: size * 0.3,
      flexShrink: 0,
      background: `${color}1f`,
      border: `2px solid ${color}`,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    }}
  >
    <svg width={size * 0.55} height={size * 0.55} viewBox="0 0 24 24">
      <path d="M5 12.5l4.2 4.2L19 7" fill="none" stroke={color} strokeWidth={3.2} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={24} strokeDashoffset={24 * (1 - p)} />
    </svg>
  </div>
);

/* ---------- Section title on the wall ---------- */
export const SectionTitle: React.FC<Span & { step: string; title: string }> = ({ a, b, step, title }) => {
  const t = useT(a);
  const v = life(t, a, b, 0.55, 0.4);
  const bar = enter(t, a + 0.15, 0.6);
  return (
    <WallBox>
      <div style={slide(v)}>
        <div style={{ display: "inline-block", padding: "8px 18px", borderRadius: 999, background: ACCENT, color: "#fff", fontWeight: 800, fontSize: 26 }}>{step}</div>
        <div style={{ marginTop: 24, fontWeight: 800, fontSize: 70, lineHeight: 1.05, letterSpacing: -1.5, color: INK }}>{title}</div>
        <div style={{ marginTop: 28, height: 6, width: 200 * bar, borderRadius: 6, background: ACCENT }} />
      </div>
    </WallBox>
  );
};

/* ---------- Kinetic words on the wall ---------- */
export const Kinetic: React.FC<Span & { items: { t: number; text: string; accent?: boolean }[]; size?: number }> = ({ a, b, items, size = 84 }) => (
  <KineticInner a={a} b={b} items={items} size={size} />
);
const KineticInner: React.FC<Span & { items: { t: number; text: string; accent?: boolean }[]; size: number }> = ({ a, b, items, size }) => {
  const t = useT(a);
  return (
    <WallBox>
      {items.map((it, i) => {
        const p = enter(t, it.t, 0.45, EASE.pop) * exit(t, b - 0.35, 0.35);
        // shrink so the longest word still fits the wall (≈0.62 em per Cyrillic glyph in Manrope 800)
        const longest = Math.max(...it.text.split(" ").map((w) => w.length));
        const fs = Math.min(size, Math.floor(WALL.w / (0.62 * longest)));
        return (
          <div key={i} style={{ fontWeight: 800, fontSize: fs, lineHeight: 1.05, letterSpacing: -1.8, color: it.accent ? ACCENT : INK, ...slide(p, 24) }}>
            {it.text}
          </div>
        );
      })}
    </WallBox>
  );
};

/* ---------- Platforms named in the hook, stacked on the wall ---------- */
export const PlatformsRow: React.FC<Span & { items: { t: number; id: string }[]; dailyAt?: number }> = ({ a, b, items, dailyAt }) => {
  const t = useT(a);
  const daily = dailyAt ? enter(t, dailyAt, 0.5, EASE.pop) * exit(t, b - 0.35, 0.35) : 0;
  return (
    <WallBox>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {items.map((it, i) => {
          const p = enter(t, it.t, 0.45, EASE.pop) * exit(t, b - 0.35, 0.35);
          return (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 20, ...slide(p) }}>
              <Card w={88} h={88} style={{ display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 24 }}>
                <PlatformBadge id={it.id} size={60} />
              </Card>
              <div style={{ fontWeight: 800, fontSize: 48, color: INK }}>{PLATFORM[it.id].name}</div>
              {dailyAt ? (
                <div style={{ marginLeft: "auto", opacity: daily, transform: `scale(${0.8 + 0.2 * daily})` }}>
                  <div style={{ padding: "6px 14px", borderRadius: 999, background: ACCENT, color: "#fff", fontWeight: 800, fontSize: 22 }}>каждый день</div>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </WallBox>
  );
};

/* ---------- Vertical step chain on the wall ---------- */
export const Roadmap: React.FC<Span & { items: { t: number; label: string }[] }> = ({ a, b, items }) => {
  const t = useT(a);
  return (
    <WallBox>
      {items.map((it, i) => {
        const p = enter(t, it.t, 0.45, EASE.pop) * exit(t, b - 0.35, 0.35);
        return (
          <React.Fragment key={i}>
            {i > 0 ? (
              <svg width={60} height={56} style={{ opacity: p, marginLeft: 20 }}>
                <path d="M20 6 V44 M9 33 L20 46 L31 33" stroke={ACCENT} strokeWidth={4} fill="none" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            ) : null}
            <div style={slide(p)}>
              <div style={{ display: "inline-block", padding: "18px 30px", borderRadius: 22, background: C.panel, color: C.text, fontWeight: 800, fontSize: 46, boxShadow: "0 18px 40px rgba(0,0,0,0.25)" }}>{it.label}</div>
            </div>
          </React.Fragment>
        );
      })}
    </WallBox>
  );
};

/* ---------- List on the wall ---------- */
export const SideList: React.FC<
  Span & {
    title: string;
    titleColor?: string;
    numbered?: boolean;
    check?: boolean;
    items: { t: number; text: string; sub?: string; badge?: string; color?: string }[];
    footer?: { t: number; text: string; color?: string };
  }
> = ({ a, b, title, titleColor, numbered, items, footer }) => {
  const t = useT(a);
  const v = life(t, a, b, 0.5, 0.4);
  const big = items.length <= 3;
  const fs = big ? 52 : items.length <= 4 ? 46 : 40;
  const wallColor = (c?: string) => (c === "#8EA6FF" ? AI : c ?? ACCENT);
  return (
    <WallBox>
      <div style={{ ...slide(v, 16) }}>
        <WallLabel color={wallColor(titleColor === "#8EA6FF" ? titleColor : undefined) === AI ? AI : MUTED}>{title}</WallLabel>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: big ? 26 : 18, marginTop: 28 }}>
        {items.map((it, i) => {
          const p = enter(t, it.t, 0.45) * exit(t, b - 0.4, 0.4);
          const col = wallColor(it.color);
          return (
            <div key={i} style={{ display: "flex", alignItems: it.sub ? "flex-start" : "center", gap: 20, ...slide(p) }}>
              {it.badge ? (
                <Card w={fs * 1.3} h={fs * 1.3} style={{ display: "flex", alignItems: "center", justifyContent: "center", borderRadius: fs * 0.36, flexShrink: 0 }}>
                  <PlatformBadge id={it.badge} size={fs * 0.92} />
                </Card>
              ) : numbered ? (
                <div style={{ width: fs * 1.1, height: fs * 1.1, borderRadius: fs * 0.32, flexShrink: 0, background: INK, color: "#fff", fontWeight: 800, fontSize: fs * 0.55, display: "flex", alignItems: "center", justifyContent: "center" }}>{i + 1}</div>
              ) : (
                <Tick color={col} p={enter(t, it.t + 0.15, 0.4)} size={fs * 1.1} />
              )}
              <div>
                <div style={{ fontWeight: 800, fontSize: fs, lineHeight: 1.08, color: INK, letterSpacing: -0.5 }}>{it.text}</div>
                {it.sub ? <div style={{ fontWeight: 700, fontSize: fs * 0.6, lineHeight: 1.25, color: MUTED, marginTop: 4 }}>{it.sub}</div> : null}
              </div>
            </div>
          );
        })}
      </div>
      {footer ? (
        <div style={{ marginTop: 34, ...slide(enter(t, footer.t, 0.45) * exit(t, b - 0.4, 0.4)) }}>
          <div style={{ display: "inline-block", padding: "12px 22px", borderRadius: 16, background: ACCENT, color: "#fff", fontWeight: 800, fontSize: 30, lineHeight: 1.2 }}>{footer.text}</div>
        </div>
      ) : null}
    </WallBox>
  );
};

/* ---------- Two short columns, stacked on the wall ---------- */
export const WallCompare: React.FC<
  Span & {
    left: { t: number; title: string; items?: { t: number; text: string }[]; color?: string };
    right: { t: number; title: string; items?: { t: number; text: string }[]; color?: string };
  }
> = ({ a, b, left, right }) => {
  const t = useT(a);
  const Block: React.FC<{ c: typeof left }> = ({ c }) => {
    const p = enter(t, c.t, 0.5) * exit(t, b - 0.4, 0.4);
    const col = c.color === "#8EA6FF" ? AI : ACCENT;
    return (
      <div style={{ ...slide(p), borderLeft: `6px solid ${col}`, paddingLeft: 24 }}>
        <div style={{ fontWeight: 800, fontSize: 52, lineHeight: 1.08, color: INK }}>{c.title}</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: c.items?.length ? 14 : 0 }}>
          {(c.items ?? []).map((it, i) => (
            <div key={i} style={{ fontWeight: 700, fontSize: 34, color: MUTED, ...slide(enter(t, it.t, 0.4) * exit(t, b - 0.4, 0.4), 14) }}>
              {it.text}
            </div>
          ))}
        </div>
      </div>
    );
  };
  return (
    <WallBox style={{ gap: 48 }}>
      <Block c={left} />
      <Block c={right} />
    </WallBox>
  );
};

/* ---------- Prompt card hanging on the wall ---------- */
export const WallPrompt: React.FC<Span & { title: string; items: { t: number; text: string }[] }> = ({ a, b, title, items }) => {
  const t = useT(a);
  const v = life(t, a, b, 0.5, 0.4);
  return (
    <WallBox>
      <div style={slide(v)}>
        <Card w={WALL.w} style={{ padding: "30px 34px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 12, height: 12, borderRadius: 12, background: C.ai }} />
            <div style={{ fontWeight: 800, fontSize: 22, letterSpacing: 2.5, textTransform: "uppercase", color: C.ai }}>{title}</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 20 }}>
            {items.map((it, i) => (
              <div key={i} style={{ display: "flex", gap: 14, ...slide(enter(t, it.t, 0.45) * exit(t, b - 0.4, 0.4), 14) }}>
                <div style={{ color: C.ai, fontWeight: 800, fontSize: 34, lineHeight: 1.15 }}>›</div>
                <div style={{ fontWeight: 700, fontSize: 34, lineHeight: 1.22, color: C.text }}>{it.text}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </WallBox>
  );
};

/* ---------- Telegram CTA on the wall ---------- */
export const TelegramCTA: React.FC<Span & { title: string; sub: string; noteAt: number; note: string }> = ({ a, b, title, sub, noteAt, note }) => {
  const t = useT(a);
  const v = life(t, a, b, 0.55, 0.45);
  return (
    <WallBox>
      <div style={slide(v)}>
        <Card w={WALL.w} style={{ padding: "36px 38px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            <PlatformBadge id="telegram" size={70} />
            <div style={{ fontWeight: 800, fontSize: 24, letterSpacing: 2.5, textTransform: "uppercase", color: PLATFORM.telegram.color }}>Telegram-канал</div>
          </div>
          <div style={{ fontWeight: 800, fontSize: 50, lineHeight: 1.1, marginTop: 28 }}>{title}</div>
          <div style={{ fontWeight: 600, fontSize: 30, lineHeight: 1.3, color: C.muted, marginTop: 16 }}>{sub}</div>
          <div style={{ marginTop: 28, opacity: enter(t, noteAt, 0.5) }}>
            <Chip color={PLATFORM.telegram.color} size={28}>{note}</Chip>
          </div>
        </Card>
      </div>
    </WallBox>
  );
};

/* ---------- Comment prompt on the wall ---------- */
export const CommentPrompt: React.FC<Span & { text: string }> = ({ a, b, text }) => {
  const t = useT(a);
  const v = life(t, a, b, 0.5, 0.4);
  return (
    <WallBox>
      <div style={slide(v)}>
        <Card w={WALL.w} style={{ padding: "34px 38px" }}>
          <div style={{ fontWeight: 800, fontSize: 22, letterSpacing: 2.5, textTransform: "uppercase", color: C.ai }}>вопрос в комментарии</div>
          <div style={{ fontWeight: 800, fontSize: 44, lineHeight: 1.15, marginTop: 22 }}>{text}</div>
          <div style={{ marginTop: 26, height: 60, borderRadius: 16, background: C.panel2, border: `1.5px solid ${C.line}`, display: "flex", alignItems: "center", paddingLeft: 20 }}>
            <div style={{ width: 3, height: 30, background: C.text, opacity: Math.floor(t * 2) % 2 }} />
          </div>
        </Card>
      </div>
    </WallBox>
  );
};

/* ---------- Platforms added gradually ---------- */
export const GrowPlatforms: React.FC<Span & { items: { t: number; id: string }[] }> = ({ a, b, items }) => {
  const t = useT(a);
  const v = life(t, a, b, 0.45, 0.4);
  return (
    <WallBox>
      <div style={{ opacity: v }}>
        <WallLabel>постепенно</WallLabel>
      </div>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 22, marginTop: 30, height: 460 }}>
        {items.map((it, i) => {
          const p = enter(t, it.t, 0.5, EASE.pop) * exit(t, b - 0.4, 0.4);
          return (
            <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, opacity: p, transform: `translateY(${(1 - p) * 40}px)` }}>
              <Card w={96} h={96} style={{ display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 26 }}>
                <PlatformBadge id={it.id} size={64} />
              </Card>
              <div style={{ width: 96, height: 80 + i * 90, borderRadius: 18, background: i === items.length - 1 ? ACCENT : INK, opacity: i === items.length - 1 ? 0.9 : 0.75 }} />
            </div>
          );
        })}
      </div>
    </WallBox>
  );
};

/* ---------- Blank page ---------- */
export const BlankPage: React.FC<Span & { label: string }> = ({ a, b, label }) => {
  const t = useT(a);
  const v = life(t, a, b, 0.5, 0.4);
  const cursor = Math.floor(t * 2) % 2 === 0 ? 1 : 0;
  return (
    <WallBox>
      <div style={{ ...slide(v), display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 22 }}>
        <div style={{ width: 380, height: 500, borderRadius: 18, background: "#FFFFFF", boxShadow: "0 24px 60px rgba(0,0,0,0.22)", padding: 40, boxSizing: "border-box" }}>
          <div style={{ width: 4, height: 50, background: INK, opacity: cursor }} />
        </div>
        <div style={{ fontWeight: 800, fontSize: 54, color: INK }}>{label}</div>
      </div>
    </WallBox>
  );
};

/* ---------- Lower third on the wall ---------- */
export const LowerThird: React.FC<Span & { name: string; role: string }> = ({ a, b, name, role }) => {
  const t = useT(a);
  const v = life(t, a, b, 0.6, 0.4);
  const line = enter(t, a + 0.15, 0.7);
  return (
    <WallBox>
      <div style={slide(v)}>
        <div style={{ fontWeight: 800, fontSize: 64, lineHeight: 1.05, color: INK, letterSpacing: -1 }}>{name}</div>
        <div style={{ height: 6, width: 160 * line, background: ACCENT, borderRadius: 6, margin: "20px 0" }} />
        <div style={{ fontWeight: 700, fontSize: 34, lineHeight: 1.3, color: MUTED }}>{role}</div>
      </div>
    </WallBox>
  );
};

/* ---------- Instagram legal note: top of the wall ---------- */
export const Disclaimer: React.FC<Span> = ({ a, b }) => {
  const t = useT(a);
  const v = life(t, a, b, 0.35, 0.35);
  return (
    <div style={{ position: "absolute", left: 40, top: 28, width: 620, opacity: v }}>
      <div style={{ padding: "10px 16px", borderRadius: 12, background: "rgba(13,15,18,0.82)", fontFamily: FONT, fontWeight: 600, fontSize: 24, color: C.paperDim, lineHeight: 1.3 }}>
        * Instagram — продукт корпорации Meta, деятельность которой признана экстремистской в Российской Федерации.
      </div>
    </div>
  );
};


/* ---------- Guide mockup: a phone on the wall, the guide's pages being swiped ---------- */
const GUIDE_PAGES = [
  "Определяю, что хочу получить на выходе",
  "Выбираю тему и собираю структуру",
  "Сценарий с нейросетью",
  "Записываю длинное видео",
  "Пять коротких роликов",
  "Текстовые форматы",
];

const GuideCover: React.FC = () => (
  <div style={{ width: "100%", height: "100%", background: `linear-gradient(165deg, #1B1F26 0%, ${C.ink} 70%)`, padding: "44px 26px 26px", boxSizing: "border-box", display: "flex", flexDirection: "column", fontFamily: FONT }}>
    <div style={{ alignSelf: "flex-start", padding: "6px 14px", borderRadius: 999, background: C.accent, color: "#fff", fontWeight: 800, fontSize: 15, letterSpacing: 2 }}>ГАЙД</div>
    <div style={{ marginTop: 22, fontWeight: 800, fontSize: 31, lineHeight: 1.08, color: C.text, letterSpacing: -0.5 }}>Как из одного видео сделать контент на неделю</div>
    <div style={{ marginTop: 14, fontWeight: 600, fontSize: 16, color: C.muted }}>6 шагов · промпты · чек-лист</div>
    {/* one long video feeding five shorts */}
    <svg width="100%" height="190" viewBox="0 0 254 190" style={{ marginTop: 26 }}>
      <rect x="62" y="6" width="130" height="64" rx="10" fill="none" stroke={C.text} strokeOpacity="0.8" strokeWidth="2.5" />
      <path d="M118 28 v20 l17-10z" fill={C.text} fillOpacity="0.8" />
      {[0, 1, 2, 3, 4].map((i) => (
        <g key={i}>
          <path d={`M127 70 C127 98 ${22 + i * 52} 96 ${22 + i * 52} 116`} fill="none" stroke={C.accent} strokeWidth="2" />
          <rect x={8 + i * 52} y="116" width="28" height="50" rx="6" fill="none" stroke={C.accent} strokeWidth="2.5" />
        </g>
      ))}
    </svg>
    <div style={{ marginTop: "auto", fontWeight: 700, fontSize: 16, color: C.paperDim }}>Александра Рулёва</div>
  </div>
);

const GuidePage: React.FC<{ n: number; title: string }> = ({ n, title }) => (
  <div style={{ width: "100%", height: "100%", background: C.paper, padding: "46px 26px 26px", boxSizing: "border-box", fontFamily: FONT, color: C.textDark }}>
    <div style={{ fontWeight: 800, fontSize: 16, letterSpacing: 2, color: C.accent }}>ШАГ {n}</div>
    <div style={{ marginTop: 10, fontWeight: 800, fontSize: 27, lineHeight: 1.1, letterSpacing: -0.4 }}>{title}</div>
    <div style={{ marginTop: 22, display: "flex", flexDirection: "column", gap: 11 }}>
      {[0.95, 0.85, 0.9, 0.6].map((w, i) => (
        <div key={i} style={{ height: 9, width: `${w * 100}%`, borderRadius: 9, background: "rgba(0,0,0,0.12)" }} />
      ))}
    </div>
    <div style={{ marginTop: 26, display: "flex", flexDirection: "column", gap: 14 }}>
      {[0.7, 0.8, 0.55].map((w, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 20, height: 20, borderRadius: 6, border: `2px solid ${C.accent}`, flexShrink: 0 }} />
          <div style={{ height: 9, width: `${w * 100}%`, borderRadius: 9, background: "rgba(0,0,0,0.12)" }} />
        </div>
      ))}
    </div>
    <div style={{ position: "absolute", left: 26, right: 26, bottom: 22, display: "flex", gap: 6 }}>
      {GUIDE_PAGES.map((_, i) => (
        <div key={i} style={{ flex: 1, height: 4, borderRadius: 4, background: i < n ? C.accent : "rgba(0,0,0,0.12)" }} />
      ))}
    </div>
  </div>
);

export const GuidePhone: React.FC<Span & { swipeAt: number; noteAt: number }> = ({ a, b, swipeAt, noteAt }) => {
  const t = useT(a);
  const v = life(t, a, b, 0.6, 0.45);
  const label = enter(t, a + 0.35, 0.5);
  const STEP = 1.05;
  // page position: 0 = cover, then one page per STEP seconds, each swipe eased
  const raw = Math.max(0, (t - swipeAt) / STEP);
  const k = Math.min(GUIDE_PAGES.length, Math.floor(raw) + EASE.inOut(Math.min(1, (raw % 1) / 0.45)));
  const pos = t < swipeAt ? 0 : Math.min(GUIDE_PAGES.length, k);
  const SCREEN_W = 300;
  const swipePhase = t >= swipeAt && raw < GUIDE_PAGES.length ? Math.min(1, (raw % 1) / 0.45) : 1;
  const W_ = 330;
  const H_ = 660;
  return (
    <WallBox justify="flex-start">
      <div style={{ display: "flex", alignItems: "center", gap: 14, ...slide(label * exit(t, b - 0.45, 0.45), 16) }}>
        <PlatformBadge id="telegram" size={50} />
        <div style={{ fontWeight: 800, fontSize: 30, color: INK }}>гайд в Telegram-канале</div>
      </div>
      <div style={{ marginTop: 24, marginLeft: 70, opacity: v, transform: `translateY(${(1 - v) * 60}px) rotate(${(1 - v) * -4}deg)` }}>
        <div style={{ position: "relative", width: W_, height: H_, borderRadius: 52, background: "#0B0C0E", boxShadow: "0 30px 70px rgba(0,0,0,0.35), inset 0 0 0 2px #2A2E35", padding: 15, boxSizing: "border-box" }}>
          <div style={{ position: "relative", width: SCREEN_W, height: H_ - 30, borderRadius: 40, overflow: "hidden", background: C.ink }}>
            <div style={{ position: "absolute", top: 0, left: 0, height: "100%", display: "flex", transform: `translateX(${-pos * SCREEN_W}px)` }}>
              <div style={{ width: SCREEN_W, height: "100%", position: "relative", flexShrink: 0 }}><GuideCover /></div>
              {GUIDE_PAGES.map((p, i) => (
                <div key={i} style={{ width: SCREEN_W, height: "100%", position: "relative", flexShrink: 0 }}><GuidePage n={i + 1} title={p} /></div>
              ))}
            </div>
            {/* dynamic island */}
            <div style={{ position: "absolute", top: 12, left: "50%", width: 92, height: 26, marginLeft: -46, borderRadius: 20, background: "#000" }} />
            {/* finger swipe hint */}
            {t >= swipeAt && raw < GUIDE_PAGES.length ? (
              <div style={{ position: "absolute", top: 400, left: 230 - 160 * swipePhase, width: 46, height: 46, borderRadius: 46, background: "rgba(255,255,255,0.55)", boxShadow: "0 0 0 8px rgba(255,255,255,0.18)", opacity: Math.sin(Math.PI * swipePhase) }} />
            ) : null}
          </div>
        </div>
      </div>
      <div style={{ marginTop: 26, ...slide(enter(t, noteAt, 0.5) * exit(t, b - 0.45, 0.45), 16) }}>
        <div style={{ display: "inline-block", padding: "12px 22px", borderRadius: 16, background: ACCENT, color: "#fff", fontWeight: 800, fontSize: 30 }}>ссылка — в описании к видео</div>
      </div>
    </WallBox>
  );
};
