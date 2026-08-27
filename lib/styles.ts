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
  "lineart",      // Sunday
  "watercolor",   // Monday
  "pointillism",  // Tuesday
  "cartoon",      // Wednesday
  "realistic",    // Thursday
  "impressionism",// Friday
  "artnouveau",   // Saturday
];

export const STYLES: Record<StyleId, StyleMeta> = {
  watercolor: {
    id: "watercolor",
    nameEs: "Nebulosa de Pétalos",
    nameEn: "Petal Nebula",
    background:
      "radial-gradient(ellipse at 30% 20%, #1a0a2e 0%, #16213e 35%, #0f3460 65%, #533483 100%)",
    ink: "#f0e6ff",
    accent: "#c77dff",
  },
  pointillism: {
    id: "pointillism",
    nameEs: "Jardín Seurat",
    nameEn: "Seurat Garden",
    background:
      "radial-gradient(ellipse at 50% 0%, #ff6b35 0%, #f7931e 25%, #fcee21 55%, #39b54a 100%)",
    ink: "#1a0a00",
    accent: "#e63946",
  },
  cartoon: {
    id: "cartoon",
    nameEs: "Jardín Hello Kitty",
    nameEn: "Hello Kitty Garden",
    background:
      "linear-gradient(135deg, #ffe4e1 0%, #ffb6c1 40%, #ff69b4 80%, #ff1493 100%)",
    ink: "#8b005d",
    accent: "#ffffff",
  },
  realistic: {
    id: "realistic",
    nameEs: "Jardín de Linternas",
    nameEn: "Lantern Garden",
    background:
      "linear-gradient(180deg, #1a0505 0%, #3e0a0a 40%, #7a1111 75%, #b51a1a 100%)",
    ink: "#fdf6e3",
    accent: "#ffd700",
  },
  impressionism: {
    id: "impressionism",
    nameEs: "Noche Estrellada",
    nameEn: "Starry Night",
    background:
      "radial-gradient(ellipse at 50% 30%, #1a237e 0%, #0d47a1 30%, #1565c0 55%, #0a192f 100%)",
    ink: "#fffde7",
    accent: "#ffd54f",
  },
  artnouveau: {
    id: "artnouveau",
    nameEs: "Manuscrito Iluminado",
    nameEn: "Illuminated Manuscript",
    background:
      "radial-gradient(ellipse at 50% 0%, #fdf6e3 0%, #f5e6c8 40%, #e8d5a3 70%, #c8a96e 100%)",
    ink: "#2c1810",
    accent: "#b8860b",
  },
  lineart: {
    id: "lineart",
    nameEs: "Jardín de Tinta",
    nameEn: "Ink Garden",
    background: "linear-gradient(180deg, #faf8f2 0%, #f5f0e8 50%, #ece4d4 100%)",
    ink: "#1a1209",
    accent: "#4a3728",
  },
};

export function styleForDate(date = new Date()): StyleMeta {
  return STYLES[STYLE_BY_DAY[date.getDay()]];
}
