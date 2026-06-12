"use client";

import type { Flower } from "@/lib/flowers";

// All glyphs are drawn in a 100x140 viewBox, stem at bottom-center.
// `style` lets each artistic style customise colors/strokes via a render mode.

export type GlyphMode =
  | "fill" // solid colored fill
  | "outlined" // bold stroke + fill (cartoon)
  | "stroke" // stroke only (lineart)
  | "soft" // low-opacity layered fill (watercolor / impressionism)
  | "gradient" // gradient fills (realistic)
  | "ornate"; // gold strokes + decorative (art nouveau)

type Props = {
  flower: Flower;
  mode: GlyphMode;
  baseHue?: number;
  ink?: string;
};

function hsl(h: number, s: number, l: number, a = 1) {
  return `hsla(${h}, ${s}%, ${l}%, ${a})`;
}

export function FlowerGlyph({ flower, mode, ink = "#222" }: Props) {
  const h = flower.hue;
  const stemColor =
    mode === "stroke" ? ink : mode === "ornate" ? "#7a5a1f" : `hsl(${(h + 90) % 360}, 35%, 32%)`;
  const stem = (
    <g>
      <path
        d="M50 140 C 48 110, 52 95, 50 70"
        stroke={stemColor}
        strokeWidth={mode === "stroke" ? 1.6 : mode === "outlined" ? 4 : 3}
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M50 110 C 60 100, 70 102, 74 92"
        stroke={stemColor}
        strokeWidth={mode === "stroke" ? 1.4 : 2.5}
        fill={mode === "stroke" ? "none" : `hsl(${(h + 90) % 360}, 40%, 38%)`}
        opacity={mode === "stroke" ? 1 : 0.85}
      />
    </g>
  );

  const head = renderHead(flower.species, h, mode, ink);

  return (
    <svg
      viewBox="0 0 100 140"
      width="100"
      height="140"
      style={{ overflow: "visible" }}
    >
      {stem}
      <g transform="translate(50 55)">{head}</g>
    </svg>
  );
}

function petal(
  i: number,
  count: number,
  radius: number,
  width: number,
  height: number,
  fill: string,
  stroke: string | undefined,
  strokeWidth: number,
  opacity = 1
) {
  const angle = (i / count) * 360;
  return (
    <g key={i} transform={`rotate(${angle})`}>
      <ellipse
        cx={0}
        cy={-radius}
        rx={width}
        ry={height}
        fill={fill}
        stroke={stroke}
        strokeWidth={strokeWidth}
        opacity={opacity}
      />
    </g>
  );
}

