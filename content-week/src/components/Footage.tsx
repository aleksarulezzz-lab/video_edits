import React from "react";
import { AbsoluteFill, OffthreadVideo, Sequence, interpolate, staticFile, useCurrentFrame } from "remotion";
import { C, EASE, FPS } from "../theme";
import { edl, sceneAt, headCam, screenCam, splitAt, invT, screenRunStart } from "../timeline";
import { screenMarks } from "../plan";

const SRC = staticFile("media/raw_sanitized.mp4");
const RAW_W = 1440;
const RAW_H = 900;
const S0 = 1920 / RAW_W; // raw → output scale for the full-bleed head shot
const BAND_TOP = 45; // letterbox bar height in the raw talking-head recording

// Screen recordings sit in a window that leaves a band at the bottom for subtitles.
export const SCREEN_WIN = { x: 192, y: 24, w: 1536, h: 960 };

const clampOpts = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

const HeadView: React.FC<{ t: number }> = ({ t }) => {
  const cam = headCam(t);
  const split = splitAt(t); // 0 = full bleed, 1 = framed on the left for side panels
  const win = {
    x: interpolate(split, [0, 1], [0, 64]),
    y: interpolate(split, [0, 1], [0, 64]),
    w: interpolate(split, [0, 1], [1920, 940]),
    h: interpolate(split, [0, 1], [1080, 952]),
  };
  // Keep the face centred in whatever window is visible.
  const faceX = 1000;
  const shiftX = interpolate(split, [0, 1], [0, win.x + win.w / 2 - faceX]);
  return (
    <AbsoluteFill style={{ backgroundColor: C.ink }}>
      <div
        style={{
          position: "absolute",
          left: win.x,
          top: win.y,
          width: win.w,
          height: win.h,
          overflow: "hidden",
          borderRadius: interpolate(split, [0, 1], [0, 36]),
        }}
      >
        <div
          style={{
            position: "absolute",
            left: -win.x + shiftX,
            top: -win.y,
            width: 1920,
            height: 1080,
            transformOrigin: `${cam.ox}px ${cam.oy}px`,
            transform: `scale(${cam.zoom})`,
          }}
        >
          <OffthreadVideoLayer top={-BAND_TOP * S0} width={1920} height={RAW_H * S0} />
        </div>
      </div>
    </AbsoluteFill>
  );
};

const ScreenView: React.FC<{ t: number; sceneStart: number }> = ({ t, sceneStart }) => {
  const cam = screenCam(t);
  const settle = interpolate(t - sceneStart, [0, 0.45], [1.035, 1], { ...clampOpts, easing: EASE.out });
  const k = SCREEN_WIN.w / RAW_W;
  // Zoom so the focus rect fills the window, centred on it.
  const zoom = Math.min(RAW_W / cam.w, RAW_H / cam.h, 2.2);
  const cx = (cam.x + cam.w / 2) * k;
  const cy = (cam.y + cam.h / 2) * k;
  const tx = SCREEN_WIN.w / 2 - cx * zoom;
  const ty = SCREEN_WIN.h / 2 - cy * zoom;
  // Never pan past the recording's edges.
  const minX = SCREEN_WIN.w - SCREEN_WIN.w * zoom;
  const minY = SCREEN_WIN.h - SCREEN_WIN.h * zoom;
  const x = Math.min(0, Math.max(minX, tx));
  const y = Math.min(0, Math.max(minY, ty));
  return (
    <AbsoluteFill style={{ backgroundColor: C.ink }}>
      <div
        style={{
          position: "absolute",
          left: SCREEN_WIN.x,
          top: SCREEN_WIN.y,
          width: SCREEN_WIN.w,
          height: SCREEN_WIN.h,
          overflow: "hidden",
          borderRadius: 20,
          transform: `scale(${settle})`,
          boxShadow: "0 30px 80px rgba(0,0,0,0.55)",
          outline: `1px solid ${C.line}`,
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: SCREEN_WIN.w,
            height: SCREEN_WIN.h,
            transformOrigin: "0 0",
            transform: `translate(${x}px, ${y}px) scale(${zoom})`,
          }}
        >
          <OffthreadVideoLayer top={0} width={SCREEN_WIN.w} height={SCREEN_WIN.h} />
          <ScreenMarks t={t} k={k} zoom={zoom} />
        </div>
        {cam.dim > 0 ? <FocusDim t={t} zoom={zoom} x={x} y={y} k={k} /> : null}
        <PipBubble appear={interpolate(t - sceneStart, [0.1, 0.5], [0, 1], { ...clampOpts, easing: EASE.out })} />
      </div>
    </AbsoluteFill>
  );
};

/** Darkens everything outside the highlight rect of the current screen camera key. */
const FocusDim: React.FC<{ t: number; zoom: number; x: number; y: number; k: number }> = ({ t, zoom, x, y, k }) => {
  const cam = screenCam(t);
  if (!cam.hl) return null;
  const [hx, hy, hw, hh] = cam.hl;
  const L = x + hx * k * zoom;
  const T = y + hy * k * zoom;
  const Wd = hw * k * zoom;
  const Ht = hh * k * zoom;
  return (
    <svg width={SCREEN_WIN.w} height={SCREEN_WIN.h} style={{ position: "absolute", left: 0, top: 0 }}>
      <defs>
        <mask id="hole">
          <rect width="100%" height="100%" fill="white" />
          <rect x={L} y={T} width={Wd} height={Ht} rx={12} fill="black" />
        </mask>
      </defs>
      <rect width="100%" height="100%" fill={`rgba(13,15,18,${0.55 * cam.dim})`} mask="url(#hole)" />
      <rect x={L} y={T} width={Wd} height={Ht} rx={12} fill="none" stroke={C.accent} strokeOpacity={cam.dim} strokeWidth={4} />
    </svg>
  );
};

