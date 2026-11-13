import React from "react";
import { AbsoluteFill, Audio, Img, OffthreadVideo, Sequence, interpolate, staticFile, useCurrentFrame } from "remotion";
import { C, EASE, FPS, GLOW, ELEGANT, ROUND, SERIF, UI } from "./theme";
import { LogoPill, Mark, SideCaption, WindowLabel, ease, fade, glass } from "./glass";
import { Grain, Sheet, Strip, jitter, torn } from "./paper";
import { Guide, Insert, Listen, Plate } from "./inserts";
import edl from "./data/edl.json";
import gfx from "./data/gfx.json";

/**
 * «Рекламный ролик без дизайнера»: the author in the centre (1920×1080, 30 fps), captions on the free wall
 * left and right of her, words behind her, screencasts in glowing glass windows with her face in a circle,
 * paper-collage chapter cards and motion inserts, tier lists that stay long enough to read.
 */
type Clip = { src: string; in: number; dur: number; out: number };
export type Ev = { kind: string; a: number; b: number; [k: string]: unknown };
const CLIPS = edl as Clip[];
export const EV = gfx.events as Ev[];
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const on = (e: Ev, t: number, pad = 0) => t >= e.a - pad && t < e.b + pad;

const FILE: Record<string, string> = { main: "media/main.mp4", dg: "media/dg.mp4", dp: "media/dp.mp4", rh: "media/rh.mp4" };
// face centre per recording (the re-shoot about «eyes and taste» is framed wider: base zoom brings it closer)
const FACE: Record<string, { x: number; y: number; base: number }> = {
  main: { x: 1002, y: 330, base: 1 }, dg: { x: 980, y: 360, base: 1.12 }, dp: { x: 962, y: 300, base: 1 },
};
// while one of these is on screen the author shrinks to a circle in the corner and her frame blurs behind the window
const PIP = (e: Ev) => e.kind === "screen" || (e.kind === "clip" && e.mode !== "full") || e.kind === "endcard";
const FACEON = (e: Ev) => e.face !== false;
const PIPC = { x: 1690, y: 820, r: 165 };
const FG_FRAMES: Record<string, number> = { bez: 111, snachala: 150, golos: 114, glaza: 174, zamysel: 126, ot3000: 126 };

