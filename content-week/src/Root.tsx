import React from "react";
import { Composition, continueRender, delayRender } from "remotion";
import { Main } from "./Main";
import { StepCardPreview } from "./components/cards";
import { FPS, H, W, fontsReady } from "./theme";
import { TOTAL } from "./timeline";
import { END_CARD, SHORTS, Short } from "./shorts/Short";

const handle = delayRender("fonts");
fontsReady.then(() => continueRender(handle));

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="Main" component={Main} durationInFrames={Math.round(TOTAL * FPS)} fps={FPS} width={W} height={H} />
    {Object.values(SHORTS).map((d) => (
      <Composition key={d.id} id={`Short${d.id}`} component={Short} defaultProps={{ id: d.id }} durationInFrames={Math.round((d.duration + END_CARD) * FPS)} fps={FPS} width={1080} height={1920} />
    ))}
    <Composition id="StepCardPreview" component={StepCardPreview} durationInFrames={135} fps={FPS} width={W} height={H} />
  </>
);
