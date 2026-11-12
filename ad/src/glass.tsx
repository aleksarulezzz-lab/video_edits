import React from "react";
import { Img, interpolate, staticFile } from "remotion";
import { C, EASE, UI } from "./theme";

/** Liquid Glass: frosted, blurred backdrop, thin light rim, soft shadow, highlight on top. */
export const glass = (dark = false): React.CSSProperties => ({
  background: dark
    ? "linear-gradient(180deg, rgba(40,58,110,0.62), rgba(29,42,85,0.52))"
    : "linear-gradient(180deg, rgba(255,255,255,0.72), rgba(244,238,226,0.52))",
  backdropFilter: "blur(26px) saturate(1.35)",
  WebkitBackdropFilter: "blur(26px) saturate(1.35)",
  border: `1.25px solid ${dark ? "rgba(255,255,255,0.45)" : "rgba(255,255,255,0.95)"}`,
  borderRadius: 28,
  boxShadow: `inset 0 1.5px 0 rgba(255,255,255,${dark ? 0.35 : 0.95}), inset 0 -12px 28px rgba(47,95,208,0.08), 0 18px 44px rgba(20,30,60,0.28)`,
});

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
export const ease = (t: number, a: number, d = 0.4, e = EASE.out) => interpolate(t, [a, a + d], [0, 1], { ...clamp, easing: e });
export const fade = (t: number, b: number, d = 0.35) => interpolate(t, [b - d, b], [1, 0], clamp);

export const LOGOS: Record<string, string> = {
  claude: "logos/claude.svg", claudecode: "logos/claudecode.svg", elevenlabs: "logos/elevenlabs.svg", pinterest: "logos/pinterest.svg",
  instagram: "logos/instagram.svg", telegram: "logos/telegram.svg", youtube: "logos/youtube.svg",
};

/** service mark: official logo when available, otherwise a lettered badge (FL.ru, Kwork, Flaks, clock, money) */
export const Mark: React.FC<{ name?: string | null; size?: number }> = ({ name, size = 48 }) => {
  if (!name) return null;
  if (LOGOS[name]) return <Img src={staticFile(LOGOS[name])} style={{ width: size, height: size, flex: "none" }} />;
  const badge: Record<string, [string, string, string]> = {
    fl: ["FL", "#2bb24c", "#fff"], kwork: ["K", "#ffbd24", "#1b1b1b"], flaks: ["F", "#6c4cf5", "#fff"],
    money: ["₽", C.yellow, C.navy], clock: ["◷", C.blue, "#fff"],
  };
  const [t, bg, fg] = badge[name] ?? ["•", C.blue, "#fff"];
  return (
    <div style={{ width: size, height: size, flex: "none", borderRadius: size * 0.26, background: bg, color: fg, display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: UI, fontWeight: 700, fontSize: size * (t.length > 1 ? 0.42 : 0.6) }}>{t}</div>
  );
};

/** caption on the free wall left or right of the author: slides in from the edge with a spring, dissolves */
export const SideCaption: React.FC<{ t: number; a: number; b: number; text: string; side: string; slot: number; icon?: string | null; big?: boolean }> = ({
  t, a, b, text, side, slot, icon, big,
}) => {
  const p = ease(t, a, 0.32, EASE.spring);
  const q = fade(t, b, 0.4);
  const L = side === "L";
  const maxW = L ? 560 : 440;
  const fs = big ? 46 : 38;
  return (
    <div style={{ position: "absolute", top: 120 + slot * 170, [L ? "left" : "right"]: 64, maxWidth: maxW, opacity: Math.min(1, p * 1.4) * q,
      transform: `translateX(${(1 - p) * (L ? -80 : 80)}px)` }}>
      <div style={{ ...glass(), padding: big ? "22px 30px" : "18px 26px", display: "flex", alignItems: "center", gap: 16 }}>
        <Mark name={icon} size={fs * 1.1} />
        <div style={{ fontFamily: UI, fontWeight: 700, fontSize: fs, lineHeight: 1.18, color: C.navy, letterSpacing: -0.3 }}>{text}</div>
      </div>
    </div>
  );
};

/** logo pill when a service is named */
export const LogoPill: React.FC<{ t: number; a: number; b: number; logo: string; label?: string; side: string }> = ({ t, a, b, logo, label, side }) => {
  const p = ease(t, a, 0.32, EASE.spring) * fade(t, b, 0.35);
  return (
    <div style={{ position: "absolute", top: 130, [side === "L" ? "left" : "right"]: 64, opacity: p, transform: `scale(${0.85 + 0.15 * p})`, transformOrigin: side === "L" ? "left top" : "right top" }}>
      <div style={{ ...glass(), padding: "16px 26px 16px 18px", display: "flex", alignItems: "center", gap: 16 }}>
        <div style={{ width: 70, height: 70, borderRadius: 20, background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 12px rgba(0,0,0,0.12)" }}>
          <Mark name={logo} size={46} />
        </div>
        {label ? <div style={{ fontFamily: UI, fontWeight: 700, fontSize: 40, color: C.navy }}>{label}</div> : null}
      </div>
    </div>
  );
};

/** label under a window: glass pill with a logo */
export const WindowLabel: React.FC<{ text: string; logo?: string; x: number; y: number; p: number }> = ({ text, logo, x, y, p }) => (
  <div style={{ position: "absolute", left: x, top: y, opacity: p, transform: `translateY(${(1 - p) * 14}px)` }}>
    <div style={{ ...glass(true), padding: "12px 24px 12px 16px", display: "flex", alignItems: "center", gap: 14 }}>
      {logo ? <div style={{ width: 44, height: 44, borderRadius: 12, background: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}><Mark name={logo} size={30} /></div> : null}
      <div style={{ fontFamily: UI, fontWeight: 600, fontSize: 30, color: "#fff" }}>{text}</div>
    </div>
  </div>
);
