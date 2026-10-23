import React from "react";
import { AbsoluteFill, Sequence } from "remotion";
import { enter, exit, useSec } from "../anim";
import { C, EASE, FONT } from "../theme";

/**
 * Full-screen step interstitial, inserted into the timeline (the talk pauses for it).
 * `step` 1..total shows a numbered card with progress; `step` 0 is the "лайфхак" variant.
 */
export const StepCard: React.FC<{ dur: number; step: number; total?: number; title: string; label?: string }> = ({
  dur,
  step,
  total = 6,
  title,
  label,
}) => {
  const t = useSec();
  const out = exit(t, dur - 0.28, 0.28);
  const num = enter(t, 0.0, 0.6, EASE.out);
  const txt = enter(t, 0.18, 0.55, EASE.out);
  const bar = enter(t, 0.35, 0.8, EASE.inOut);
  const isHack = step === 0;
  return (
    <AbsoluteFill style={{ backgroundColor: C.ink, fontFamily: FONT }}>
      {/* thin accent sweep across the top as the card arrives */}
      <div style={{ position: "absolute", left: 0, top: 0, height: 8, width: `${100 * enter(t, 0, 0.5, EASE.out)}%`, background: C.accent, opacity: out }} />
      <div style={{ position: "absolute", left: 160, top: 0, bottom: 0, display: "flex", alignItems: "center", gap: 70, opacity: out }}>
        <div style={{ width: 360, display: "flex", justifyContent: "center", opacity: num, transform: `translateX(${(1 - num) * -60}px)` }}>
          {isHack ? (
            <svg width={250} height={330} viewBox="0 0 24 32">
              <path d="M14 1 L3 18 H11 L9 31 L21 12 H13 Z" fill="none" stroke={C.accent} strokeWidth={1.4} strokeLinejoin="round" />
            </svg>
          ) : (
            <div style={{ fontWeight: 800, fontSize: 330, lineHeight: 1, color: "transparent", WebkitTextStroke: `5px ${C.accent}`, letterSpacing: -10 }}>
              {String(step).padStart(2, "0")}
            </div>
          )}
        </div>
        <div style={{ width: 1100, opacity: txt, transform: `translateY(${(1 - txt) * 30}px)` }}>
          <div style={{ fontWeight: 800, fontSize: 30, letterSpacing: 4, textTransform: "uppercase", color: C.accent }}>
            {label ?? (isHack ? "лайфхак" : `шаг ${step} из ${total}`)}
          </div>
          <div style={{ marginTop: 22, fontWeight: 800, fontSize: 92, lineHeight: 1.04, letterSpacing: -2, color: C.text }}>{title}</div>
        </div>
      </div>
      {!isHack ? (
        <div style={{ position: "absolute", left: 160, bottom: 150, display: "flex", gap: 14, opacity: out }}>
          {Array.from({ length: total }).map((_, i) => {
            const n = i + 1;
            const fill = n < step ? 1 : n === step ? bar : 0;
            return (
              <div key={i} style={{ width: 150, height: 10, borderRadius: 10, background: C.line, overflow: "hidden" }}>
                <div style={{ width: `${fill * 100}%`, height: "100%", background: n === step ? C.accent : C.muted }} />
              </div>
            );
          })}
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

/** Preview: the three variants back to back, for approval. */
export const StepCardPreview: React.FC = () => {
  const d = 1.8;
  const cards = [
    { step: 1, title: "Определяю, что хочу получить на выходе" },
    { step: 0, title: "Где искать тему для видео" },
    { step: 4, title: "Записываю длинное видео целиком" },
  ];
  return (
    <AbsoluteFill>
      {cards.map((c, i) => (
        <Sequence key={i} from={Math.round(i * d * 25)} durationInFrames={Math.round(d * 25)}>
          <StepCard dur={d} {...c} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
