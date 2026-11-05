import { loadFont } from "@remotion/fonts";
import { Easing, staticFile } from "remotion";

export const FONT = "Manrope";
const weights = ["500", "600", "700", "800"] as const;
// rounded face for the words behind the author
export const ROUND = "Nunito";
export const fontsReady = Promise.all([
  ...weights.flatMap((w) =>
    ["cyrillic", "latin"].map((subset) =>
      loadFont({ family: FONT, url: staticFile(`fonts/manrope-${subset}-${w}-normal.woff2`), weight: w }),
    ),
  ),
  ...(["700", "800"] as const).flatMap((w) =>
    ["cyrillic", "latin"].map((subset) => loadFont({ family: ROUND, url: staticFile(`fonts/nunito-${subset}-${w}-normal.woff2`), weight: w })),
  ),
]);

// soft blue palette under the author's blue sweater and the white wall
export const C = { blue: "#9FD3F2", glass: "#DCEFFB", accent: "#3A8FD6", neon: "#5CC8FF", ink: "#1C2E44", white: "#FFFFFF" };

export const EASE = {
  out: Easing.bezier(0.16, 1, 0.3, 1),
  inOut: Easing.bezier(0.45, 0, 0.55, 1),
  pop: Easing.bezier(0.34, 1.4, 0.64, 1),
};

export const FPS = 30;
export const W = 1920;
export const H = 1080;
