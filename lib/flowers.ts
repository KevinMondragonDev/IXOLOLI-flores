import { range } from "./seed";

export type Flower = {
  id: number;
  x: number; // 0..1
  y: number; // 0..1 (0 = top, 1 = bottom)
  scale: number;
  rotation: number;
  hue: number; // 0..360
  species: "rose" | "daisy" | "tulip" | "poppy" | "lily" | "lavender" | "sunflower";
  z: number; // depth 0..1 (1 closer)
};

const SPECIES: Flower["species"][] = [
  "rose",
  "daisy",
  "tulip",
  "poppy",
  "lily",
  "lavender",
  "sunflower",
];

export function generateField(
  rng: () => number,
  count: number,
  paletteHues: number[]
): Flower[] {
  const flowers: Flower[] = [];
  for (let i = 0; i < count; i++) {
    const z = rng();
    flowers.push({
      id: i,
      x: rng(),
      y: 0.45 + rng() * 0.55, // mostly bottom half
      scale: 0.4 + z * 1.0,
      rotation: range(rng, -18, 18),
      hue: paletteHues[Math.floor(rng() * paletteHues.length)] + range(rng, -8, 8),
      species: SPECIES[Math.floor(rng() * SPECIES.length)],
      z,
    });
  }
  // sort so deeper flowers render first
  flowers.sort((a, b) => a.z - b.z);
  return flowers;
}
