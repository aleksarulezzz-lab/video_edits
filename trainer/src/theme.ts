import { loadFont } from "@remotion/fonts";
import { Easing, staticFile } from "remotion";

export const FONT = "Manrope";
const weights = ["500", "600", "700", "800"] as const;
export const fontsReady = Promise.all(
  weights.flatMap((w) =>
    ["cyrillic", "latin"].map((subset) =>
      loadFont({ family: FONT, url: staticFile(`fonts/manrope-${subset}-${w}-normal.woff2`), weight: w }),
    ),
  ),
);

// brand: lime accent, near-black, cream
export const C = { lime: "#C8FF00", ink: "#0E0E0E", cream: "#F2EFEA", amber: "#FFB020", red: "#FF5A4E", grey: "#8A8F98" };

export const EASE = {
  out: Easing.bezier(0.16, 1, 0.3, 1),
  inOut: Easing.bezier(0.45, 0, 0.55, 1),
  pop: Easing.bezier(0.34, 1.4, 0.64, 1),
};

export const FPS = 25;
export const W = 1920;
export const H = 1080;
