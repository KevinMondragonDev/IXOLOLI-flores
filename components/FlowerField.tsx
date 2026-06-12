"use client";

import { useEffect, useRef, useState } from "react";
import type { Flower } from "@/lib/flowers";
import type { StyleId } from "@/lib/styles";
import { FlowerGlyph, type GlyphMode } from "./FlowerGlyph";
import { useCursor } from "./Cursor";
import { Pointillism } from "./styles/Pointillism";
import { Impressionism } from "./styles/Impressionism";

const MODE_BY_STYLE: Record<StyleId, GlyphMode> = {
  watercolor: "soft",
  pointillism: "fill",
  cartoon: "outlined",
  realistic: "gradient",
  impressionism: "soft",
  artnouveau: "ornate",
  lineart: "stroke",
};

type Props = {
  flowers: Flower[];
  styleId: StyleId;
  ink: string;
  reduceMotion: boolean;
};

type Petal = { id: number; x: number; y: number; hue: number; born: number };

export function FlowerField({ flowers, styleId, ink, reduceMotion }: Props) {
  const cursor = useCursor();
  const [petals, setPetals] = useState<Petal[]>([]);
  const [extras, setExtras] = useState<Flower[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  // Interactive canvas styles handled separately
  if (styleId === "pointillism") {
    return <Pointillism flowers={flowers} ink={ink} reduceMotion={reduceMotion} />;
  }
  if (styleId === "impressionism") {
    return <Impressionism flowers={flowers} ink={ink} reduceMotion={reduceMotion} />;
  }

  const mode = MODE_BY_STYLE[styleId];

  const onClick = (e: React.MouseEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    const id = Date.now() + Math.random();
    setExtras((prev) => [
      ...prev.slice(-30),
      {
        id,
        x: px,
        y: py,
        scale: 0.5 + Math.random() * 0.5,
        rotation: -10 + Math.random() * 20,
        hue: Math.floor(Math.random() * 360),
        species: ["rose", "daisy", "tulip", "poppy", "lily", "lavender", "sunflower"][
          Math.floor(Math.random() * 7)
        ] as Flower["species"],
        z: 0.95,
      },
    ]);
    // pétalos sueltos
    const burst: Petal[] = [];
    for (let i = 0; i < 6; i++) {
      burst.push({
        id: id + i,
        x: e.clientX,
        y: e.clientY,
        hue: Math.floor(Math.random() * 360),
        born: performance.now(),
      });
    }
    setPetals((prev) => [...prev.slice(-50), ...burst]);
    setTimeout(() => {
      setPetals((prev) => prev.filter((p) => !burst.find((b) => b.id === p.id)));
    }, 1800);
  };

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 overflow-hidden cursor-crosshair"
      onClick={onClick}
      aria-label="Campo de flores interactivo"
    >
      {styleId === "watercolor" && <WatercolorDefs />}
      {styleId === "artnouveau" && <ArtNouveauFrame ink={ink} />}
      {styleId === "lineart" && <LineArtFrame />}

      {[...flowers, ...extras].map((f) => (
        <FlowerInstance
          key={f.id}
          flower={f}
          mode={mode}
          ink={ink}
          cursorX={cursor.x}
          cursorY={cursor.y}
          active={cursor.active}
          styleId={styleId}
          reduceMotion={reduceMotion}
        />
      ))}

      {/* fallen petals burst */}
      {petals.map((p) => (
        <span
          key={p.id}
          className="pointer-events-none fixed block"
          style={{
            left: p.x,
            top: p.y,
            width: 12,
            height: 16,
            borderRadius: "60% 40% 50% 50%",
            background: `hsl(${p.hue}, 70%, 65%)`,
            opacity: 0.85,
            transform: `translate(-50%, -50%)`,
            animation: `petal-fall 1.6s ease-out forwards`,
            animationDelay: `${(p.id % 6) * 40}ms`,
          }}
        />
      ))}

      <style jsx>{`
        @keyframes petal-fall {
          0% {
            transform: translate(-50%, -50%) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translate(
                calc(-50% + ${Math.random() > 0.5 ? "" : "-"}40px),
                calc(-50% + 120px)
              )
              rotate(180deg);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}

function FlowerInstance({
  flower,
  mode,
  ink,
  cursorX,
  cursorY,
  active,
  styleId,
  reduceMotion,
}: {
  flower: Flower;
  mode: GlyphMode;
  ink: string;
  cursorX: number;
  cursorY: number;
  active: boolean;
  styleId: StyleId;
  reduceMotion: boolean;
}) {
  // distance falloff: flowers near cursor lean more
  const dx = flower.x - 0.5 - cursorX;
  const dy = flower.y - 0.5 - cursorY;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const falloff = Math.max(0, 1 - dist / 0.35);
  const lean = active && !reduceMotion ? -cursorX * falloff * 22 : 0;
  const parallaxX = !reduceMotion ? cursorX * (flower.z * 18) : 0;
  const parallaxY = !reduceMotion ? cursorY * (flower.z * 10) : 0;

  const filter =
    styleId === "watercolor"
      ? "url(#watercolor-filter)"
      : styleId === "realistic"
      ? "drop-shadow(0 6px 6px rgba(0,0,0,.35))"
      : styleId === "cartoon"
      ? "drop-shadow(0 3px 0 rgba(0,0,0,.2))"
      : undefined;

  return (
    <div
      className="absolute will-change-transform transition-transform duration-200"
      style={{
        left: `${flower.x * 100}%`,
        top: `${flower.y * 100}%`,
        transform: `translate(calc(-50% + ${parallaxX}px), calc(-100% + ${parallaxY}px)) rotate(${
          flower.rotation + lean
        }deg) scale(${flower.scale})`,
        zIndex: Math.floor(flower.z * 100),
        filter,
      }}
    >
      <div
        className="hover:scale-110 transition-transform duration-300 ease-out"
        style={{ transformOrigin: "50% 100%" }}
      >
        <FlowerGlyph flower={flower} mode={mode} ink={ink} />
      </div>
    </div>
  );
}

function WatercolorDefs() {
  return (
    <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden>
      <defs>
        <filter id="watercolor-filter" x="-20%" y="-20%" width="140%" height="140%">
          <feTurbulence type="fractalNoise" baseFrequency="0.012" numOctaves="2" seed="3" />
          <feDisplacementMap in="SourceGraphic" scale="6" />
          <feGaussianBlur stdDeviation="0.4" />
        </filter>
      </defs>
    </svg>
  );
}

function ArtNouveauFrame({ ink }: { ink: string }) {
  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      aria-hidden
    >
      <g fill="none" stroke="#a37326" strokeWidth="0.3" opacity="0.7">
        <path d="M2 8 C 20 4, 30 18, 50 12 C 70 6, 80 18, 98 8" />
        <path d="M2 92 C 20 96, 30 82, 50 88 C 70 94, 80 82, 98 92" />
        <path d="M4 4 Q 4 50 4 96" />
        <path d="M96 4 Q 96 50 96 96" />
      </g>
    </svg>
  );
}

function LineArtFrame() {
  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      aria-hidden
    >
      <line x1="6" y1="86" x2="94" y2="86" stroke="#1a1a1a" strokeWidth="0.15" />
    </svg>
  );
}
