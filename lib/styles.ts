export type StyleId =
  | "watercolor"
  | "pointillism"
  | "cartoon"
  | "realistic"
  | "impressionism"
  | "artnouveau"
  | "lineart";

export type StyleMeta = {
  id: StyleId;
  nameEs: string;
  nameEn: string;
  background: string; // CSS color or gradient
  ink: string; // foreground text color
  accent: string;
};

// dayOfWeek (0 = Sunday) -> style
export const STYLE_BY_DAY: StyleId[] = [
  "lineart", // Sunday
  "watercolor", // Monday
  "pointillism", // Tuesday
  "cartoon", // Wednesday
  "realistic", // Thursday
  "impressionism", // Friday
  "artnouveau", // Saturday
];

export const STYLES: Record<StyleId, StyleMeta> = {
  watercolor: {
    id: "watercolor",
    nameEs: "Acuarela",
    nameEn: "Watercolor",
    background:
      "radial-gradient(ellipse at 50% 0%, #fef6f0 0%, #f7e6df 45%, #e9c9d4 100%)",
    ink: "#3a2a36",
    accent: "#c97a8a",
  },
  pointillism: {
    id: "pointillism",
    nameEs: "Puntillismo",
    nameEn: "Pointillism",
    background:
      "radial-gradient(ellipse at 50% 0%, #f3ecd8 0%, #e8d9b3 50%, #b8c8a6 100%)",
    ink: "#2c2a1e",
    accent: "#d97757",
  },
  cartoon: {
    id: "cartoon",
    nameEs: "Animación",
    nameEn: "Animation",
    background:
      "linear-gradient(180deg, #bde6ff 0%, #e5f7d0 60%, #b6e2a3 100%)",
    ink: "#1f2a3a",
    accent: "#ff6b9a",
  },
  realistic: {
    id: "realistic",
    nameEs: "Realista",
    nameEn: "Realistic",
    background:
      "linear-gradient(180deg, #f6d9b8 0%, #e7b894 35%, #6f5a3e 100%)",
    ink: "#1c140d",
    accent: "#b8553a",
  },
  impressionism: {
    id: "impressionism",
    nameEs: "Girasoles",
    nameEn: "Sunflowers",
    background:
      "linear-gradient(180deg, #f1d8a8 0%, #e6b97a 45%, #a8a368 75%, #5d6e3a 100%)",
    ink: "#2a1d0a",
    accent: "#d29a2a",
  },
  artnouveau: {
    id: "artnouveau",
    nameEs: "Art Nouveau",
    nameEn: "Art Nouveau",
    background:
      "radial-gradient(ellipse at 50% 30%, #f3e3bf 0%, #cfa867 60%, #6e4a26 100%)",
    ink: "#1c130a",
    accent: "#a37326",
  },
  lineart: {
    id: "lineart",
    nameEs: "Trazo",
    nameEn: "Line art",
    background: "linear-gradient(180deg, #fbf8f1 0%, #f3ece0 100%)",
    ink: "#1a1a1a",
    accent: "#1a1a1a",
  },
};

export function styleForDate(date = new Date()): StyleMeta {
  return STYLES[STYLE_BY_DAY[date.getDay()]];
}
