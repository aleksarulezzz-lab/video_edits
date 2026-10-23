import React from "react";
import { Composition, continueRender, delayRender } from "remotion";
import { Main } from "./Main";
import { StepCardPreview } from "./components/cards";
import { FPS, H, W, fontsReady } from "./theme";
import { TOTAL } from "./timeline";

const handle = delayRender("fonts");
fontsReady.then(() => continueRender(handle));

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="Main" component={Main} durationInFrames={Math.round(TOTAL * FPS)} fps={FPS} width={W} height={H} />
    <Composition id="StepCardPreview" component={StepCardPreview} durationInFrames={135} fps={FPS} width={W} height={H} />
  </>
);