const MainClip: React.FC<{ c: Clip; idx: number; n: number }> = ({ c, idx, n }) => {
  const f = useCurrentFrame();
  const t = c.out + f / FPS;
  const vol = (fr: number) => Math.min(1, (fr + 1) / 2, (n - fr) / 2);
  const src = staticFile(FILE[c.src]);
  const trim = Math.round(c.in * FPS);
  if (c.src === "rh") {
    return <OffthreadVideo src={src} trimBefore={trim} volume={(fr) => 0.52 * vol(fr)} style={{ width: 1920, height: 1080 }} />;
  }
  const F = FACE[c.src];
  const pipE = EV.find((e) => PIP(e) && on(e, t, 0.25));
  const pp = pipE ? ease(t, pipE.a - 0.25, 0.4) * interpolate(t, [pipE.b - 0.05, pipE.b + 0.3], [1, 0], clamp) : 0;
  const z = F.base * ((idx % 2 ? 1.12 : 1.0) + 0.03 * Math.min(1, f / Math.max(1, n)));
  const depth = EV.filter((e) => e.kind === "depth" && t >= e.a - 0.05 && t < e.b + 0.05);
  const zoomed = (child: React.ReactNode) => (
    <div style={{ position: "absolute", inset: 0, transformOrigin: `${F.x}px ${F.y}px`, transform: `scale(${z})` }}>{child}</div>
  );
  // the phrase sits in the frame (not zoomed), between the zoomed footage and her zoomed cut-out
  const frame = (
    <>
      {zoomed(<OffthreadVideo src={src} trimBefore={trim} volume={vol} style={{ width: 1920, height: 1080 }} />)}
      {depth.map((e, i) => <DepthText key={`t${i}`} e={e} t={t} />)}
      {depth.map((e, i) => zoomed(<DepthCut key={`c${i}`} e={e} srcT={c.in + f / FPS} />))}
    </>
  );
  if (pp <= 0.001) return <AbsoluteFill style={{ overflow: "hidden", backgroundColor: C.cream }}>{frame}</AbsoluteFill>;
  const face = pipE ? FACEON(pipE) : true;
  // picture-in-picture: blurred backdrop + the face in a ring (no ring where the take is stitched)
  const k = 0.62;
  const R = interpolate(pp, [0, 1], [1300, PIPC.r]);
  const cx = interpolate(pp, [0, 1], [F.x, PIPC.x]), cy = interpolate(pp, [0, 1], [F.y, PIPC.y]);
  const s = interpolate(pp, [0, 1], [1, k]);
  return (
    <AbsoluteFill style={{ overflow: "hidden", backgroundColor: C.navy }}>
      {/* her voice keeps going under the window: every picture layer below is muted */}
      <Audio src={src} trimBefore={trim} volume={vol} />
      <AbsoluteFill style={{ filter: `blur(${34 * pp}px) brightness(${1 - 0.35 * pp}) saturate(0.9)`, transform: `scale(${1 + 0.08 * pp})` }}>
        <OffthreadVideo src={src} trimBefore={trim} muted style={{ width: 1920, height: 1080 }} />
      </AbsoluteFill>
      <AbsoluteFill style={{ background: `radial-gradient(90% 80% at 40% 45%, rgba(47,95,208,${0.22 * pp}), rgba(29,42,85,${0.62 * pp}))` }} />
      {face || pp < 0.99 ? <div style={{ position: "absolute", left: cx - R, top: cy - R, width: 2 * R, height: 2 * R, borderRadius: "50%", overflow: "hidden", opacity: face ? 1 : 1 - pp,
        boxShadow: pp > 0.5 ? `0 0 0 5px ${C.cream}, 0 0 0 8px ${C.blue}, 0 0 40px rgba(111,155,255,0.75), 0 18px 40px rgba(0,0,0,0.45)` : undefined }}>
        <div style={{ position: "absolute", left: R - F.x * s * z, top: R - F.y * s * z, width: 1920 * s * z, height: 1080 * s * z }}>
          <OffthreadVideo src={src} trimBefore={trim} muted style={{ width: "100%", height: "100%" }} />
        </div>
      </div> : null}
    </AbsoluteFill>
  );
};

let ctx: CanvasRenderingContext2D | null = null;
const measure = (text: string, px: number) => {
  ctx = ctx ?? document.createElement("canvas").getContext("2d");
  ctx!.font = `italic 600 ${px}px "${ELEGANT}"`;
  return ctx!.measureText(text).width;
};

/** words behind the author: white Playfair italic with a soft shadow */
const DepthText: React.FC<{ e: Ev; t: number }> = ({ e, t }) => {
  const pIn = ease(t, e.a, 0.55), pOut = fade(t, e.b, 0.5);
  const text = e.word as string;
  // measured width: the phrase spans ~1680 px of the 1920 frame
  const size = Math.min(300, (1680 / measure(text, 100)) * 100);
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: 250 - size * 0.62, textAlign: "center", fontFamily: ELEGANT, fontStyle: "italic", fontWeight: 600, fontSize: size,
      lineHeight: 1, color: "#fff", opacity: pIn * pOut, transform: `translateY(${(1 - pIn) * 24}px)`, whiteSpace: "nowrap",
      textShadow: "0 3px 6px rgba(20,25,45,0.35), 0 10px 40px rgba(20,25,45,0.35)" }}>{text}</div>
  );
};
/** her cut-out over the phrase (same zoom as the footage) */
const DepthCut: React.FC<{ e: Ev; srcT: number }> = ({ e, srcT }) => {
  const k = Math.max(0, Math.min(FG_FRAMES[e.name as string] - 1, Math.round((srcT - (e.src_a as number)) * FPS)));
  return <Img src={staticFile(`fg/${e.name}/${String(k).padStart(4, "0")}.webp`)} style={{ position: "absolute", left: 0, top: 0, width: 1920, height: 1080 }} />;
};