function renderHead(
  species: Flower["species"],
  h: number,
  mode: GlyphMode,
  ink: string
) {
  const main = colorFor(h, mode, "main");
  const dark = colorFor(h, mode, "dark");
  const center = colorFor(h, mode, "center");
  const stroke = mode === "outlined" ? ink : mode === "ornate" ? "#7a5a1f" : undefined;
  const strokeW = mode === "outlined" ? 2.5 : mode === "ornate" ? 1.2 : 0;
  const layered = mode === "soft";

  switch (species) {
    case "daisy": {
      const petals = 10;
      return (
        <g>
          {Array.from({ length: petals }).map((_, i) =>
            petal(i, petals, 18, 6, 16, main, mode === "stroke" ? ink : stroke, mode === "stroke" ? 1.4 : strokeW)
          )}
          {layered &&
            Array.from({ length: petals }).map((_, i) =>
              petal(i + 0.5, petals, 18, 5, 14, dark, undefined, 0, 0.4)
            )}
          <circle r={6.5} fill={mode === "stroke" ? "none" : center} stroke={mode === "stroke" ? ink : undefined} strokeWidth={mode === "stroke" ? 1.4 : 0} />
        </g>
      );
    }
    case "rose": {
      return (
        <g>
          {[22, 17, 12, 8].map((r, i) => (
            <circle
              key={i}
              r={r}
              fill={mode === "stroke" ? "none" : i % 2 ? dark : main}
              stroke={mode === "stroke" ? ink : stroke}
              strokeWidth={mode === "stroke" ? 1.4 : strokeW}
              opacity={layered ? 0.7 : 1}
            />
          ))}
          <circle r={3.5} fill={mode === "stroke" ? "none" : center} stroke={mode === "stroke" ? ink : undefined} strokeWidth={mode === "stroke" ? 1.2 : 0} />
        </g>
      );
    }
    case "tulip": {
      return (
        <g>
          <path
            d="M-14 6 C -16 -14, -6 -22, 0 -22 C 6 -22, 16 -14, 14 6 C 6 12, -6 12, -14 6 Z"
            fill={mode === "stroke" ? "none" : main}
            stroke={mode === "stroke" ? ink : stroke}
            strokeWidth={mode === "stroke" ? 1.4 : strokeW}
          />
          <path
            d="M-7 4 C -9 -16, 0 -22, 0 -22 C 0 -22, 9 -16, 7 4 C 4 8, -4 8, -7 4 Z"
            fill={mode === "stroke" ? "none" : dark}
            opacity={layered ? 0.55 : 1}
          />
        </g>
      );
    }
    case "poppy": {
      const petals = 5;
      return (
        <g>
          {Array.from({ length: petals }).map((_, i) =>
            petal(i, petals, 8, 14, 18, main, mode === "stroke" ? ink : stroke, mode === "stroke" ? 1.4 : strokeW, layered ? 0.85 : 1)
          )}
          <circle r={5} fill={mode === "stroke" ? "none" : "#1a1a1a"} stroke={mode === "stroke" ? ink : undefined} strokeWidth={mode === "stroke" ? 1.2 : 0} />
        </g>
      );
    }
    case "lily": {
      const petals = 6;
      return (
        <g>
          {Array.from({ length: petals }).map((_, i) =>
            petal(i, petals, 14, 5, 18, main, mode === "stroke" ? ink : stroke, mode === "stroke" ? 1.4 : strokeW)
          )}
          <circle r={3} fill={mode === "stroke" ? "none" : center} />
          {/* stamens */}
          {!["stroke"].includes(mode) &&
            Array.from({ length: 5 }).map((_, i) => {
              const a = (i / 5) * Math.PI * 2;
              return (
                <line
                  key={i}
                  x1={0}
                  y1={0}
                  x2={Math.cos(a) * 7}
                  y2={Math.sin(a) * 7}
                  stroke={dark}
                  strokeWidth={1}
                />
              );
            })}
        </g>
      );
    }
    case "lavender": {
      // a vertical spike with little buds
      return (
        <g transform="translate(0 -10)">
          {Array.from({ length: 9 }).map((_, i) => (
            <circle
              key={i}
              cx={i % 2 === 0 ? -3 : 3}
              cy={-i * 4}
              r={3}
              fill={mode === "stroke" ? "none" : i % 2 === 0 ? main : dark}
              stroke={mode === "stroke" ? ink : stroke}
              strokeWidth={mode === "stroke" ? 1.2 : strokeW * 0.6}
              opacity={layered ? 0.8 : 1}
            />
          ))}
        </g>
      );
    }
    case "sunflower": {
      const petals = 14;
      return (
        <g>
          {Array.from({ length: petals }).map((_, i) =>
            petal(i, petals, 14, 4, 14, main, mode === "stroke" ? ink : stroke, mode === "stroke" ? 1.2 : strokeW)
          )}
          <circle r={9} fill={mode === "stroke" ? "none" : "#5b3a1a"} stroke={mode === "stroke" ? ink : undefined} strokeWidth={mode === "stroke" ? 1.4 : 0} />
        </g>
      );
    }
  }
}

function colorFor(h: number, mode: GlyphMode, role: "main" | "dark" | "center") {
  switch (mode) {
    case "soft":
      if (role === "main") return hsl(h, 65, 70, 0.75);
      if (role === "dark") return hsl(h, 65, 55, 0.55);
      return hsl((h + 40) % 360, 75, 55, 0.9);
    case "outlined":
      if (role === "main") return hsl(h, 80, 65);
      if (role === "dark") return hsl(h, 80, 50);
      return hsl((h + 35) % 360, 90, 55);
    case "gradient":
      // gradient handled via fills referencing a defs id; fall back to flat
      if (role === "main") return hsl(h, 70, 60);
      if (role === "dark") return hsl(h, 70, 42);
      return hsl((h + 35) % 360, 85, 55);
    case "ornate":
      if (role === "main") return hsl(h, 55, 60);
      if (role === "dark") return hsl(h, 55, 45);
      return "#d4a942";
    case "stroke":
      return "transparent";
    default: // fill
      if (role === "main") return hsl(h, 70, 60);
      if (role === "dark") return hsl(h, 70, 45);
      return hsl((h + 35) % 360, 85, 55);
  }
}
