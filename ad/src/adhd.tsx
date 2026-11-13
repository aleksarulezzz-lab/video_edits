import React from "react";
import { AbsoluteFill, Img, OffthreadVideo, interpolate, staticFile, useCurrentFrame } from "remotion";
import { C, EASE, FPS, SERIF, UI } from "./theme";
import { Mark, ease, fade, glass } from "./glass";
import { Grain, Sheet, Strip, jitter, rnd, torn } from "./paper";

/**
 * «СДВГ-монтаж» around the author: big plates on one side that pile up one by one and stay,
 * visuals on the other side (a piece of video, a phone, a logo, a price tag, an inbox, chat bubbles),
 * numbered full-screen chapter cards and a full-screen board over a screencast.
 */
type Ev = { kind: string; a: number; b: number; [k: string]: unknown };
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const pop = (t: number, a: number, d = 0.4) => interpolate(t, [a, a + d], [0, 1], { ...clamp, easing: EASE.spring });

/* ---------- plates: one, then one + two, then one + two + three ---------- */
export const Stack: React.FC<{ e: Ev; t: number }> = ({ e, t }) => {
  const L = e.side !== "R";
  const items = e.items as { text: string; at: number; tone?: string }[];
  const out = fade(t, e.b, 0.4);
  const W = (e.w as number) ?? (L ? 720 : 560);
  const fs = (e.fs as number) ?? 48;
  // a single plate sits lower on the wall, a list starts higher and grows down
  const top = (e.top as number) ?? (items.length >= 3 ? 130 : items.length === 2 ? 200 : 280);
  return (
    <div style={{ position: "absolute", top, [L ? "left" : "right"]: 56, width: W, display: "flex", flexDirection: "column",
      alignItems: L ? "flex-start" : "flex-end", gap: 18, opacity: out }}>
      {items.map((it, i) => {
        const p = pop(t, it.at, 0.42);
        if (p <= 0) return null;
        const tone = it.tone ?? (i === items.length - 1 && items.length > 1 ? "blue" : "light");
        const dark = tone === "blue" || tone === "navy";
        return (
          <div key={i} style={{ opacity: Math.min(1, p * 1.5), transform: `translateX(${(1 - p) * (L ? -90 : 90)}px) scale(${0.9 + 0.1 * p})`,
            transformOrigin: L ? "left center" : "right center",
            ...glass(dark), ...(tone === "blue" ? { background: "linear-gradient(180deg, rgba(47,95,208,0.92), rgba(36,74,170,0.9))" } : {}),
            padding: "20px 30px 22px", display: "flex", alignItems: "center", gap: 18, maxWidth: W }}>
            {items.length > 1 && e.numbers !== false ? (
              <div style={{ width: fs * 1.05, height: fs * 1.05, flex: "none", borderRadius: "50%", background: dark ? "#fff" : C.blue, color: dark ? C.blue : "#fff",
                display: "flex", alignItems: "center", justifyContent: "center", fontFamily: UI, fontWeight: 700, fontSize: fs * 0.6 }}>{i + 1}</div>
            ) : null}
            <div style={{ fontFamily: UI, fontWeight: 700, fontSize: fs, lineHeight: 1.12, color: dark ? "#fff" : C.navy, letterSpacing: -0.5 }}>{it.text}</div>
          </div>
        );
      })}
    </div>
  );
};

/* ---------- visuals on the free side ---------- */
const Card: React.FC<{ L: boolean; p: number; out: number; w: number; top: number; rot: number; children: React.ReactNode }> = ({ L, p, out, w, top, rot, children }) => (
  <div style={{ position: "absolute", top, [L ? "left" : "right"]: 60, width: w, opacity: Math.min(1, p * 1.4) * out,
    transform: `translateY(${(1 - p) * 60}px) rotate(${rot * p}deg) scale(${0.86 + 0.14 * p})`, transformOrigin: "center" }}>{children}</div>
);

