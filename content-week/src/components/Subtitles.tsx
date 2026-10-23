import React from "react";
import { useCurrentFrame } from "remotion";
import captionsJson from "../data/captions.json";
import { overlays } from "../plan";
import { C, FONT, FPS } from "../theme";
import { INSERTS, invT, sceneAtOut, splitAt } from "../timeline";

type Page = { start: number; end: number; lines: { w: string; hl: boolean; s: number; e: number }[][] };
const pages = captionsJson as Page[];

const fullAt = (to: number) => {
  const t = invT(to);
  return overlays.some((o) => o.full && t >= o.a + 0.2 && t < o.b - 0.2);
};

export const Subtitles: React.FC = () => {
  const t = useCurrentFrame() / FPS;
  const page = pages.find((p) => t >= p.start && t < p.end);
  if (!page || INSERTS.some((c) => t >= c.out && t < c.out + c.dur)) return null;
  const screen = sceneAtOut(t).kind === "screen";
  const split = splitAt(invT(t)) > 0.5;
  const full = fullAt(t);
  // Place the block where it does not compete with what is being shown.
  let box: React.CSSProperties = { left: 0, right: 0, bottom: 64 };
  let size = 44;
  if (full) box = { left: 0, right: 0, bottom: 44 };
  else if (screen) {
    box = { left: 0, right: 0, bottom: 6 };
    size = 36;
  } else if (split) box = { left: 64, width: 940, bottom: 100 };
  const fade = Math.min(1, (t - page.start) * 8, (page.end - t) * 8);
  return (
    <div style={{ position: "absolute", ...box, display: "flex", justifyContent: "center", pointerEvents: "none", opacity: fade }}>
      <div
        style={{
          display: "inline-flex",
          flexDirection: "column",
          alignItems: "center",
          padding: screen ? "6px 18px" : "10px 22px",
          borderRadius: 14,
          background: "rgba(13,15,18,0.66)",
          fontFamily: FONT,
          fontWeight: 700,
          fontSize: size,
          lineHeight: 1.22,
          color: C.text,
          textAlign: "center",
        }}
      >
        {page.lines.map((ln, i) => (
          <div key={i}>
            {ln.map((w, j) => (
              // the word being spoken lights up, keywords keep a softer tint
              <span key={j} style={{ color: t >= w.s - 0.04 && t < Math.max(w.e, w.s + 0.18) ? "#FF7A5C" : w.hl ? "#FFB199" : C.text }}>
                {w.w}
                {j < ln.length - 1 ? " " : ""}
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};
