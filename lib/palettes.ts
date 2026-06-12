import type { StyleId } from "./styles";

// Hue collections per style. Used together with mulberry32 jitter.
export const PALETTES: Record<StyleId, number[]> = {
  watercolor: [340, 350, 10, 25, 300, 280, 200],
  pointillism: [10, 30, 50, 200, 220, 280, 340],
  cartoon: [340, 0, 30, 50, 90, 200, 280],
  realistic: [350, 10, 25, 40, 320, 280],
  impressionism: [200, 220, 250, 280, 320, 350, 40],
  artnouveau: [30, 45, 20, 350, 280, 200],
  lineart: [0], // mostly monochrome but kept for API parity
};