/** a number is not readable when the author covers it: it stands on the free wall in front of the footage */
const WallNumber: React.FC<{ t: number; e: Ev }> = ({ t, e }) => {
  const p = ease(t, e.a, 0.45, EASE.spring) * fade(t, e.b, 0.45);
  const [small, ...big] = (e.word as string).split("|");
  return (
    <div style={{ position: "absolute", left: 60, top: 110, opacity: p, transform: `translateX(${(1 - p) * -60}px)`, ...glass(), padding: "22px 40px 30px",
      fontFamily: ROUND, fontWeight: 800, color: "#161616", lineHeight: 0.95 }}>
      <div style={{ fontSize: 56, marginBottom: 6 }}>{small}</div>
      {big.map((l, i) => <div key={i} style={{ fontSize: 118, letterSpacing: 1, whiteSpace: "nowrap" }}>{l}</div>)}
    </div>
  );
};

/* ---------- windows: screencasts and pieces of the finished ad ---------- */
const BOX = { x: 110, y: 90, w: 1340, h: 840 };      // next to the face circle
const BOXC = { x: 150, y: 70, w: 1620, h: 860 };     // centred, no face
const fit = (w: number, h: number, centred = false) => {
  const B = centred ? BOXC : BOX;
  const k = Math.min(B.w / w, B.h / h);
  return { w: w * k, h: h * k, x: B.x + (B.w - w * k) / 2, y: B.y + (B.h - h * k) / 2 };
};
const glow = (p: number) => `0 0 0 2px rgba(150,180,255,${0.95 * p}), 0 0 26px 6px rgba(47,95,208,${0.85 * p}), 0 0 80px 18px rgba(111,155,255,${0.42 * p}), 0 30px 70px rgba(0,0,0,0.45)`;

const Screen: React.FC<{ e: Ev }> = ({ e }) => {
  const f = useCurrentFrame();
  const t = e.a + f / FPS;
  const n = (e.b - e.a) * FPS;
  const [cx, cy, cw, ch] = e.crop as number[];
  const zoom = e.zoom as [number, number[]] | undefined;
  // crop rectangle animates to the zoom rectangle (on the important line) from fraction zoom[0] of the piece
  const zp = zoom ? interpolate(f / n, [zoom[0], zoom[0] + 0.12], [0, 1], { ...clamp, easing: EASE.inOut }) : 0;
  const r = zoom ? [cx + (zoom[1][0] - cx) * zp, cy + (zoom[1][1] - cy) * zp, cw + (zoom[1][2] - cw) * zp, ch + (zoom[1][3] - ch) * zp] : [cx, cy, cw, ch];
  const box = fit(cw, ch, !FACEON(e));
  const k = Math.max(box.w / r[2], box.h / r[3]);
  const p = ease(t, e.a, 0.4) * fade(t, e.b, 0.3);
  const speed = (e.speed as number) ?? 1;
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", left: box.x, top: box.y, width: box.w, height: box.h, borderRadius: 28, overflow: "hidden", background: "#fff",
        opacity: p, transform: `scale(${0.95 + 0.05 * p})`, boxShadow: glow(p) }}>
        {/* with a playback rate Remotion reads trimBefore in sped-up time: scale it so the piece starts at `at` seconds of the source */}
        <OffthreadVideo src={staticFile(e.file as string)} trimBefore={Math.round((e.at as number) * speed * FPS)} playbackRate={speed} muted
          style={{ position: "absolute", left: -r[0] * k + (box.w - r[2] * k) / 2, top: -r[1] * k + (box.h - r[3] * k) / 2, width: 1920 * k, height: 1080 * k, maxWidth: "none" }} />
        {speed >= 1.5 ? (
          <div style={{ position: "absolute", right: 18, top: 16, ...glass(true), borderRadius: 16, padding: "6px 16px", fontFamily: UI, fontWeight: 700, fontSize: 30, color: "#fff" }}>×{speed.toFixed(1).replace(".0", "").replace(".", ",")}</div>
        ) : null}
      </div>
      <WindowLabel text={e.label as string} logo={e.logo as string} x={box.x + 24} y={box.y + box.h + 22} p={p} />
    </AbsoluteFill>
  );
};

