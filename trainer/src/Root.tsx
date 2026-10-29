import React from "react";
import { Composition, continueRender, delayRender } from "remotion";
import { Main } from "./Main";
import { FPS, H, W, fontsReady } from "./theme";
import gfx from "./data/gfx.json";
import { END_CARD, REELS, Reel } from "./reels/Reel";

const handle = delayRender("fonts");
fontsReady.then(() => continueRender(handle));

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="Main" component={Main} durationInFrames={Math.round(gfx.total * FPS)} fps={FPS} width={W} height={H} />
    {REELS.map((d) => (
      <Composition key={d.n} id={`Reel${d.n}`} component={Reel} defaultProps={{ n: d.n }} durationInFrames={Math.round((d.duration + END_CARD) * FPS)} fps={FPS} width={1080} height={1920} />
    ))}
  </>
);
