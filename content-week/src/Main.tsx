import React from "react";
import { AbsoluteFill, Audio, Sequence, staticFile } from "remotion";
import { Footage } from "./components/Footage";
import * as G from "./components/graphics";
import * as Wall from "./components/wall";
import { Subtitles } from "./components/Subtitles";
import { extraSfx, overlays } from "./plan";
import { C, FPS } from "./theme";

// Wall versions override the panel/overlay versions of the same graphic.
const COMPONENTS: Record<string, React.FC<any>> = { ...(G as any), ...(Wall as any) };
const SFX_VOL: Record<string, number> = { whoosh: 0.32, pop: 0.28, click: 0.22, swell: 0.3 };

const Sfx: React.FC<{ t: number; kind: string }> = ({ t, kind }) => (
  <Sequence from={Math.round(t * FPS)} durationInFrames={Math.round(1.2 * FPS)}>
    <Audio src={staticFile(`sfx/${kind}.wav`)} volume={SFX_VOL[kind]} />
  </Sequence>
);

export const Main: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: C.ink }}>
    <Footage />
    {overlays.map((o, i) => {
      const Comp = COMPONENTS[o.kind];
      const from = Math.round(o.a * FPS);
      return (
        <Sequence key={i} from={from} durationInFrames={Math.round(o.b * FPS) - from} premountFor={FPS}>
          <Comp a={o.a} b={o.b} {...(o.props ?? {})} />
        </Sequence>
      );
    })}
    <Subtitles />
    {overlays
      .filter((o) => o.sfx && o.sfx !== "none")
      .map((o, i) => (
        <Sfx key={`s${i}`} t={o.sfx === "swell" ? o.a - 0.15 : o.a} kind={o.sfx as string} />
      ))}
    {extraSfx.map((s, i) => (
      <Sfx key={`x${i}`} t={s.t} kind={s.kind} />
    ))}
  </AbsoluteFill>
);