export const Vis: React.FC<{ e: Ev; t: number }> = ({ e, t }) => {
  const f = useCurrentFrame();
  const L = e.side === "L";
  const p = pop(t, e.a, 0.5);
  const out = fade(t, e.b, 0.4);
  const type = e.type as string;
  const k = (t - e.a) / Math.max(0.1, e.b - e.a);
  if (type === "video") {
    // a piece of footage on a white paper frame, tilted
    const w = (e.w as number) ?? 520, h = w * ((e.ar as number) ?? 9 / 16);
    return (
      <Card L={L} p={p} out={out} w={w + 24} top={(e.top as number) ?? 150} rot={L ? -2.5 : 2.5}>
        <div style={{ background: "#fff", padding: 12, boxShadow: "0 22px 50px rgba(20,25,45,0.4)" }}>
          <div style={{ width: w, height: h, overflow: "hidden", position: "relative" }}>
            <OffthreadVideo src={staticFile(e.file as string)} trimBefore={Math.round((e.at as number) * FPS)} muted
              style={{ width: "100%", height: "100%", objectFit: "cover", transform: `scale(${1.02 + 0.05 * k})` }} />
          </div>
        </div>
        {e.label ? <div style={{ marginTop: -18, display: "flex", justifyContent: "center" }}><Strip text={e.label as string} bg={C.yellow} size={36} seed={51} rot={-2} /></div> : null}
      </Card>
    );
  }
  if (type === "phone") {
    const w = (e.w as number) ?? 330;
    return (
      <Card L={L} p={p} out={out} w={w + 28} top={(e.top as number) ?? 90} rot={L ? -3 : 3}>
        <div style={{ background: "#111", borderRadius: 54, padding: 14, boxShadow: `0 0 0 3px rgba(150,180,255,0.9), 0 0 40px rgba(47,95,208,0.7), 0 30px 60px rgba(0,0,0,0.45)` }}>
          <div style={{ width: w, height: w * 16 / 9, borderRadius: 42, overflow: "hidden" }}>
            <OffthreadVideo src={staticFile(e.file as string)} trimBefore={Math.round((e.at as number) * FPS)} muted style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
        </div>
        {e.label ? <div style={{ marginTop: -26, display: "flex", justifyContent: "center" }}><Strip text={e.label as string} bg={C.yellow} size={34} seed={52} rot={2} /></div> : null}
      </Card>
    );
  }
  if (type === "logo") {
    return (
      <Card L={L} p={p} out={out} w={360} top={(e.top as number) ?? 170} rot={L ? -3 : 3}>
        <div style={{ ...glass(), padding: 30, display: "flex", flexDirection: "column", alignItems: "center", gap: 18 }}>
          <div style={{ width: 170, height: 170, borderRadius: 44, background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 8px 24px rgba(0,0,0,0.15)" }}>
            <Mark name={e.logo as string} size={120} />
          </div>
          <div style={{ fontFamily: UI, fontWeight: 700, fontSize: 46, color: C.navy }}>{e.label as string}</div>
        </div>
      </Card>
    );
  }
  if (type === "price") {
    const lines = (e.text as string).split("|");
    return (
      <Card L={L} p={p} out={out} w={470} top={(e.top as number) ?? 200} rot={L ? -4 : 4}>
        <div style={{ position: "relative", background: C.yellow, clipPath: "polygon(14% 0, 100% 0, 100% 100%, 14% 100%, 0 50%)", padding: "34px 40px 34px 110px",
          filter: "drop-shadow(0 16px 22px rgba(20,20,30,0.4))" }}>
          <Grain seed={61} opacity={0.3} />
          <div style={{ position: "absolute", left: 40, top: "50%", width: 30, height: 30, marginTop: -15, borderRadius: "50%", background: C.cream }} />
          <div style={{ position: "relative", fontFamily: SERIF, fontWeight: 700, fontSize: 40, color: C.navy }}>{lines[0]}</div>
          <div style={{ position: "relative", fontFamily: SERIF, fontWeight: 700, fontSize: 74, lineHeight: 1.05, color: C.ink, whiteSpace: "nowrap" }}>{lines[1]}</div>
        </div>
      </Card>
    );
  }
  if (type === "tags") {
    // ad prices go up: red price tags float upwards with arrows
    return (
      <div style={{ position: "absolute", top: 110, [L ? "left" : "right"]: 50, width: 480, height: 640, opacity: out }}>
        {[0, 1, 2, 3].map((i) => {
          const q = pop(t, e.a + i * 0.35, 0.45);
          const y = 460 - i * 130 - (t - e.a) * 30;
          return (
            <div key={i} style={{ position: "absolute", left: 40 + (i % 2) * 170, top: y, opacity: q, transform: `scale(${0.6 + 0.4 * q}) rotate(${(rnd(i + 3) - 0.5) * 16}deg) ${jitter(f, i)}` }}>
              <div style={{ background: C.red, color: "#fff", clipPath: "polygon(18% 0, 100% 0, 100% 100%, 18% 100%, 0 50%)", padding: "16px 28px 16px 52px",
                fontFamily: UI, fontWeight: 700, fontSize: 48, filter: "drop-shadow(0 8px 12px rgba(0,0,0,0.3))" }}>₽ ↑</div>
            </div>
          );
        })}
        {e.label ? <div style={{ position: "absolute", left: 0, top: 600, opacity: pop(t, e.a + 1.3) }}><Strip text={e.label as string} bg={C.cream} fg={C.navy} size={44} seed={63} rot={-2} /></div> : null}
      </div>
    );
  }
  if (type === "inbox") {
    // the agent's morning: an inbox card, rows arrive one by one (generic wording, no real data)
    const rows = e.rows as string[];
    return (
      <Card L={L} p={p} out={out} w={500} top={(e.top as number) ?? 140} rot={L ? -2 : 2}>
        <div style={{ ...glass(), padding: "26px 28px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 12 }}>
            <div style={{ width: 54, height: 54, borderRadius: 14, background: C.blue, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32 }}>✉</div>
            <div style={{ fontFamily: UI, fontWeight: 700, fontSize: 40, color: C.navy }}>{e.title as string}</div>
          </div>
          {rows.map((r, i) => {
            const q = pop(t, e.a + 0.5 + i * 0.45, 0.4);
            return (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 12, padding: "14px 18px", borderRadius: 18, background: "#fff",
                opacity: q, transform: `translateX(${(1 - q) * 60}px)`, boxShadow: "0 4px 12px rgba(20,30,60,0.12)" }}>
                <div style={{ width: 14, height: 14, borderRadius: "50%", background: C.blue, flex: "none" }} />
                <div style={{ fontFamily: UI, fontWeight: 600, fontSize: 32, color: C.navy }}>{r}</div>
              </div>
            );
          })}
        </div>
      </Card>
    );
  }
  if (type === "bubbles") {
    // questions from the group: chat bubbles with question marks popping around them
    const qs = e.items as { text: string; at: number }[];
    return (
      <div style={{ position: "absolute", top: 110, [L ? "left" : "right"]: 50, width: 560, opacity: out, display: "flex", flexDirection: "column", gap: 22, alignItems: L ? "flex-start" : "flex-end" }}>
        {qs.map((q, i) => {
          const s = pop(t, q.at, 0.42);
          if (s <= 0) return null;
          return (
            <div key={i} style={{ position: "relative", opacity: Math.min(1, s * 1.5), transform: `scale(${0.7 + 0.3 * s})`, transformOrigin: L ? "left bottom" : "right bottom" }}>
              <div style={{ background: "#fff", borderRadius: 30, [L ? "borderBottomLeftRadius" : "borderBottomRightRadius"]: 6, padding: "20px 28px", maxWidth: 520,
                boxShadow: "0 14px 30px rgba(20,30,60,0.28)", fontFamily: UI, fontWeight: 700, fontSize: 38, lineHeight: 1.15, color: C.navy }}>{q.text}</div>
              <div style={{ position: "absolute", [L ? "right" : "left"]: -44, top: -30, fontFamily: SERIF, fontWeight: 700, fontSize: 84, color: i % 2 ? C.yellow : C.blue,
                transform: `rotate(${(i % 2 ? 14 : -12) + Math.sin((t - q.at) * 3) * 6}deg) scale(${pop(t, q.at + 0.2, 0.4)})`, textShadow: "0 6px 14px rgba(0,0,0,0.25)" }}>?</div>
            </div>
          );
        })}
      </div>
    );
  }
  return null;
};

/* ---------- chapter card: a full kraft sheet, big step number and the title (unlike the inserts) ---------- */
export const Step: React.FC<{ e: Ev }> = ({ e }) => {
  const f = useCurrentFrame();
  const d = (e.b - e.a) * FPS;
  const inP = interpolate(f, [0, 8], [0, 1], { ...clamp, easing: EASE.out });
  const outP = interpolate(f, [d - 8, d], [0, 1], { ...clamp, easing: EASE.inOut });
  const num = e.num as string | undefined;
  const title = e.title as string;
  const sub = e.sub as string | undefined;
  const np = pop(f / FPS, 0.12, 0.45), tp = pop(f / FPS, 0.25, 0.45), sp = pop(f / FPS, 0.4, 0.45);
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, transform: `translateY(${(1 - inP) * 1150 - outP * 1150}px)` }}>
        <div style={{ position: "absolute", left: -40, top: -40, width: 2000, height: 1160, background: C.kraft }}>
          <Grain seed={23} opacity={0.6} />
          <div style={{ position: "absolute", inset: 0, background: "radial-gradient(110% 90% at 50% 50%, rgba(255,255,255,0.08) 40%, rgba(60,40,20,0.35) 100%)" }} />
        </div>
        <div style={{ position: "absolute", left: 0, top: 0, width: 1920, height: 90, background: C.navy, clipPath: torn(91, 6, 30, "b") }} />
        <div style={{ position: "absolute", left: 0, bottom: 0, width: 1920, height: 90, background: C.navy, clipPath: torn(92, 6, 30, "t") }} />
        <div style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0, display: "flex", alignItems: "center", justifyContent: "center", gap: 70, transform: jitter(f, 3, 2, 0.3) }}>
          <div style={{ width: 330, height: 330, flex: "none", borderRadius: "50%", background: num ? C.navy : C.red, display: "flex", alignItems: "center", justifyContent: "center",
            transform: `scale(${np}) rotate(${(1 - np) * -40}deg)`, boxShadow: "0 24px 50px rgba(30,20,10,0.45)", border: `10px solid ${C.cream}` }}>
            <div style={{ fontFamily: SERIF, fontWeight: 700, fontSize: num ? 230 : 200, color: num ? C.yellow : C.cream, lineHeight: 1, marginTop: num ? -14 : -10 }}>{num ?? "!"}</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 16, maxWidth: 1180 }}>
            {num ? <div style={{ opacity: tp, transform: `translateX(${(1 - tp) * 60}px)` }}><Strip text={`Шаг ${num}`} bg={C.cream} fg={C.navy} size={58} seed={71} rot={-2} /></div> : null}
            <div style={{ opacity: tp, transform: `translateX(${(1 - tp) * 80}px)` }}>
              <div style={{ background: C.cream, clipPath: torn(72, 2, 18, "lr"), padding: "18px 44px 24px", transform: "rotate(-1deg)", filter: "drop-shadow(0 10px 14px rgba(20,20,30,0.35))" }}>
                <div style={{ fontFamily: SERIF, fontWeight: 700, fontSize: title.length > 18 ? 92 : 112, lineHeight: 1.05, color: C.ink }}>{title}</div>
              </div>
            </div>
            {sub ? <div style={{ opacity: sp, transform: `translateX(${(1 - sp) * 60}px)` }}><Strip text={sub} bg={C.yellow} size={52} seed={73} rot={1.5} /></div> : null}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

