import React from "react";
import { enter, exit, life, useSec } from "../anim";
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
const useT = (a: number) => useSec() + a;
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

