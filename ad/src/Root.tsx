import React from "react";
import { Composition, continueRender, delayRender } from "remotion";
import { Main } from "./Main";
import { END, REELS, ReelAd } from "./reels/ReelAd";
import { FPS, H, W, fontsReady } from "./theme";
import gfx from "./data/gfx.json";

const handle = delayRender("fonts");
fontsReady.then(() => continueRender(handle));

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="Main" component={Main} durationInFrames={Math.round(gfx.total * FPS)} fps={FPS} width={W} height={H} />
    {REELS.map((d, i) => (
      <Composition key={i} id={`Reel${i + 1}`} component={ReelAd} defaultProps={{ n: i + 1 }} durationInFrames={Math.round((d.duration + END) * FPS)} fps={FPS} width={1080} height={1920} />
    ))}
  </>
);