const ClipWin: React.FC<{ e: Ev }> = ({ e }) => {
  const f = useCurrentFrame();
  const t = e.a + f / FPS;
  const p = ease(t, e.a, 0.4) * fade(t, e.b, 0.3);
  const trim = Math.round((e.at as number) * FPS);
  if (e.mode === "full") {
    return (
      <AbsoluteFill style={{ opacity: Math.min(ease(t, e.a, 0.15), fade(t, e.b, 0.15)) }}>
        <OffthreadVideo src={staticFile(e.file as string)} trimBefore={trim} muted style={{ width: 1920, height: 1080 }} />
        <WindowLabel text={e.label as string} x={60} y={960} p={p} />
      </AbsoluteFill>
    );
  }
  const phone = (file: string, at: number, x: number, y: number, h: number) => (
    <div style={{ position: "absolute", left: x, top: y, width: (h * 9) / 16 + 28, height: h + 28, borderRadius: 48, background: "#0d0f14", padding: 14, boxSizing: "border-box",
      boxShadow: glow(p), opacity: p, transform: `translateY(${(1 - p) * 40}px)` }}>
      <div style={{ width: "100%", height: "100%", borderRadius: 36, overflow: "hidden" }}>
        <OffthreadVideo src={staticFile(file)} trimBefore={Math.round(at * FPS)} muted style={{ width: "100%", height: "100%" }} />
      </div>
    </div>
  );
  if (e.mode === "phone") return <AbsoluteFill>{phone(e.file as string, e.at as number, FACEON(e) ? 520 : 720, 70, 840)}<WindowLabel text={e.label as string} x={520} y={970} p={p} /></AbsoluteFill>;
  const pair = e.mode === "pair";
  const box = pair ? { x: 90, y: 220, w: 900, h: 506 } : fit(1920, 1080, !FACEON(e));
  const mark = e.mark as string | undefined;
  const mp = ease(t, e.a + 0.7, 0.5);
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", left: box.x, top: box.y, width: box.w, height: box.h, borderRadius: 26, overflow: "hidden", boxShadow: glow(p), opacity: p, transform: `scale(${0.95 + 0.05 * p})` }}>
        <OffthreadVideo src={staticFile(e.file as string)} trimBefore={trim} muted style={{ width: "100%", height: "100%" }} />
        {mark === "circle" ? (
          <svg style={{ position: "absolute", inset: 0 }} viewBox="0 0 1920 1080">
            <ellipse cx={1110} cy={505} rx={150} ry={130} fill="none" stroke={C.red} strokeWidth={14} strokeDasharray={1000} strokeDashoffset={1000 * (1 - mp)} strokeLinecap="round" />
          </svg>
        ) : null}
        {mark === "strike" ? (
          <svg style={{ position: "absolute", inset: 0 }} viewBox="0 0 1920 1080">
            <path d="M40 120 L 900 160" stroke={C.red} strokeWidth={16} strokeLinecap="round" strokeDasharray={900} strokeDashoffset={900 * (1 - mp)} />
          </svg>
        ) : null}
      </div>
      {pair ? phone(e.file2 as string, e.at2 as number, FACEON(e) ? 1030 : 1180, 110, 740) : null}
      <WindowLabel text={e.label as string} x={box.x + 24} y={box.y + box.h + 22} p={p} />
    </AbsoluteFill>
  );
};

