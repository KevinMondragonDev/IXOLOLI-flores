"use client";

import { useEffect, useRef, useState } from "react";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import type { Flower } from "@/lib/flowers";
import { useCursor } from "../Cursor";

type Props = { flowers: Flower[]; ink: string; reduceMotion: boolean };

// Wednesday — Cartoon style. Each flower is a Lottie blooming animation.
// Uses a couple of public LottieFiles community animations; falls back to a
// CSS-animated SVG flower if the network can't reach the CDN.

const LOTTIE_SOURCES = [
  // Free flower animations on LottieFiles CDN
  "https://lottie.host/ec48a96d-cae5-4b46-9a31-7b4d7f3e0b45/zV5tF8gWtQ.lottie",
  "https://lottie.host/4b9f3a73-2c91-49fb-9c43-b8dd6a8a6db5/8Yc5pZ6S6r.lottie",
];

export function Cartoon({ flowers, reduceMotion }: Props) {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, #bde6ff 0%, #e5f7d0 60%, #b6e2a3 100%)",
        }}
      />
      <Clouds />
      <div className="absolute inset-0">
        {flowers.map((f, i) => (
          <CartoonFlower
            key={f.id}
            flower={f}
            srcIndex={i % LOTTIE_SOURCES.length}
            reduceMotion={reduceMotion}
          />
        ))}
      </div>
    </div>
  );
}

function CartoonFlower({
  flower,
  srcIndex,
  reduceMotion,
}: {
  flower: Flower;
  srcIndex: number;
  reduceMotion: boolean;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const cursor = useCursor();
  const [lottieFailed, setLottieFailed] = useState(false);

  useEffect(() => {
    if (reduceMotion || !wrapRef.current) return;
    const el = wrapRef.current;
    let raf = 0;
    const tick = () => {
      const dx = flower.x - 0.5 - cursor.x;
      const fall = Math.max(0, 1 - Math.abs(dx) / 0.4);
      const lean = -cursor.x * fall * 18;
      const sc = 1 + 0.08 * fall;
      el.style.transform = `translate(-50%, -100%) rotate(${flower.rotation + lean}deg) scale(${sc})`;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [flower, cursor, reduceMotion]);

  const size = 80 + flower.scale * 110;
  const src = LOTTIE_SOURCES[srcIndex];

  return (
    <div
      ref={wrapRef}
      className="absolute"
      style={{
        left: `${flower.x * 100}%`,
        top: `${flower.y * 100}%`,
        width: size,
        height: size,
        transform: `translate(-50%, -100%) rotate(${flower.rotation}deg)`,
        zIndex: Math.floor(flower.z * 100),
        filter: `hue-rotate(${flower.hue - 340}deg) drop-shadow(0 4px 0 rgba(0,0,0,0.18))`,
      }}
    >
      {!lottieFailed ? (
        <DotLottieReact
          src={src}
          loop
          autoplay
          speed={0.7 + (flower.id % 4) * 0.1}
          onError={() => setLottieFailed(true)}
          style={{ width: "100%", height: "100%" }}
        />
      ) : (
        <FallbackCartoonFlower hue={flower.hue} />
      )}
    </div>
  );
}

// CSS-animated SVG fallback if Lottie CDN is unreachable.
function FallbackCartoonFlower({ hue }: { hue: number }) {
  return (
    <svg viewBox="0 0 100 100" width="100%" height="100%" style={{ overflow: "visible" }}>
      <g style={{ transformOrigin: "50% 80%", animation: "bloom 1.4s ease-out both, sway 3s ease-in-out infinite alternate" }}>
        <line x1="50" y1="100" x2="50" y2="60" stroke="#3a8a3a" strokeWidth="6" strokeLinecap="round" />
        {Array.from({ length: 8 }).map((_, i) => {
          const a = (i / 8) * 360;
          return (
            <ellipse
              key={i}
              cx={50}
              cy={50 - 16}
              rx={9}
              ry={18}
              transform={`rotate(${a} 50 50)`}
              fill={`hsl(${hue + (i % 2 ? 0 : 30)}, 90%, 65%)`}
              stroke="#1f2a3a"
              strokeWidth="2"
            />
          );
        })}
        <circle cx="50" cy="50" r="9" fill={`hsl(${(hue + 35) % 360}, 100%, 60%)`} stroke="#1f2a3a" strokeWidth="2" />
      </g>
      <style>{`
        @keyframes bloom { from { transform: scale(0); } to { transform: scale(1); } }
        @keyframes sway { from { transform: rotate(-5deg); } to { transform: rotate(5deg); } }
      `}</style>
    </svg>
  );
}

function Clouds() {
  return (
    <svg className="absolute inset-x-0 top-0 w-full h-1/2 pointer-events-none" viewBox="0 0 100 50" preserveAspectRatio="none">
      {[
        { x: 12, y: 14, s: 1 },
        { x: 50, y: 8, s: 1.4 },
        { x: 82, y: 18, s: 0.9 },
      ].map((c, i) => (
        <g key={i} transform={`translate(${c.x} ${c.y}) scale(${c.s})`}>
          <ellipse cx={0} cy={0} rx={6} ry={2.4} fill="white" opacity="0.85" />
          <ellipse cx={3} cy={-1} rx={4} ry={2} fill="white" opacity="0.85" />
          <ellipse cx={-3} cy={-1} rx={3.6} ry={2} fill="white" opacity="0.85" />
        </g>
      ))}
    </svg>
  );
}
