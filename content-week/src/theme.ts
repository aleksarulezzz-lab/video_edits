import { loadFont } from "@remotion/fonts";
import { staticFile, Easing } from "remotion";

export const FONT = "Manrope";

const weights = ["500", "600", "700", "800"] as const;
export const fontsReady = Promise.all(
  weights.flatMap((w) =>
    ["cyrillic", "latin"].map((subset) =>
      loadFont({
        family: FONT,
        url: staticFile(`fonts/manrope-${subset}-${w}-normal.woff2`),
        weight: w,
      }),
    ),
  ),
);

export const C = {
  ink: "#0D0F12",
  panel: "#16191E",
  panel2: "#1E2228",
  line: "#2C3139",
  paper: "#F5F2EC",
  paperDim: "#E6E1D8",
  text: "#F5F2EC",
  textDark: "#14161A",
  muted: "#9AA0AA",
  mutedDark: "#5E636B",
  accent: "#FF5A36", // coral: emphasis, the author's point
  ai: "#8EA6FF", // periwinkle: anything the neural network does
};

export const EASE = {
  out: Easing.bezier(0.16, 1, 0.3, 1),
  inOut: Easing.bezier(0.45, 0, 0.55, 1),
  pop: Easing.bezier(0.34, 1.4, 0.64, 1),
  in: Easing.bezier(0.7, 0, 0.84, 0),
};

export const FPS = 25;
export const W = 1920;
export const H = 1080;
