import React from "react";
import { AbsoluteFill, OffthreadVideo, Sequence, interpolate, staticFile, useCurrentFrame } from "remotion";
import { C, EASE, FPS } from "../theme";
import { edl, sceneAt, headCam, screenCam, splitAt } from "../timeline";

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
        </div>
        {cam.dim > 0 ? <FocusDim t={t} zoom={zoom} x={x} y={y} k={k} /> : null}
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

// The video element itself; the clip's <Sequence> handles timing.
const OffthreadVideoLayer: React.FC<{ top: number; width: number; height: number }> = ({ top, width, height }) => (
  <ClipVideoContext.Consumer>
    {(clip) => (
      <OffthreadVideo
        src={SRC}
        trimBefore={clip.trim}
        volume={clip.volume}
        style={{ position: "absolute", left: 0, top, width, height }}
      />
    )}
  </ClipVideoContext.Consumer>
);

type ClipCtx = { trim: number; volume: (f: number) => number };
const ClipVideoContext = React.createContext<ClipCtx>({ trim: 0, volume: () => 1 });

const ClipView: React.FC<{ outStart: number; rawIn: number; dur: number }> = ({ outStart, rawIn, dur }) => {
  const frame = useCurrentFrame();
  const local = frame / FPS;
  const t = outStart + local;
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
        <ScreenView t={t} sceneStart={Math.max(outStart, outStart + (scene.start - rawIn))} />
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