/** Red ovals that draw themselves around numbers on screen; lives in raw-pixel space so it follows zooms. */
const ScreenMarks: React.FC<{ t: number; k: number; zoom: number }> = ({ t, k, zoom }) => {
  const live = screenMarks.filter((m) => t >= m.a - 0.1 && t < m.b + 0.25);
  if (!live.length) return null;
  return (
    <svg width={SCREEN_WIN.w} height={SCREEN_WIN.h} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
      {live.map((m, i) => {
        const [rx0, ry0, rw, rh] = m.rect;
        const cx = (rx0 + rw / 2) * k;
        const cy = (ry0 + rh / 2) * k;
        const ax = (rw / 2 + 16) * k;
        const ay = (rh / 2 + 12) * k;
        // slightly irregular loop that overshoots its start, like a marker stroke
        const pts: string[] = [];
        const N = 64;
        for (let j = 0; j <= N; j++) {
          const th = -2.3 + (j / N) * (Math.PI * 2 + 0.55);
          const wob = 1 + 0.05 * Math.sin(th * 3 + i) + 0.03 * Math.cos(th * 5);
          const grow = 1 + 0.06 * (j / N);
          pts.push(`${(cx + Math.cos(th) * ax * wob * grow).toFixed(1)},${(cy + Math.sin(th) * ay * wob * grow).toFixed(1)}`);
        }
        const draw = interpolate(t - m.a, [0, 0.55], [0, 1], { ...clampOpts, easing: EASE.inOut });
        const fade = interpolate(t, [m.b, m.b + 0.2], [1, 0], clampOpts);
        const len = 2 * Math.PI * Math.max(ax, ay) * 1.25;
        return (
          <polyline
            key={i}
            points={pts.join(" ")}
            fill="none"
            stroke="#FF2D1F"
            strokeWidth={4.2 / Math.sqrt(zoom)}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray={len}
            strokeDashoffset={len * (1 - draw)}
            opacity={fade}
          />
        );
      })}
    </svg>
  );
};

// The author's camera window, burned into the top-right of every screen recording.
const PIP = { x: 1200, y: 0, w: 240, h: 118 }; // raw px, above the name label
const PIP_W = 344;
const PIP_S = PIP_W / PIP.w;

/**
 * A clean copy of that camera window, docked to the window corner at a fixed size. It covers
 * the burned-in original, so zooming into the screen never shows a cropped face.
 */
const PipBubble: React.FC<{ appear: number }> = ({ appear }) => (
  <div
    style={{
      position: "absolute",
      right: 0,
      top: 0,
      width: PIP_W,
      height: PIP.h * PIP_S,
      overflow: "hidden",
      borderBottomLeftRadius: 22,
      boxShadow: "-8px 10px 30px rgba(0,0,0,0.35)",
      background: C.ink,
    }}
  >
    <div style={{ position: "absolute", inset: 0, opacity: appear, transform: `scale(${0.92 + 0.08 * appear})`, transformOrigin: "100% 0" }}>
      <OffthreadVideoLayer
        muted
        top={-PIP.y * PIP_S}
        left={-PIP.x * PIP_S}
        width={1440 * PIP_S}
        height={900 * PIP_S}
      />
    </div>
  </div>
);

// The video element itself; the clip's <Sequence> handles timing.
const OffthreadVideoLayer: React.FC<{ top: number; left?: number; width: number; height: number; muted?: boolean }> = ({
  top,
  left = 0,
  width,
  height,
  muted,
}) => (
  <ClipVideoContext.Consumer>
    {(clip) => (
      <OffthreadVideo
        src={SRC}
        trimBefore={clip.trim}
        volume={muted ? 0 : clip.volume}
        muted={muted}
        style={{ position: "absolute", left, top, width, height, maxWidth: "none" }}
      />
    )}
  </ClipVideoContext.Consumer>
);

type ClipCtx = { trim: number; volume: (f: number) => number };
const ClipVideoContext = React.createContext<ClipCtx>({ trim: 0, volume: () => 1 });

const ClipView: React.FC<{ outStart: number; rawIn: number; dur: number }> = ({ outStart, rawIn, dur }) => {
  const frame = useCurrentFrame();
  const local = frame / FPS;
  const t = invT(outStart + local); // plan (author's-cut) time
  const rawT = rawIn + local;
  const scene = sceneAt(rawT);
  const total = Math.round(dur * FPS);
  // 1-frame audio ramps at both ends of every clip avoid clicks at the cuts.
  const volume = (f: number) => Math.min(1, (f + 1) / 2, (total - f) / 2);
  return (
    <ClipVideoContext.Provider value={{ trim: Math.round(rawIn * FPS), volume }}>
      {scene.kind === "head" ? (
        <HeadView t={t} />
      ) : (
        // entrance animation only where the screen stretch really starts, not at every cut inside it
        <ScreenView t={t} sceneStart={invT(screenRunStart(outStart + local))} />
      )}
    </ClipVideoContext.Provider>
  );
};

export const Footage: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: C.ink }}>
    {edl.map((c, i) => (
      <Sequence
        key={i}
        from={Math.round(c.out * FPS)}
        durationInFrames={Math.round((c.out + c.dur) * FPS) - Math.round(c.out * FPS)}
        premountFor={FPS}
      >
        <ClipView outStart={c.out} rawIn={c.in} dur={c.dur} />
      </Sequence>
    ))}
  </AbsoluteFill>
);

