"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import gsap from "gsap";
import type { Flower } from "@/lib/flowers";
import { useCursor } from "../Cursor";

type Props = { flowers: Flower[]; ink: string; reduceMotion: boolean };

// Wednesday — Cartoon. A field of tulips. Tap each petal to pluck it off
// ("me quiere, no me quiere"). When all petals are gone, a heart pops out
// from the stem and bounces. After a few seconds the tulip regrows.
export function Cartoon({ flowers, reduceMotion }: Props) {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, #bde6ff 0%, #d8f0c6 55%, #a8d68c 100%)",
        }}
      />
      <Clouds />
      <Grass />
      <div className="absolute inset-0">
        {flowers.map((f) => (
          <Tulip key={f.id} flower={f} reduceMotion={reduceMotion} />
        ))}
      </div>
    </div>
  );
}

const PETALS = 6;

function Tulip({ flower, reduceMotion }: { flower: Flower; reduceMotion: boolean }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const petalRefs = useRef<(SVGGElement | null)[]>([]);
  const heartRef = useRef<SVGGElement>(null);
  const cursor = useCursor();
  const [removed, setRemoved] = useState<boolean[]>(() => Array(PETALS).fill(false));
  const [showHeart, setShowHeart] = useState(false);

  const remaining = removed.filter((r) => !r).length;

  // bloom in on mount
  useEffect(() => {
    if (reduceMotion || !wrapRef.current) return;
    gsap.from(wrapRef.current, {
      scale: 0,
      transformOrigin: "50% 100%",
      duration: 1.1,
      ease: "elastic.out(1, 0.55)",
      delay: (flower.id % 30) * 0.025,
    });
  }, [flower.id, reduceMotion]);

  // gentle sway driven by cursor
  useEffect(() => {
    if (reduceMotion || !wrapRef.current) return;
    const el = wrapRef.current;
    const tween = gsap.to(el, {
      rotation: "+=6",
      transformOrigin: "50% 100%",
      duration: 2.6 + (flower.id % 7) * 0.2,
      yoyo: true,
      repeat: -1,
      ease: "sine.inOut",
    });
    return () => {
      tween.kill();
    };
  }, [reduceMotion, flower.id]);

  // when all petals are plucked, reveal heart and schedule regrow
  useEffect(() => {
    if (remaining > 0) return;
    setShowHeart(true);
    const t = setTimeout(() => {
      // regrow petals + hide heart
      petalRefs.current.forEach((el) => {
        if (el) {
          gsap.set(el, { x: 0, y: 0, rotation: 0, opacity: 1, scale: 0 });
          gsap.to(el, { scale: 1, duration: 0.6, ease: "elastic.out(1, 0.5)" });
        }
      });
      setShowHeart(false);
      setRemoved(Array(PETALS).fill(false));
    }, 3800);
    return () => clearTimeout(t);
  }, [remaining]);

  // animate heart appearance + floating
  useEffect(() => {
    if (!showHeart || !heartRef.current) return;
    const el = heartRef.current;
    gsap.fromTo(
      el,
      { scale: 0, y: 20 },
      { scale: 1, y: 0, duration: 0.85, ease: "elastic.out(1, 0.5)" }
    );
    const float = gsap.to(el, {
      y: -16,
      duration: 1.4,
      yoyo: true,
      repeat: -1,
      ease: "sine.inOut",
    });
    return () => {
      float.kill();
    };
  }, [showHeart]);

  const pluck = (i: number) => (e: React.PointerEvent) => {
    e.stopPropagation();
    if (removed[i]) return;
    const el = petalRefs.current[i];
    if (el) {
      const a = (i / PETALS) * Math.PI * 2;
      const dx = Math.cos(a) * 140 + (Math.random() - 0.5) * 80;
      const dy = Math.sin(a) * 100 + 60 + Math.random() * 60;
      gsap.to(el, {
        x: dx,
        y: dy,
        rotation: `${(Math.random() - 0.5) * 540}`,
        opacity: 0,
        duration: 1.4,
        ease: "power2.out",
      });
    }
    setRemoved((prev) => {
      const n = [...prev];
      n[i] = true;
      return n;
    });
  };

  const size = 110 + flower.scale * 90;

  // Subtle cursor lean (only horizontal)
  const dx = flower.x - 0.5 - cursor.x;
  const fall = Math.max(0, 1 - Math.abs(dx) / 0.45);
  const lean = -cursor.x * fall * 12;

  return (
    <div
      ref={wrapRef}
      className="absolute"
      style={{
        left: `${flower.x * 100}%`,
        top: `${flower.y * 100}%`,
        width: size,
        height: size * 1.5,
        transform: `translate(-50%, -100%) rotate(${flower.rotation + lean}deg)`,
        zIndex: Math.floor(flower.z * 100),
        pointerEvents: "auto",
      }}
    >
      <svg
        viewBox="0 0 200 300"
        width={size}
        height={size * 1.5}
        style={{ overflow: "visible", filter: "drop-shadow(0 4px 0 rgba(0,0,0,0.18))" }}
        aria-label="Tulipán cartoon — toca cada pétalo"
      >
        {/* stem */}
        <path
          d="M100 300 C 96 250, 104 200, 100 150"
          stroke="#3a8a3a"
          strokeWidth={8}
          fill="none"
          strokeLinecap="round"
        />
        {/* leaf */}
        <path
          d="M100 240 C 140 230, 165 210, 158 175 C 140 195, 120 205, 100 215 Z"
          fill="#62b56a"
          stroke="#1f2a3a"
          strokeWidth={3}
        />

        {/* tulip head — group of petals */}
        <g transform="translate(100 130)">
          {Array.from({ length: PETALS }).map((_, i) => {
            const ang = (i / PETALS) * 360;
            const baseHue = flower.hue;
            const hue = (baseHue + (i % 2 ? 0 : 18)) % 360;
            return (
              <g
                key={i}
                ref={(el) => {
                  petalRefs.current[i] = el;
                }}
                transform={`rotate(${ang})`}
                onPointerDown={pluck(i)}
                style={{ cursor: removed[i] ? "default" : "pointer" }}
              >
                <path
                  d="M0 0 C -22 -12, -26 -54, 0 -72 C 26 -54, 22 -12, 0 0 Z"
                  fill={`hsl(${hue}, 85%, 65%)`}
                  stroke="#1f2a3a"
                  strokeWidth={3}
                />
                <path
                  d="M0 -10 C -10 -22, -12 -46, 0 -60 C 12 -46, 10 -22, 0 -10 Z"
                  fill={`hsl(${hue}, 95%, 80%)`}
                  opacity={0.6}
                />
              </g>
            );
          })}

          {/* heart that appears when all petals are plucked */}
          {showHeart && (
            <g ref={heartRef} style={{ pointerEvents: "none" }}>
              <path
                d="M0 -10 C -32 -55, -78 -22, 0 38 C 78 -22, 32 -55, 0 -10 Z"
                fill="#ff3b6f"
                stroke="#1f2a3a"
                strokeWidth={3}
              />
              <circle cx={-14} cy={-22} r={6} fill="#ffd1de" opacity={0.85} />
            </g>
          )}
        </g>
      </svg>
    </div>
  );
}