/** the first version's end card: the private link is covered from the very first frame, then corrected */
const EndCard: React.FC<{ e: Ev }> = ({ e }) => {
  const f = useCurrentFrame();
  const t = e.a + f / FPS;
  const p = ease(t, e.a, 0.4) * fade(t, e.b, 0.3);
  const box = fit(1920, 1080, !FACEON(e));
  const k = box.w / 1920;
  const strike = ease(t, e.a + 1.4, 0.6);
  const fix = ease(t, e.a + 2.6, 0.45, EASE.spring);
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", left: box.x, top: box.y, width: box.w, height: box.h, borderRadius: 26, overflow: "hidden", boxShadow: glow(p), opacity: p }}>
        <OffthreadVideo src={staticFile("media/rh.mp4")} trimBefore={Math.round(92.2 * FPS)} muted style={{ width: "100%", height: "100%" }} />
        {/* paper over the name and personal link: never shown */}
        <div style={{ position: "absolute", left: 110 * k, top: 700 * k, width: 640 * k, height: 250 * k, transform: `rotate(-2deg) scale(${1 + 0.06 * (1 - ease(t, e.a, 0.25))})` }}>
          <Sheet w={640 * k} h={250 * k} color={C.cream} seed={21}>
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: SERIF, fontWeight: 700, fontSize: 70 * k, color: C.red, letterSpacing: 6 * k }}>СКРЫТО</div>
          </Sheet>
        </div>
        <svg style={{ position: "absolute", inset: 0 }} viewBox="0 0 1920 1080">
          <path d="M80 590 C 400 560, 700 600, 1030 570" stroke={C.red} strokeWidth={22} fill="none" strokeLinecap="round" strokeDasharray={1000} strokeDashoffset={1000 * (1 - strike)} />
        </svg>
        <div style={{ position: "absolute", left: 160 * k, top: 760 * k, opacity: fix, transform: `scale(${0.7 + 0.3 * fix}) rotate(-3deg)`, transformOrigin: "left center" }}>
          <Strip text="→ t.me/zapuskator_A" bg={C.yellow} size={74 * k} seed={33} rot={0} />
        </div>
      </div>
      <WindowLabel text="Ошибка 3: вела в личку → теперь на канал" x={box.x + 24} y={box.y + box.h + 22} p={p} />
    </AbsoluteFill>
  );
};

const Broll: React.FC<{ e: Ev }> = ({ e }) => {
  const f = useCurrentFrame();
  const n = (e.b - e.a) * FPS;
  const p = interpolate(f, [0, 6], [0, 1], clamp) * interpolate(f, [n - 6, n], [1, 0], clamp);
  return (
    <AbsoluteFill style={{ opacity: p, overflow: "hidden" }}>
      <OffthreadVideo src={staticFile(e.file as string)} trimBefore={Math.round((e.at as number) * FPS)} muted
        style={{ width: 1920, height: 1080, transform: `scale(${1.03 + 0.04 * (f / n)})` }} />
    </AbsoluteFill>
  );
};

/** chapter card: a torn sheet sweeps over the frame with a strip of paper carrying the title */
const Stinger: React.FC<{ e: Ev }> = ({ e }) => {
  const f = useCurrentFrame();
  const d = (e.b - e.a) * FPS;
  const inP = interpolate(f, [0, 9], [0, 1], { ...clamp, easing: EASE.out });
  const outP = interpolate(f, [d - 9, d], [0, 1], { ...clamp, easing: EASE.inOut });
  const x = (1 - inP) * 2100 - outP * 2300;
  const yellow = e.variant === "yellow";
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <div style={{ position: "absolute", left: x - 100, top: -80, width: 2200, height: 1240, transform: `rotate(-2.5deg) ${jitter(f, 5, 3, 0.3)}` }}>
        <Sheet w={2200} h={1240} color={yellow ? C.kraft : C.cream} seed={yellow ? 41 : 12} amp={1.2} />
        <div style={{ position: "absolute", left: 140, top: 160, width: 700, height: 420, background: C.blue, clipPath: torn(7, 2), opacity: 0.9 }} />
        <div style={{ position: "absolute", left: 1500, top: 720, width: 520, height: 300, background: C.yellow, clipPath: torn(8, 2), opacity: 0.9 }} />
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 440, display: "flex", justifyContent: "center", transform: `translateX(${x}px) ${jitter(f, 2)}` }}>
        <Strip text={e.title as string} bg={yellow ? C.yellow : C.navy} fg={yellow ? C.ink : C.cream} size={130} seed={yellow ? 44 : 17} rot={-2} />
      </div>
    </AbsoluteFill>
  );
};

