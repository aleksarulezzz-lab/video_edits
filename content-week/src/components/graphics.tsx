import React from "react";
import { AbsoluteFill } from "remotion";
import { enter, exit, life, lerp, useSec } from "../anim";
import { C, EASE, FONT } from "../theme";
import { Card, Chip, FakeFrame, Label, PLATFORM, PlatformBadge, TextLines } from "./ui";

/**
 * Every graphic receives `a`/`b` (absolute output seconds of its Sequence) and cue
 * times in absolute output seconds, so the plan reads like a cue sheet.
 */
type Span = { a: number; b: number };
const useT = (a: number) => useSec() + a;

const PANEL = { x: 1056, y: 64, w: 800, h: 952 }; // right-hand area while the head is framed left

const rise = (p: number, dist = 40): React.CSSProperties => ({
  opacity: p,
  transform: `translateY(${(1 - p) * dist}px)`,
});

/* ---------- Section title: short chapter marker over the talking head ---------- */
export const SectionTitle: React.FC<Span & { step: string; title: string }> = ({ a, b, step, title }) => {
  const t = useT(a);
  const v = life(t, a, b, 0.55, 0.4);
  const bar = enter(t, a + 0.1, 0.6);
  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `linear-gradient(90deg, rgba(13,15,18,${0.88 * v}) 0%, rgba(13,15,18,${0.55 * v}) 26%, rgba(13,15,18,0) 40%)`,
        }}
      />
      <div style={{ position: "absolute", left: 100, top: 300, width: 620, ...rise(v, 30) }}>
        <Chip>{step}</Chip>
        <div
          style={{
            marginTop: 28,
            fontFamily: FONT,
            fontWeight: 800,
            fontSize: 72,
            lineHeight: 1.06,
            color: C.text,
            letterSpacing: -1.5,
          }}
        >
          {title}
        </div>
        <div style={{ marginTop: 34, height: 6, width: 220 * bar, borderRadius: 6, background: C.accent }} />
      </div>
    </AbsoluteFill>
  );
};

/* ---------- Lower third ---------- */
export const LowerThird: React.FC<Span & { name: string; role: string }> = ({ a, b, name, role }) => {
  const t = useT(a);
  const v = life(t, a, b, 0.6, 0.4);
  const line = enter(t, a + 0.15, 0.7);
  return (
    <div style={{ position: "absolute", left: 110, bottom: 300, fontFamily: FONT, ...rise(v, 24) }}>
      <div
        style={{
          display: "inline-block",
          padding: "20px 30px 22px",
          borderRadius: 22,
          background: "rgba(13,15,18,0.82)",
          border: `1.5px solid ${C.line}`,
        }}
      >
        <div style={{ fontWeight: 800, fontSize: 50, color: C.text, letterSpacing: -0.5 }}>{name}</div>
        <div style={{ height: 4, width: 120 * line, background: C.accent, borderRadius: 4, margin: "12px 0 12px" }} />
        <div style={{ fontWeight: 600, fontSize: 30, color: C.muted }}>{role}</div>
      </div>
    </div>
  );
};

/* ---------- Kinetic words: a few short phrases, set on the wall left of the face ---------- */
export const Kinetic: React.FC<
  Span & { items: { t: number; text: string; accent?: boolean }[]; size?: number }
