import { loadFont } from "@remotion/fonts";
import { Easing, staticFile } from "remotion";

// interface (Liquid Glass): Inter; paper collage: Lora
export const UI = "Inter";
export const SERIF = "Lora";
// words behind the author: black rounded type
export const ROUND = "Nunito";
// words behind the author: white elegant italic
export const ELEGANT = "Playfair Display";
export const fontsReady = Promise.all([
  ...(["600", "700"] as const).flatMap((w) =>
    ["cyrillic", "latin"].map((s) => loadFont({ family: UI, url: staticFile(`fonts/inter-${s}-${w}-normal.woff2`), weight: w })),
  ),
  ...["cyrillic", "latin"].map((s) => loadFont({ family: SERIF, url: staticFile(`fonts/lora-${s}-700-normal.woff2`), weight: "700" })),
  ...["cyrillic", "latin"].map((s) => loadFont({ family: ROUND, url: staticFile(`fonts/nunito-${s}-800-normal.woff2`), weight: "800" })),
  ...["cyrillic", "latin"].map((s) => loadFont({ family: ELEGANT, url: staticFile(`fonts/playfair-display-${s}-600-italic.woff2`), weight: "600", style: "italic" })),
  ...["cyrillic", "latin"].map((s) => loadFont({ family: SERIF, url: staticFile(`fonts/lora-${s}-700-italic.woff2`), weight: "700", style: "italic" })),
]);

// palette of the finished ad; blue is the accent (glow, highlights), red marks mistakes
export const C = { blue: "#2f5fd0", navy: "#1d2a55", cream: "#f4eee2", kraft: "#c9a477", red: "#d9452f", yellow: "#f3c335", white: "#ffffff", ink: "#1b1b1b" };
export const GLOW = "#6f9bff";

export const EASE = {
  out: Easing.bezier(0.16, 1, 0.3, 1),
  inOut: Easing.bezier(0.45, 0, 0.55, 1),
  spring: Easing.bezier(0.34, 1.5, 0.64, 1),
};
export const FPS = 30;
export const W = 1920;
export const H = 1080;