function Clouds() {
  return (
    <svg
      className="absolute inset-x-0 top-0 w-full h-1/2 pointer-events-none"
      viewBox="0 0 100 50"
      preserveAspectRatio="none"
    >
      {[
        { x: 12, y: 14, s: 1 },
        { x: 50, y: 8, s: 1.4 },
        { x: 82, y: 18, s: 0.9 },
      ].map((c, i) => (
        <g key={i} transform={`translate(${c.x} ${c.y}) scale(${c.s})`}>
          <ellipse cx={0} cy={0} rx={6} ry={2.4} fill="white" opacity={0.9} />
          <ellipse cx={3} cy={-1} rx={4} ry={2} fill="white" opacity={0.9} />
          <ellipse cx={-3} cy={-1} rx={3.6} ry={2} fill="white" opacity={0.9} />
        </g>
      ))}
    </svg>
  );
}

function Grass() {
  const blades = useMemo(
    () =>
      Array.from({ length: 40 }).map((_, i) => ({
        x: (i / 40) * 100 + Math.random() * 2,
        h: 1.5 + Math.random() * 2.5,
        hue: 95 + ((i * 7) % 30),
      })),
    []
  );
  return (
    <svg
      className="absolute inset-x-0 bottom-0 w-full h-1/3 pointer-events-none"
      viewBox="0 0 100 30"
      preserveAspectRatio="none"
    >
      {blades.map((b, i) => (
        <path
          key={i}
          d={`M ${b.x} 30 L ${b.x - 0.4} ${30 - b.h} L ${b.x + 0.4} ${30 - b.h} Z`}
          fill={`hsl(${b.hue}, 55%, ${35 + (i % 4) * 6}%)`}
        />
      ))}
    </svg>
  );
}