> = ({ a, b, items, size = 88 }) => {
  const t = useT(a);
  const v = life(t, a, b, 0.4, 0.4);
  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `linear-gradient(90deg, rgba(13,15,18,${0.8 * v}) 0%, rgba(13,15,18,${0.5 * v}) 26%, rgba(13,15,18,0) 40%)`,
        }}
      />
      <div style={{ position: "absolute", left: 100, top: 0, bottom: 200, width: 640, display: "flex", flexDirection: "column", justifyContent: "center", gap: 8 }}>
        {items.map((it, i) => {
          const p = enter(t, it.t, 0.45, EASE.pop) * exit(t, b - 0.35, 0.35);
          return (
            <div
              key={i}
              style={{
                fontFamily: FONT,
                fontWeight: 800,
                fontSize: size,
                letterSpacing: -1.5,
                lineHeight: 1.06,
                color: it.accent ? C.accent : C.text,
                opacity: p,
                transform: `translateX(${(1 - p) * -30}px)`,
                textShadow: "0 6px 30px rgba(0,0,0,0.45)",
              }}
            >
              {it.text}
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

/* ---------- Platform row (hook): cards appear as each network is named ---------- */
export const PlatformsRow: React.FC<Span & { items: { t: number; id: string }[]; dailyAt?: number }> = ({
  a,
  b,
  items,
  dailyAt,
}) => {
  const t = useT(a);
  const v = life(t, a, b, 0.4, 0.4);
  const daily = dailyAt ? enter(t, dailyAt, 0.6) : 0;
  return (
    <AbsoluteFill style={{ background: `rgba(13,15,18,${0.5 * v})` }}>
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 210, display: "flex", justifyContent: "center", gap: 26 }}>
        {items.map((it, i) => {
          const p = enter(t, it.t, 0.5, EASE.pop) * exit(t, b - 0.35, 0.35);
          return (
            <div key={i} style={{ position: "relative", ...rise(p, 50) }}>
              {/* the daily pile: extra cards stacking behind as "every day" lands */}
              {[2, 1].map((k) => (
                <div
                  key={k}
                  style={{
                    position: "absolute",
                    inset: 0,
                    borderRadius: 26,
                    background: C.panel2,
                    border: `1.5px solid ${C.line}`,
                    transform: `translate(${k * 12 * daily}px, ${-k * 14 * daily}px)`,
                    opacity: daily * (0.9 - k * 0.25),
                  }}
                />
              ))}
              <Card w={250} h={190} style={{ position: "relative", padding: 26, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                <PlatformBadge id={it.id} size={62} />
                <div style={{ fontWeight: 800, fontSize: 34 }}>{PLATFORM[it.id].name}</div>
              </Card>
            </div>
          );
        })}
      </div>
      {dailyAt ? (
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 140, textAlign: "center", ...rise(daily * exit(t, b - 0.35, 0.35), 16) }}>
          <Chip>каждый день</Chip>
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

/* ---------- One long video → many formats ---------- */
export const OneToMany: React.FC<
  Span & { longAt: number; splitAt: number; postsAt: number; articlesAt: number }
> = ({ a, b, longAt, splitAt, postsAt, articlesAt }) => {
  const t = useT(a);
  const v = life(t, a, b, 0.45, 0.45);
  const L = enter(t, longAt, 0.6);
  const S = enter(t, splitAt, 0.8, EASE.inOut);
  const P = enter(t, postsAt, 0.6, EASE.pop);
  const A = enter(t, articlesAt, 0.6, EASE.pop);
  // long card shrinks and slides up as it "feeds" the formats
  const longW = lerp(S, 900, 520);
  const longX = 960 - longW / 2;
  const longY = lerp(S, 250, 90);
  return (
    <AbsoluteFill style={{ background: C.ink, opacity: v }}>
      <div style={{ position: "absolute", left: longX, top: longY, ...rise(L, 40) }}>
        <Card w={longW} style={{ padding: 18 }}>
          <FakeFrame w={longW - 36} h={(longW - 36) * 0.5625} />
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 16 }}>
            <PlatformBadge id="youtube" size={44} />
            <div style={{ fontWeight: 800, fontSize: lerp(S, 40, 30) }}>1 длинное видео в неделю</div>
          </div>
        </Card>
      </div>
      {/* connector */}
      <svg style={{ position: "absolute", left: 0, top: 0 }} width={1920} height={1080}>
        <path d={`M960 ${longY + 420} L960 600`} stroke={C.line} strokeWidth={3} strokeDasharray="8 10" opacity={S} />
      </svg>
      <div style={{ position: "absolute", left: 0, right: 0, top: 560, display: "flex", justifyContent: "center", gap: 22 }}>
        {Array.from({ length: 5 }).map((_, i) => {
          const p = enter(t, splitAt + 0.25 + i * 0.12, 0.5, EASE.pop);
          return (
            <div key={i} style={{ ...rise(p, 60) }}>
              <Card w={150} style={{ padding: 10 }}>
                <FakeFrame w={130} h={230} tint="#2A2238" />
                <div style={{ fontWeight: 700, fontSize: 20, color: C.muted, marginTop: 8, textAlign: "center" }}>ролик {i + 1}</div>
              </Card>
            </div>
          );
        })}
        <div style={{ display: "flex", flexDirection: "column", gap: 18, marginLeft: 26 }}>
          <div style={{ ...rise(P, 40) }}>
            <Card w={300} style={{ padding: 20 }}>
              <Label color={C.ai}>посты</Label>
              <div style={{ height: 14 }} />
              <TextLines n={3} w={240} />
            </Card>
          </div>
          <div style={{ ...rise(A, 40) }}>
            <Card w={300} light style={{ padding: 20 }}>
              <Label color={C.mutedDark}>статьи</Label>
              <div style={{ height: 14 }} />
              <TextLines n={3} w={240} color="rgba(0,0,0,0.12)" />
            </Card>
          </div>
        </div>
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 920, textAlign: "center", ...rise(S, 20) }}>
        <Chip>5 коротких роликов</Chip>
      </div>
    </AbsoluteFill>
  );
};

/* ---------- Horizontal roadmap: steps connected left→right ---------- */
export const Roadmap: React.FC<Span & { items: { t: number; label: string }[]; y?: number; dim?: number }> = ({
  a,
  b,
  items,
  y = 760,
  dim = 0.45,
}) => {
  const t = useT(a);
  const v = life(t, a, b, 0.4, 0.4);
  return (
    <AbsoluteFill style={{ background: `linear-gradient(0deg, rgba(13,15,18,${0.85 * v}) 0%, rgba(13,15,18,${dim * v}) 45%, rgba(13,15,18,0) 75%)` }}>
      <div style={{ position: "absolute", top: y, left: 0, right: 0, display: "flex", justifyContent: "center", alignItems: "center" }}>
        {items.map((it, i) => {
          const p = enter(t, it.t, 0.5, EASE.pop) * exit(t, b - 0.35, 0.35);
          const lineP = i > 0 ? enter(t, it.t - 0.1, 0.4) * exit(t, b - 0.35, 0.35) : 0;
          return (
            <React.Fragment key={i}>
              {i > 0 ? <div style={{ width: 90 * lineP, height: 4, background: C.accent, borderRadius: 4, margin: "0 10px", opacity: lineP }} /> : null}
              <div style={{ ...rise(p, 30) }}>
                <div
                  style={{
                    padding: "22px 34px",
                    borderRadius: 22,
                    background: C.panel,
                    border: `1.5px solid ${C.line}`,
                    fontFamily: FONT,
                    fontWeight: 800,
                    fontSize: 44,
                    color: C.text,
                    whiteSpace: "nowrap",
                  }}
                >
                  {it.label}
                </div>
              </div>
            </React.Fragment>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

/* ---------- Side panel list (head framed on the left) ---------- */
export const SideList: React.FC<
  Span & {
    title: string;
    titleColor?: string;
    numbered?: boolean;
    check?: boolean;
    items: { t: number; text: string; sub?: string; badge?: string; color?: string }[];
    footer?: { t: number; text: string; color?: string };
  }
> = ({ a, b, title, titleColor = C.muted, numbered, check, items, footer }) => {
  const t = useT(a);
  const v = life(t, a, b, 0.55, 0.4);
  const big = items.length <= 4;
  return (
    <div style={{ position: "absolute", left: PANEL.x, top: PANEL.y, width: PANEL.w, height: PANEL.h, display: "flex", flexDirection: "column", justifyContent: "center", opacity: v }}>
      <div style={{ ...rise(enter(t, a + 0.15, 0.5), 20) }}>
        <Label color={titleColor} style={{ fontSize: 28 }}>{title}</Label>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: big ? 28 : 20, marginTop: 34 }}>
        {items.map((it, i) => {
          const p = enter(t, it.t, 0.5) * exit(t, b - 0.4, 0.4);
          return (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 24, ...rise(p, 28), transform: `translateX(${(1 - p) * 40}px)` }}>
              {it.badge ? (
                <PlatformBadge id={it.badge} size={big ? 72 : 60} />
              ) : numbered || check ? (
                <div
                  style={{
                    width: big ? 64 : 54,
                    height: big ? 64 : 54,
                    borderRadius: 18,
                    flexShrink: 0,
                    background: check ? `${it.color ?? C.accent}22` : C.panel2,
                    border: `1.5px solid ${check ? `${it.color ?? C.accent}88` : C.line}`,
                    color: it.color ?? C.accent,
                    fontFamily: FONT,
                    fontWeight: 800,
                    fontSize: big ? 30 : 26,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {check ? (
                    <svg width={30} height={30} viewBox="0 0 24 24">
                      <path d="M5 12.5l4.2 4.2L19 7" fill="none" stroke={it.color ?? C.accent} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={24} strokeDashoffset={24 * (1 - enter(t, it.t + 0.15, 0.4))} />
                    </svg>
                  ) : (
                    i + 1
                  )}
                </div>
              ) : null}
              <div style={{ fontFamily: FONT }}>
                <div style={{ fontWeight: 800, fontSize: big ? 54 : 46, color: C.text, lineHeight: 1.12 }}>{it.text}</div>
                {it.sub ? <div style={{ fontWeight: 600, fontSize: big ? 34 : 31, color: C.muted, marginTop: 6, lineHeight: 1.25 }}>{it.sub}</div> : null}
              </div>
            </div>
          );
        })}
      </div>
      {footer ? (
        <div style={{ marginTop: 40, ...rise(enter(t, footer.t, 0.5) * exit(t, b - 0.4, 0.4), 20) }}>
          <Chip color={footer.color ?? C.accent} size={30}>{footer.text}</Chip>
        </div>
      ) : null}
    </div>
  );
};

/* ---------- Two columns compared ---------- */
export const Compare: React.FC<
  Span & {
    left: { t: number; title: string; items?: { t: number; text: string }[]; color?: string };
    right: { t: number; title: string; items?: { t: number; text: string }[]; color?: string };
    heading?: { t: number; text: string };
    full?: boolean;
  }
> = ({ a, b, left, right, heading, full = true }) => {
  const t = useT(a);
  const v = life(t, a, b, 0.45, 0.4);
  const Col: React.FC<{ c: typeof left; dir: number; compact?: boolean }> = ({ c, dir, compact }) => {
    const p = enter(t, c.t, 0.55) * exit(t, b - 0.4, 0.4);
    const col = c.color ?? C.text;
    return (
      <div style={{ opacity: p, transform: `translateX(${(1 - p) * 50 * dir}px)` }}>
        <Card w={compact ? PANEL.w : 720} style={{ padding: compact ? "30px 40px" : "40px 46px", minHeight: compact ? 0 : 380 }}>
          <div style={{ width: 54, height: 6, borderRadius: 6, background: col, marginBottom: 26 }} />
          <div style={{ fontWeight: 800, fontSize: 52, lineHeight: 1.1, color: C.text }}>{c.title}</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 18, marginTop: 30 }}>
            {(c.items ?? []).map((it, i) => {
              const q = enter(t, it.t, 0.45) * exit(t, b - 0.4, 0.4);
              return (
                <div key={i} style={{ display: "flex", gap: 16, alignItems: "center", ...rise(q, 16) }}>
                  <div style={{ width: 12, height: 12, borderRadius: 12, background: col, flexShrink: 0 }} />
                  <div style={{ fontWeight: 600, fontSize: 36, color: C.paperDim }}>{it.text}</div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    );
  };
  if (!full) {
    return (
      <div style={{ position: "absolute", left: PANEL.x, top: PANEL.y, width: PANEL.w, height: PANEL.h, display: "flex", flexDirection: "column", justifyContent: "center", gap: 28, fontFamily: FONT, opacity: v }}>
        <Col c={left} dir={1} compact />
        <Col c={right} dir={1} compact />
      </div>
    );
  }
  return (
    <AbsoluteFill style={{ background: C.ink, opacity: v, fontFamily: FONT }}>
      {heading ? (
        <div style={{ position: "absolute", top: 130, left: 0, right: 0, textAlign: "center", ...rise(enter(t, heading.t, 0.5) * exit(t, b - 0.4, 0.4), 20) }}>
          <Label>{heading.text}</Label>
        </div>
      ) : null}
      <div style={{ position: "absolute", top: heading ? 230 : 200, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 60 }}>
        <Col c={left} dir={-1} />
        <Col c={right} dir={1} />
      </div>
    </AbsoluteFill>
  );
};

/* ---------- Copy vs adapt ---------- */
export const CopyVsAdapt: React.FC<Span & { copyAt: number; crossAt: number; adaptAt: number }> = ({ a, b, copyAt, crossAt, adaptAt }) => {
  const t = useT(a);
  const v = life(t, a, b, 0.45, 0.4);
  const cp = enter(t, copyAt, 0.6);
  const cross = enter(t, crossAt, 0.4);
  const ad = enter(t, adaptAt, 0.7, EASE.inOut);
  const shapes = [
    { w: 120, h: 210, label: "вертикальное видео" },
    { w: 230, h: 150, label: "пост" },
    { w: 200, h: 250, label: "статья", light: true },
  ];
  return (
    <AbsoluteFill style={{ background: C.ink, opacity: v, fontFamily: FONT }}>
      <div style={{ position: "absolute", left: 160, top: 300 }}>
        <Card w={300} style={{ padding: 14 }}>
          <FakeFrame w={272} h={153} />
          <div style={{ fontWeight: 800, fontSize: 28, marginTop: 12 }}>исходник</div>
        </Card>
      </div>
      {/* copies: identical clones, then crossed out */}
      <div style={{ position: "absolute", left: 620, top: 160, display: "flex", flexDirection: "column", gap: 22, opacity: cp * (1 - ad * 0.85) }}>
        {[0, 1, 2].map((i) => (
          <div key={i} style={{ position: "relative", ...rise(enter(t, copyAt + i * 0.12, 0.45), 20) }}>
            <Card w={240} style={{ padding: 10 }}>
              <FakeFrame w={220} h={124} play={false} />
            </Card>
            <svg width={240} height={146} style={{ position: "absolute", left: 0, top: 0 }}>
              <path d="M20 20 L220 126 M220 20 L20 126" stroke={C.accent} strokeWidth={6} strokeLinecap="round" strokeDasharray={240} strokeDashoffset={240 * (1 - cross)} />
            </svg>
          </div>
        ))}
        <div style={{ textAlign: "center", marginTop: 6 }}>
          <Label color={C.accent}>копия 1:1</Label>
        </div>
      </div>
      {/* adapted: different shapes for different platforms */}
      <div style={{ position: "absolute", left: 1000, top: 260, display: "flex", gap: 34, alignItems: "flex-end" }}>
        {shapes.map((s, i) => {
          const p = enter(t, adaptAt + 0.15 + i * 0.15, 0.55, EASE.pop);
          return (
            <div key={i} style={{ ...rise(p, 40), display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
              <Card w={s.w + 24} light={s.light} style={{ padding: 12 }}>
                {s.label === "вертикальное видео" ? (
                  <FakeFrame w={s.w} h={s.h} tint="#2A2238" />
                ) : (
                  <div style={{ width: s.w, height: s.h, display: "flex", flexDirection: "column", justifyContent: "center" }}>
                    <TextLines n={s.label === "пост" ? 4 : 7} w={s.w} color={s.light ? "rgba(0,0,0,0.13)" : "rgba(255,255,255,0.14)"} gap={10} h={10} />
                  </div>
                )}
              </Card>
              <div style={{ fontWeight: 700, fontSize: 26, color: C.muted }}>{s.label}</div>
            </div>
          );
        })}
      </div>
      <div style={{ position: "absolute", left: 1000, top: 170, ...rise(ad, 16) }}>
        <Label color={C.ai}>адаптация под площадку</Label>
      </div>
    </AbsoluteFill>
  );
};

/* ---------- Big quote ---------- */
export const Quote: React.FC<Span & { lines: { t: number; text: string; accent?: boolean }[]; full?: boolean }> = ({
  a,
  b,
  lines,
  full = false,
}) => {
  const t = useT(a);
  const v = life(t, a, b, 0.5, 0.45);
  return (
    <AbsoluteFill style={{ background: full ? C.ink : `rgba(13,15,18,${0.78 * v})`, opacity: full ? v : 1, justifyContent: "center", paddingLeft: 170, paddingRight: 170 }}>
      <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 150, color: C.accent, lineHeight: 0.6, height: 70, opacity: v }}>“</div>
      {lines.map((l, i) => {
        const p = enter(t, l.t, 0.55) * exit(t, b - 0.45, 0.45);
        return (
          <div key={i} style={{ fontFamily: FONT, fontWeight: 800, fontSize: 76, lineHeight: 1.15, letterSpacing: -1.2, color: l.accent ? C.accent : C.text, ...rise(p, 24) }}>
            {l.text}
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

/* ---------- Long timeline split into 5 lines that become 5 shorts ---------- */
export const FiveLines: React.FC<Span & { barAt: number; splitAt: number; outAt: number; label?: string }> = ({
  a,
  b,
  barAt,
  splitAt,
  outAt,
  label = "5 смысловых линий",
}) => {
  const t = useT(a);
  const v = life(t, a, b, 0.45, 0.45);
  const bar = enter(t, barAt, 0.8, EASE.inOut);
  const colors = ["#FF5A36", "#8EA6FF", "#F2C14E", "#5ED0A0", "#E8669B"];
  const segW = 1500 / 5;
  return (
    <AbsoluteFill style={{ background: C.ink, opacity: v, fontFamily: FONT }}>
      <div style={{ position: "absolute", left: 210, top: 250 }}>
        <Label>длинное видео</Label>
      </div>
      <div style={{ position: "absolute", left: 210, top: 300, width: 1500 * bar, height: 70, borderRadius: 16, overflow: "hidden", display: "flex", background: C.panel2 }}>
        {colors.map((c, i) => {
          const p = enter(t, splitAt + i * 0.2, 0.4);
          return <div key={i} style={{ width: segW, height: "100%", background: c, opacity: 0.18 + 0.72 * p, borderRight: `3px solid ${C.ink}` }} />;
        })}
      </div>
      <div style={{ position: "absolute", left: 210, top: 410, width: 1500, display: "flex" }}>
        {colors.map((c, i) => {
          const p = enter(t, outAt + i * 0.15, 0.55, EASE.pop);
          return (
            <div key={i} style={{ width: segW, display: "flex", justifyContent: "center", ...rise(p, 50) }}>
              <Card w={170} style={{ padding: 10, border: `2px solid ${c}88` }}>
                <FakeFrame w={150} h={266} tint={`${c}55`} />
              </Card>
            </div>
          );
        })}
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 830, textAlign: "center", ...rise(enter(t, splitAt + 0.6, 0.5), 20) }}>
        <Chip size={32}>{label}</Chip>
      </div>
    </AbsoluteFill>
  );
};

/* ---------- Views vs subscribers (the author's own reading of the screen) ---------- */
export const ViewsVsSubs: React.FC<Span & { views: string; subs: string; viewsN: number; subsN: number; at: number; verdictAt: number; verdict: string; full?: boolean }> = ({
  a,
  b,
  views,
  subs,
  viewsN,
  subsN,
  at,
  verdictAt,
  verdict,
  full,
}) => {
  const t = useT(a);
  const v = life(t, a, b, 0.45, 0.4);
  const max = Math.max(viewsN, subsN);
  const bar = (n: number, delay: number) => (n / max) * 640 * enter(t, at + delay, 0.9, EASE.inOut);
  const Row: React.FC<{ label: string; val: string; w: number; color: string }> = ({ label, val, w, color }) => (
    <div style={{ marginBottom: 34 }}>
      <div style={{ display: "flex", justifyContent: "space-between", width: 640, fontWeight: 700, fontSize: 32, color: C.muted, marginBottom: 12 }}>
        <span>{label}</span>
        <span style={{ color: C.text, fontWeight: 800 }}>{val}</span>
      </div>
      <div style={{ width: 640, height: 26, borderRadius: 26, background: C.panel2 }}>
        <div style={{ width: w, height: 26, borderRadius: 26, background: color }} />
      </div>
    </div>
  );
  const body = (
    <div style={{ position: "absolute", left: full ? 560 : PANEL.x, top: PANEL.y, width: PANEL.w, height: PANEL.h, display: "flex", flexDirection: "column", justifyContent: "center", fontFamily: FONT, opacity: full ? 1 : v }}>
      <Label>пример из поиска</Label>
      <div style={{ height: 40 }} />
      <Row label="просмотры видео" val={views} w={bar(viewsN, 0)} color={C.accent} />
      <Row label="подписчики канала" val={subs} w={bar(subsN, 0.25)} color={C.ai} />
      <div style={{ marginTop: 20, ...rise(enter(t, verdictAt, 0.5) * exit(t, b - 0.4, 0.4), 20) }}>
        <div style={{ fontWeight: 800, fontSize: 46, lineHeight: 1.15, color: C.text, maxWidth: 700 }}>{verdict}</div>
      </div>
    </div>
  );
  return full ? <AbsoluteFill style={{ background: C.ink, opacity: v }}>{body}</AbsoluteFill> : body;
};

/* ---------- Telegram call to action (only what the author says) ---------- */
export const TelegramCTA: React.FC<Span & { title: string; sub: string; noteAt: number; note: string }> = ({ a, b, title, sub, noteAt, note }) => {
  const t = useT(a);
  const v = life(t, a, b, 0.55, 0.45);
  return (
    <div style={{ position: "absolute", left: PANEL.x + 20, top: PANEL.y, width: PANEL.w - 40, height: PANEL.h, display: "flex", flexDirection: "column", justifyContent: "center", ...rise(v, 30) }}>
      <Card w={PANEL.w - 40} style={{ padding: "44px 48px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <PlatformBadge id="telegram" size={78} />
          <Label color={PLATFORM.telegram.color}>Telegram-канал</Label>
        </div>
        <div style={{ fontWeight: 800, fontSize: 56, lineHeight: 1.1, marginTop: 34 }}>{title}</div>
        <div style={{ fontWeight: 600, fontSize: 32, lineHeight: 1.3, color: C.muted, marginTop: 18 }}>{sub}</div>
        <div style={{ marginTop: 34, ...rise(enter(t, noteAt, 0.5), 16) }}>
          <Chip color={PLATFORM.telegram.color} size={30}>{note}</Chip>
        </div>
      </Card>
    </div>
  );
};

/* ---------- Small note chip, e.g. on top of a screen recording ---------- */
export const NoteChip: React.FC<Span & { text: string; x?: number; y?: number; color?: string }> = ({ a, b, text, x = 230, y = 60, color = C.accent }) => {
  const t = useT(a);
  const v = life(t, a, b, 0.45, 0.35);
  return (
    <div style={{ position: "absolute", left: x, top: y, ...rise(v, -16) }}>
      <div style={{ padding: "16px 26px", borderRadius: 18, background: "rgba(13,15,18,0.9)", border: `1.5px solid ${color}99`, fontFamily: FONT, fontWeight: 800, fontSize: 34, color: C.text, boxShadow: "0 16px 40px rgba(0,0,0,0.45)" }}>
        {text}
      </div>
    </div>
  );
};

/* ---------- Instagram legal note ---------- */
export const Disclaimer: React.FC<Span> = ({ a, b }) => {
  const t = useT(a);
  const v = life(t, a, b, 0.35, 0.35);
  return (
    <div style={{ position: "absolute", left: 40, top: 30, right: 40, display: "flex", justifyContent: "flex-start", opacity: v }}>
      <div style={{ padding: "12px 20px", borderRadius: 12, background: "rgba(13,15,18,0.82)", fontFamily: FONT, fontWeight: 600, fontSize: 26, color: C.paperDim, lineHeight: 1.3 }}>
        * Instagram — продукт корпорации Meta, деятельность которой признана экстремистской в Российской Федерации.
      </div>
    </div>
  );
};

/* ---------- Grow gradually: platforms added one by one ---------- */
export const GrowPlatforms: React.FC<Span & { items: { t: number; id: string }[] }> = ({ a, b, items }) => {
  const t = useT(a);
  const v = life(t, a, b, 0.45, 0.4);
  return (
    <div style={{ position: "absolute", left: PANEL.x, top: PANEL.y, width: PANEL.w, height: PANEL.h, display: "flex", flexDirection: "column", justifyContent: "center", fontFamily: FONT, opacity: v }}>
      <Label>постепенно</Label>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 22, marginTop: 40, height: 520 }}>
        {items.map((it, i) => {
          const p = enter(t, it.t, 0.55, EASE.pop) * exit(t, b - 0.4, 0.4);
          return (
            <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 18, ...rise(p, 40) }}>
              <PlatformBadge id={it.id} size={76} />
              <div style={{ width: 110, height: 90 + i * 85, borderRadius: 18, background: `linear-gradient(180deg, ${C.accent}${i === items.length - 1 ? "cc" : "55"}, ${C.panel2})` }} />
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* ---------- "Blank page" visual ---------- */
export const BlankPage: React.FC<Span & { label: string }> = ({ a, b, label }) => {
  const t = useT(a);
  const v = life(t, a, b, 0.5, 0.4);
  const cursor = Math.floor(t * 2) % 2 === 0 ? 1 : 0;
  return (
    <div style={{ position: "absolute", left: PANEL.x + 120, top: PANEL.y + 120, ...rise(v, 30) }}>
      <Card w={520} h={680} light style={{ padding: 50 }}>
        <div style={{ width: 4, height: 54, background: C.textDark, opacity: cursor }} />
      </Card>
      <div style={{ marginTop: 26, textAlign: "center" }}>
        <Label>{label}</Label>
      </div>
    </div>
  );
};

/* ---------- Comment prompt (author's own ask) ---------- */
export const CommentPrompt: React.FC<Span & { text: string }> = ({ a, b, text }) => {
  const t = useT(a);
  const v = life(t, a, b, 0.5, 0.4);
  return (
    <div style={{ position: "absolute", left: PANEL.x + 20, top: PANEL.y, width: PANEL.w - 40, height: PANEL.h, display: "flex", flexDirection: "column", justifyContent: "center", ...rise(v, 30) }}>
      <Card w={PANEL.w - 40} style={{ padding: "40px 44px" }}>
        <Label color={C.ai}>вопрос в комментарии</Label>
        <div style={{ fontWeight: 800, fontSize: 48, lineHeight: 1.15, marginTop: 26 }}>{text}</div>
        <div style={{ marginTop: 30, display: "flex", gap: 14 }}>
          <div style={{ flex: 1, height: 64, borderRadius: 16, background: C.panel2, border: `1.5px solid ${C.line}`, display: "flex", alignItems: "center", paddingLeft: 22 }}>
            <div style={{ width: 3, height: 32, background: C.text, opacity: Math.floor(t * 2) % 2 }} />
          </div>
        </div>
      </Card>
    </div>
  );
};


/* ---------- System flow: idea → fragments → formats → platforms ---------- */
export const SystemFlow: React.FC<Span & { tiers: { t: number; title: string; kind: "long" | "frag" | "formats" | "platforms" }[] }> = ({ a, b, tiers }) => {
  const t = useT(a);
  const v = life(t, a, b, 0.45, 0.45);
  const Tier: React.FC<{ kind: string }> = ({ kind }) => {
    if (kind === "long") return <FakeFrame w={300} h={120} />;
    if (kind === "frag")
      return (
        <div style={{ display: "flex", gap: 8 }}>
          {["#FF5A36", "#8EA6FF", "#F2C14E", "#5ED0A0", "#E8669B"].map((c) => (
            <div key={c} style={{ width: 70, height: 40, borderRadius: 10, background: `${c}aa` }} />
          ))}
        </div>
      );
    if (kind === "formats")
      return (
        <div style={{ display: "flex", gap: 12, alignItems: "flex-end" }}>
          {[0, 1, 2].map((i) => <FakeFrame key={i} w={46} h={80} tint="#2A2238" play={false} />)}
          <div style={{ width: 110, height: 80, borderRadius: 12, background: C.panel2, padding: 12, boxSizing: "border-box" }}>
            <TextLines n={3} w={86} gap={8} h={8} />
          </div>
          <div style={{ width: 80, height: 80, borderRadius: 12, background: C.paper, padding: 12, boxSizing: "border-box" }}>
            <TextLines n={4} w={56} gap={6} h={7} color="rgba(0,0,0,0.15)" />
          </div>
        </div>
      );
    return (
      <div style={{ display: "flex", gap: 12 }}>
        {["youtube", "telegram", "vk", "dzen", "vc"].map((id) => <PlatformBadge key={id} id={id} size={58} />)}
      </div>
    );
  };
  return (
    <AbsoluteFill style={{ background: C.ink, opacity: v, fontFamily: FONT, alignItems: "center", justifyContent: "center" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
        {tiers.map((tr, i) => {
          const p = enter(t, tr.t, 0.5) * exit(t, b - 0.4, 0.4);
          const arrow = i > 0 ? enter(t, tr.t - 0.15, 0.3) * exit(t, b - 0.4, 0.4) : 0;
          return (
            <React.Fragment key={i}>
              {i > 0 ? (
                <svg width={40} height={46} style={{ opacity: arrow }}>
                  <path d="M20 4 V36 M10 27 L20 38 L30 27" stroke={C.accent} strokeWidth={4} fill="none" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ) : null}
              <div style={{ display: "flex", alignItems: "center", gap: 36, width: 1100, padding: "18px 32px", borderRadius: 24, background: C.panel, border: `1.5px solid ${C.line}`, boxSizing: "border-box", ...rise(p, 24) }}>
                <div style={{ width: 400, flexShrink: 0, fontWeight: 800, fontSize: 38, color: C.text, textTransform: "uppercase", letterSpacing: 1 }}>{tr.title}</div>
                <Tier kind={tr.kind} />
              </div>
            </React.Fragment>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

/* ---------- Prompt card: the request the author dictates, line by line ---------- */
export const PromptCard: React.FC<Span & { title: string; items: { t: number; text: string }[]; place?: "panel" | "screen" }> = ({ a, b, title, items, place = "panel" }) => {
  const t = useT(a);
  const v = life(t, a, b, 0.5, 0.4);
  const box = place === "panel" ? { left: PANEL.x + 10, top: PANEL.y, width: PANEL.w - 20, height: PANEL.h } : { left: 300, top: 120, width: 820, height: 640 };
  return (
    <div style={{ position: "absolute", ...box, display: "flex", flexDirection: "column", justifyContent: place === "panel" ? "center" : "flex-start", ...rise(v, 26) }}>
      <Card w={box.width} style={{ padding: "34px 40px", background: place === "screen" ? "rgba(22,25,30,0.96)" : C.panel }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 14, height: 14, borderRadius: 14, background: C.ai }} />
          <Label color={C.ai}>{title}</Label>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 18, marginTop: 26 }}>
          {items.map((it, i) => {
            const p = enter(t, it.t, 0.45) * exit(t, b - 0.4, 0.4);
            return (
              <div key={i} style={{ display: "flex", gap: 18, ...rise(p, 14) }}>
                <div style={{ color: C.ai, fontWeight: 800, fontSize: 34, lineHeight: 1.2 }}>›</div>
                <div style={{ fontWeight: 700, fontSize: 36, lineHeight: 1.25, color: C.text }}>{it.text}</div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
};