/* ---------- full-screen screencast with plates piling up over it (orders on the freelance site) ---------- */
export const Board: React.FC<{ e: Ev }> = ({ e }) => {
  const f = useCurrentFrame();
  const t = e.a + f / FPS;
  const o = ease(t, e.a, 0.4) * fade(t, e.b, 0.4);
  const items = e.items as { text: string; at: number; icon?: string; file: string; src: number; crop: number[]; rate?: number }[];
  const ci = Math.max(0, items.map((it) => t >= it.at - 0.2).lastIndexOf(true));
  const cur = items[ci];
  const [cx, cy, cw, ch] = cur.crop;
  const BW = 1800, BH = 820;
  const k = Math.min(BW / cw, BH / ch);
  const w = cw * k, h = ch * k;
  const sp = ease(t, cur.at - 0.2, 0.4);
  const rate = cur.rate ?? 0.5;
  return (
    <AbsoluteFill style={{ opacity: o, background: `radial-gradient(90% 80% at 50% 45%, #253a78, ${C.navy})` }}>
      <div style={{ position: "absolute", left: (1920 - w) / 2, top: 130 + (BH - h) / 2, width: w, height: h, overflow: "hidden", borderRadius: 26, background: "#fff",
        boxShadow: `0 0 0 2px rgba(150,180,255,0.95), 0 0 26px 6px rgba(47,95,208,0.85), 0 30px 70px rgba(0,0,0,0.45)`, opacity: 0.35 + 0.65 * sp }}>
        <OffthreadVideo key={ci} src={staticFile(cur.file)} trimBefore={Math.round(cur.src * rate * FPS)} playbackRate={rate} muted
          style={{ position: "absolute", left: -cx * k, top: -cy * k, width: 1920 * k, height: 1080 * k, maxWidth: "none" }} />
      </div>
      <div style={{ position: "absolute", right: 50, bottom: 50, width: 820, display: "flex", flexDirection: "column", gap: 14, alignItems: "flex-end" }}>
        {items.map((it, i) => {
          const q = pop(t, it.at, 0.42);
          if (q <= 0) return null;
          const last = i === ci;
          return (
            <div key={i} style={{ opacity: Math.min(1, q * 1.5), transform: `translateX(${(1 - q) * 90}px)`, ...glass(!last),
              ...(last ? { background: "linear-gradient(180deg, rgba(47,95,208,0.95), rgba(36,74,170,0.93))" } : {}),
              padding: "16px 24px", display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{ width: 52, height: 52, borderRadius: 14, background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}><Mark name={it.icon} size={36} /></div>
              <div style={{ fontFamily: UI, fontWeight: 700, fontSize: 38, lineHeight: 1.15, color: "#fff" }}>{it.text}</div>
            </div>
          );
        })}
      </div>
      {e.title ? <div style={{ position: "absolute", left: 60, top: 26, opacity: ease(t, e.a + 0.2, 0.4) }}><Strip text={e.title as string} bg={C.yellow} size={56} seed={81} rot={-2} /></div> : null}
    </AbsoluteFill>
  );
};

export const _unused = { Img, Sheet };