/** glass board; items appear one by one and stay; screenshots of the orders on the right when given */
const Tier: React.FC<{ e: Ev }> = ({ e }) => {
  const f = useCurrentFrame();
  const t = e.a + f / FPS;
  const p = ease(t, e.a, 0.45) * fade(t, e.b, 0.4);
  const items = e.items as { text: string; at: number; icon?: string; shot?: number }[];
  const shots = e.shots as string | undefined;
  const cur = [...items].reverse().find((it) => t >= it.at);
  return (
    <AbsoluteFill style={{ opacity: p }}>
      <AbsoluteFill style={{ background: "radial-gradient(90% 80% at 40% 40%, rgba(47,95,208,0.55), rgba(29,42,85,0.92))" }} />
      <Grain opacity={0.18} seed={4} />
      <div style={{ position: "absolute", left: 110, top: 110, width: shots ? 980 : 1300, ...glass(true), padding: "44px 52px" }}>
        <div style={{ fontFamily: UI, fontWeight: 700, fontSize: 64, color: "#fff", marginBottom: 22 }}>{e.title as string}</div>
        {items.map((it, i) => {
          const q = ease(t, it.at, 0.45, EASE.spring);
          return (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 22, marginTop: 20, opacity: q, transform: `translateX(${(1 - q) * -40}px)`,
              ...glass(false), borderRadius: 22, padding: "18px 24px" }}>
              <div style={{ width: 60, height: 60, borderRadius: 16, background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}><Mark name={it.icon} size={40} /></div>
              <div style={{ fontFamily: UI, fontWeight: 700, fontSize: shots ? 38 : 44, color: C.navy, lineHeight: 1.2 }}>{it.text}</div>
            </div>
          );
        })}
      </div>
      {shots && cur ? (
        <div style={{ position: "absolute", left: 1150, top: 170, width: 680, height: 720, borderRadius: 26, overflow: "hidden", boxShadow: glow(ease(t, cur.at, 0.4)), background: "#fff" }}>
          {cur.shot ? (
            <OffthreadVideo key={cur.at} src={staticFile(shots)} trimBefore={Math.round(cur.shot * 0.25 * FPS)} muted playbackRate={0.25}
              style={{ position: "absolute", left: -330, top: -40, width: 1920 * 0.8, height: 1080 * 0.8, maxWidth: "none" }} />
          ) : (
            <OffthreadVideo key={cur.at} src={staticFile("sc/sc_flax_stats.mp4")} trimBefore={Math.round(30 * 0.25 * FPS)} muted playbackRate={0.25}
              style={{ position: "absolute", left: -260, top: -170, width: 1920 * 0.78, height: 1080 * 0.78, maxWidth: "none" }} />
          )}
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

const SFX: React.FC<{ at: number; kind: string; vol: number }> = ({ at, kind, vol }) => (
  <Sequence from={Math.max(0, Math.round(at * FPS))} durationInFrames={Math.round(1.5 * FPS)}>
    <Audio src={staticFile(`sfx/${kind}.wav`)} volume={vol} />
  </Sequence>
);

export const Main: React.FC = () => {
  const f = useCurrentFrame();
  const t = f / FPS;
  let k = 0;
  const seq = (e: Ev, i: number, node: React.ReactNode, pre = FPS) => (
    <Sequence key={`${e.kind}${i}`} from={Math.round(e.a * FPS)} durationInFrames={Math.max(1, Math.round((e.b - e.a) * FPS))} premountFor={pre}>{node}</Sequence>
  );
  // side captions: one per side at a time; second slot when the side is busy
  const sides = EV.filter((e) => e.kind === "side" && on(e, t, 0.4));
  const covered = EV.some((e) => (["broll", "insert", "tier", "listen", "stinger", "guide"].includes(e.kind) || PIP(e) || (e.kind === "clip" && e.mode === "full")) && on(e, t));
  return (
    <AbsoluteFill style={{ backgroundColor: C.cream }}>
      {CLIPS.map((c, i) => {
        const from = Math.round(c.out * FPS);
        const n = Math.round((c.out + c.dur) * FPS) - from;
        if (n <= 0) return null;
        if (c.src === "el") {
          return (
            <Sequence key={i} from={from} durationInFrames={n}>
              <Audio src={staticFile("media/el.wav")} trimBefore={Math.round(c.in * FPS)} volume={(fr) => Math.min(1, fr / 4, (n - fr) / 6) * 0.9} />
            </Sequence>
          );
        }
        const idx = c.src === "rh" ? k : k++;
        return (
          <Sequence key={i} from={from} durationInFrames={n} premountFor={FPS}>
            <MainClip c={c} idx={idx} n={n} />
          </Sequence>
        );
      })}
      {EV.map((e, i) => (e.kind === "broll" ? seq(e, i, <Broll e={e} />) : null))}
      {EV.map((e, i) => (e.kind === "screen" ? seq(e, i, <Screen e={e} />) : null))}
      {EV.map((e, i) => (e.kind === "clip" ? seq(e, i, <ClipWin e={e} />) : null))}
      {EV.map((e, i) => (e.kind === "endcard" ? seq(e, i, <EndCard e={e} />) : null))}
      {EV.map((e, i) => (e.kind === "insert" ? seq(e, i, <Insert e={e} />) : null))}
      {EV.map((e, i) => (e.kind === "tier" ? seq(e, i, <Tier e={e} />) : null))}
      {EV.map((e, i) => (e.kind === "listen" ? seq(e, i, <Listen e={e} />) : null))}
      {EV.map((e, i) => (e.kind === "guide" ? seq(e, i, <Guide e={e} />) : null))}
      {EV.filter((e) => e.kind === "wallnum" && on(e, t, 0.5)).map((e, i) => <WallNumber key={`w${i}`} t={t} e={e} />)}
      {!covered ? sides.map((e, i) => <SideCaption key={`c${i}`} t={t} a={e.a} b={e.b} text={e.text as string} side={e.side as string} slot={0} icon={e.icon as string} big={!!e.big} />) : null}
      {!covered ? EV.filter((e) => e.kind === "logo" && on(e, t, 0.4)).map((e, i) => <LogoPill key={`l${i}`} t={t} a={e.a} b={e.b} logo={e.logo as string} label={e.label as string} side={e.side as string} />) : null}
      {EV.filter((e) => e.kind === "plate" && on(e, t, 0.4)).map((e, i) => <Plate key={`p${i}`} t={t} e={e} />)}
      {EV.map((e, i) => (e.kind === "stinger" ? seq(e, i, <Stinger e={e} />, 10) : null))}
      {EV.map((e, i) => {
        const s = e.kind === "stinger" || e.kind === "insert" || e.kind === "guide" ? ["paper", 0.16] : e.kind === "side" || e.kind === "logo" || e.kind === "plate" ? ["puff", 0.08] : e.kind === "depth" || e.kind === "wallnum" ? ["swell", 0.07] : null;
        return s ? <SFX key={`x${i}`} at={e.a} kind={s[0] as string} vol={s[1] as number} /> : null;
      })}
    </AbsoluteFill>
  );
};
