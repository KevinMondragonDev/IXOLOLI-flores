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
  // Keep flowers out of UI hotspots. The poem card is centered with max-w-2xl
  // (~672px), so only the central column needs an exclusion. Flowers can
  // happily occupy the bottom on the left/right sides for a richer composition.
  for (const f of flowers) {
    // Card column: x in [0.22, 0.78], y in [0.66, 1.00]
    if (f.x > 0.22 && f.x < 0.78 && f.y > 0.66) {
      // push up but keep within a wide band so the field is well distributed
      f.y = 0.15 + rng() * 0.45;
    }
    // Dev button bottom-right safe zone (~80px wide)
    if (f.x > 0.9 && f.y > 0.88) {
      f.x = 0.05 + rng() * 0.8;
    }
  }
  // sort so deeper flowers render first
  flowers.sort((a, b) => a.z - b.z);
  return flowers;
}
