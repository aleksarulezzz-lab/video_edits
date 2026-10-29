import React from "react";
import { Composition, continueRender, delayRender } from "remotion";
import { Main } from "./Main";
import { FPS, H, W, fontsReady } from "./theme";
import gfx from "./data/gfx.json";

const handle = delayRender("fonts");
fontsReady.then(() => continueRender(handle));

export const RemotionRoot: React.FC = () => (
  <Composition id="Main" component={Main} durationInFrames={Math.round(gfx.total * FPS)} fps={FPS} width={W} height={H} />
);
