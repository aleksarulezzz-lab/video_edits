import React from "react";
import { C, FONT } from "../theme";

/** Shared building blocks so every graphic uses the same card/label language. */

export const Card: React.FC<{
  w: number;
  h?: number;
  light?: boolean;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}> = ({ w, h, light, style, children }) => (
  <div
    style={{
      width: w,
      height: h,
      borderRadius: 26,
      background: light ? C.paper : C.panel,
      color: light ? C.textDark : C.text,
      border: light ? "none" : `1.5px solid ${C.line}`,
      boxShadow: "0 24px 60px rgba(0,0,0,0.45)",
      fontFamily: FONT,
      boxSizing: "border-box",
      overflow: "hidden",
      ...style,
    }}
  >
    {children}
  </div>
);

export const Label: React.FC<{ color?: string; children: React.ReactNode; style?: React.CSSProperties }> = ({
  color = C.muted,
  children,
  style,
}) => (
  <div
    style={{
      fontFamily: FONT,
      fontWeight: 700,
      fontSize: 24,
      letterSpacing: 2.5,
      textTransform: "uppercase",
      color,
      ...style,
    }}
  >
    {children}
  </div>
);

export const Chip: React.FC<{ color?: string; dark?: boolean; children: React.ReactNode; size?: number }> = ({
  color = C.accent,
  dark,
  children,
  size = 26,
}) => (
  <span
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 10,
      padding: `${size * 0.35}px ${size * 0.75}px`,
      borderRadius: 999,
      background: dark ? "rgba(255,255,255,0.06)" : `${color}22`,
      border: `1.5px solid ${color}66`,
      color,
      fontFamily: FONT,
      fontWeight: 700,
      fontSize: size,
      whiteSpace: "nowrap",
    }}
  >
    {children}
  </span>
);

/** Placeholder "frame" inside a video card: neutral bars, explicitly illustrative. */
export const FakeFrame: React.FC<{ w: number; h: number; tint?: string; play?: boolean }> = ({
  w,
  h,
  tint = C.panel2,
  play = true,
}) => (
  <div
    style={{
      width: w,
      height: h,
      borderRadius: 14,
      background: `linear-gradient(160deg, ${tint}, ${C.ink})`,
      position: "relative",
      overflow: "hidden",
    }}
  >
    {play ? (
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          width: Math.min(w, h) * 0.28,
          height: Math.min(w, h) * 0.28,
          transform: "translate(-50%,-50%)",
          borderRadius: "50%",
          background: "rgba(255,255,255,0.12)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            width: 0,
            height: 0,
            marginLeft: Math.min(w, h) * 0.03,
            borderTop: `${Math.min(w, h) * 0.06}px solid transparent`,
            borderBottom: `${Math.min(w, h) * 0.06}px solid transparent`,
            borderLeft: `${Math.min(w, h) * 0.1}px solid rgba(255,255,255,0.8)`,
          }}
        />
      </div>
    ) : null}
  </div>
);

export const TextLines: React.FC<{ n: number; w: number; color?: string; gap?: number; h?: number }> = ({
  n,
  w,
  color = "rgba(255,255,255,0.14)",
  gap = 12,
  h = 12,
}) => (
  <div style={{ display: "flex", flexDirection: "column", gap }}>
    {Array.from({ length: n }).map((_, i) => (
      <div
        key={i}
        style={{ width: i === n - 1 ? w * 0.6 : w * (0.85 + ((i * 37) % 15) / 100), height: h, borderRadius: h, background: color }}
      />
    ))}
  </div>
);

/** Small platform marks drawn as generic badges (simple shapes, no third-party logos). */
export const PLATFORM: Record<string, { name: string; color: string }> = {
  youtube: { name: "YouTube", color: "#FF4E45" },
  instagram: { name: "Instagram*", color: "#E8669B" },
  telegram: { name: "Telegram", color: "#4DA8E8" },
  vk: { name: "ВКонтакте", color: "#5B8DEF" },
  dzen: { name: "Дзен", color: "#E6E1D8" },
  vc: { name: "VC.ru", color: "#E85D75" },
};

const Mark: React.FC<{ id: string; color: string; s: number }> = ({ id, color, s }) => {
  const st = { fill: "none", stroke: color, strokeWidth: 2.2, strokeLinejoin: "round" as const, strokeLinecap: "round" as const };
  switch (id) {
    case "youtube":
      return <svg width={s} height={s} viewBox="0 0 24 24"><rect x="2.5" y="5" width="19" height="14" rx="4" {...st} /><path d="M10 9.2v5.6l4.8-2.8z" fill={color} /></svg>;
    case "instagram":
      return <svg width={s} height={s} viewBox="0 0 24 24"><rect x="3.5" y="3.5" width="17" height="17" rx="5" {...st} /><circle cx="12" cy="12" r="4" {...st} /><circle cx="17" cy="7" r="1.1" fill={color} /></svg>;
    case "telegram":
      return <svg width={s} height={s} viewBox="0 0 24 24"><path d="M3 11.5 20.5 4.5 17.5 19.5 11 15.2 8.8 18.5 8.5 13.8 3 11.5Z" {...st} /><path d="M8.5 13.8 17 7.5" {...st} /></svg>;
    case "dzen":
      return <svg width={s} height={s} viewBox="0 0 24 24"><path d="M12 2.5C12.6 9 15 11.4 21.5 12 15 12.6 12.6 15 12 21.5 11.4 15 9 12.6 2.5 12 9 11.4 11.4 9 12 2.5Z" fill={color} /></svg>;
    default:
      return (
        <span style={{ fontFamily: FONT, fontWeight: 800, fontSize: s * 0.62, color, letterSpacing: -0.5 }}>
          {id === "vk" ? "VK" : "vc"}
        </span>
      );
  }
};

export const PlatformBadge: React.FC<{ id: string; size?: number }> = ({ id, size = 56 }) => {
  const p = PLATFORM[id];
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.28,
        background: `${p.color}22`,
        border: `1.5px solid ${p.color}88`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      <Mark id={id} color={p.color} s={size * 0.6} />
    </div>
  );
};
