"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import gsap from "gsap";
import Particles, { initParticlesEngine } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";
import { loadHeartShape } from "@tsparticles/shape-heart";
import { loadEmittersPlugin } from "@tsparticles/plugin-emitters";
import type { Container, ISourceOptions } from "@tsparticles/engine";
import type { Flower } from "@/lib/flowers";

type Props = { flowers: Flower[]; ink: string; reduceMotion: boolean };

// Friday — Sunflowers field. Hover/click a sunflower → it bursts; tsParticles
// emits real-engine hearts; GSAP animates bloom/explode on each SVG.
export function Impressionism({ flowers, reduceMotion }: Props) {
  const [engineReady, setEngineReady] = useState(false);
  const containerRef = useRef<Container | null>(null);

  useEffect(() => {
    initParticlesEngine(async (engine) => {
      await loadSlim(engine);
      await loadHeartShape(engine);
      await loadEmittersPlugin(engine);
    }).then(() => setEngineReady(true));
  }, []);

  const options: ISourceOptions = useMemo(
    () => ({
      fullScreen: { enable: false },
      detectRetina: true,
      fpsLimit: 60,
      particles: {
        number: { value: 0 },
        shape: { type: "heart" },
        color: { value: ["#ff5d8f", "#ff7aa2", "#ff3b6f", "#ffb6c1", "#ff9ec4"] },
        opacity: {
          value: { min: 0.6, max: 1 },
          animation: { enable: true, speed: 0.8, startValue: "max", destroy: "min" },
        },
        size: { value: { min: 6, max: 16 } },
        rotate: {
          value: { min: 0, max: 360 },
          animation: { enable: true, speed: 30, sync: false },
        },
        move: {
          enable: true,
          gravity: { enable: true, acceleration: 9 },
          speed: { min: 8, max: 18 },
          direction: "none",
          outModes: { default: "destroy", top: "none" },
          decay: 0.005,
        },
      },
      emitters: [],
    }),
    []
  );

  const burstHearts = useCallback((x: number, y: number, count = 18) => {
    const c = containerRef.current;
    if (!c) return;
    const colors = ["#ff5d8f", "#ff7aa2", "#ff3b6f", "#ffb6c1", "#ff9ec4"];
    for (let i = 0; i < count; i++) {
      const ang = Math.random() * Math.PI * 2;
      const speed = 10 + Math.random() * 18;
      c.particles.addParticle(
        { x, y },
        {
          shape: { type: "heart" },
          color: { value: colors[Math.floor(Math.random() * colors.length)] },
          size: { value: 6 + Math.random() * 12 },
          opacity: {
            value: { min: 0.6, max: 1 },
            animation: { enable: true, speed: 0.9, startValue: "max", destroy: "min" },
          },
          rotate: {
            value: Math.random() * 360,
            direction: Math.random() > 0.5 ? "clockwise" : "counter-clockwise",
            animation: { enable: true, speed: 30 + Math.random() * 30, sync: false },
          },
          move: {
            enable: true,
            speed,
            angle: { value: 0, offset: (ang * 180) / Math.PI },
            direction: "none",
            gravity: { enable: true, acceleration: 12 },
            outModes: { default: "destroy" },
            decay: 0.005,
            straight: true,
          },
          life: { duration: { value: 2.4 }, count: 1 },
        }
      );
    }
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* warm meadow background painted via gradient */}
      <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, #f1d8a8 0%, #e6b97a 45%, #a8a368 75%, #5d6e3a 100%)" }} />
      <PaintedHaze />

      {flowers.map((f) => (
        <SunflowerSVG key={f.id} flower={f} reduceMotion={reduceMotion} onBurst={burstHearts} />
      ))}

      {engineReady && (
        <Particles
          id="hearts"
          className="absolute inset-0 pointer-events-none"
          options={options}
          particlesLoaded={async (c) => {
            containerRef.current = c ?? null;
          }}
        />
      )}
    </div>
  );
}

// Painted brushstroke haze on a static canvas (cheap, draw once).
function PaintedHaze() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const draw = () => {
      c.width = c.clientWidth * dpr;
      c.height = c.clientHeight * dpr;
      const w = c.width;
      const h = c.height;
      ctx.clearRect(0, 0, w, h);
      for (let i = 0; i < 1100; i++) {
        const x = (((i * 9301 + 49297) % 233280) / 233280) * w;
        const y = (((i * 6481 + 53711) % 233280) / 233280) * h;
        const isSky = y / h < 0.5;
        const hue = isSky ? 35 + ((i * 7) % 25) : 70 + ((i * 11) % 40);
        const sat = isSky ? 55 : 50;
        const light = isSky ? 78 : 50;
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(((i * 13) % 360) * (Math.PI / 180));
        ctx.fillStyle = `hsla(${hue}, ${sat}%, ${light}%, 0.55)`;
        ctx.beginPath();
        ctx.ellipse(0, 0, (4 + ((i * 5) % 6)) * dpr, 1.4 * dpr, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    };
    draw();
    window.addEventListener("resize", draw);
    return () => window.removeEventListener("resize", draw);
  }, []);
  return <canvas ref={ref} className="absolute inset-0 w-full h-full" />;
}

function SunflowerSVG({
  flower,
  reduceMotion,
  onBurst,
}: {
  flower: Flower;
  reduceMotion: boolean;
  onBurst: (x: number, y: number, count?: number) => void;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const headRef = useRef<SVGGElement>(null);
  const stemRef = useRef<SVGPathElement>(null);
  const petalsRef = useRef<SVGGElement>(null);
  const [busy, setBusy] = useState(false);

  // Bloom in on mount with stagger via GSAP
  useEffect(() => {
    if (!headRef.current || !stemRef.current) return;
    if (reduceMotion) return;
    gsap.from(stemRef.current, {
      scaleY: 0,
      transformOrigin: "50% 100%",
      duration: 0.9,
      ease: "power2.out",
      delay: flower.id * 0.012,
    });
    gsap.from(headRef.current, {
      scale: 0,
      transformOrigin: "50% 50%",
      duration: 1.1,
      ease: "elastic.out(1, 0.55)",
      delay: 0.25 + flower.id * 0.012,
    });
  }, [flower.id, reduceMotion]);

  // Subtle sway via GSAP loop
  useEffect(() => {
    if (!wrapRef.current || reduceMotion) return;
    const tween = gsap.to(wrapRef.current, {
      rotation: "+=4",
      transformOrigin: "50% 100%",
      duration: 2.4 + Math.random() * 1.2,
      yoyo: true,
      repeat: -1,
      ease: "sine.inOut",
    });
    return () => {
      tween.kill();
    };
  }, [reduceMotion]);

  const explode = (e: React.PointerEvent) => {
    if (busy) return;
    setBusy(true);
    const rect = wrapRef.current?.getBoundingClientRect();
    const cx = rect ? rect.left + rect.width / 2 : e.clientX;
    const cy = rect ? rect.top + rect.height * 0.35 : e.clientY;
    onBurst(cx, cy, 18);

    // GSAP pop + shrink + petal scatter
    if (headRef.current && petalsRef.current) {
      gsap.timeline({
        onComplete: () => {
          // regrow after delay
          gsap.delayedCall(1.4 + Math.random() * 0.8, () => {
            if (!headRef.current || !petalsRef.current) return;
            gsap.set(petalsRef.current.children, { rotation: 0, x: 0, y: 0, opacity: 1 });
            gsap.fromTo(
              headRef.current,
              { scale: 0 },
              { scale: 1, duration: 1.0, ease: "elastic.out(1, 0.5)", onComplete: () => setBusy(false) }
            );
          });
        },
      })
        .to(headRef.current, { scale: 1.3, duration: 0.18, ease: "power3.out" })
        .to(headRef.current, { scale: 0, duration: 0.35, ease: "power2.in" }, "+=0.05");

      // scatter petals
      Array.from(petalsRef.current.children).forEach((el) => {
        const ang = Math.random() * Math.PI * 2;
        const dist = 60 + Math.random() * 80;
        gsap.to(el, {
          x: Math.cos(ang) * dist,
          y: Math.sin(ang) * dist + 60,
          rotation: (Math.random() - 0.5) * 540,
          opacity: 0,
          duration: 1.2,
          ease: "power2.out",
        });
      });
    }
  };

  // size scales with flower.scale (closer flowers bigger)
  const size = 90 + flower.scale * 90;

  return (
    <div
      ref={wrapRef}
      className="absolute"
      style={{
        left: `${flower.x * 100}%`,
        top: `${flower.y * 100}%`,
        transform: `translate(-50%, -100%) rotate(${flower.rotation}deg)`,
        width: size,
        height: size * 1.4,
        zIndex: Math.floor(flower.z * 100),
      }}
    >
      <svg
        viewBox="0 0 100 140"
        width={size}
        height={size * 1.4}
        onPointerEnter={explode}
        onPointerDown={explode}
        style={{ overflow: "visible", cursor: "pointer", filter: "drop-shadow(0 4px 6px rgba(0,0,0,0.25))" }}
        aria-label="Girasol — tócalo para que estalle en corazones"
      >
        {/* stem */}
        <path
          ref={stemRef}
          d="M50 140 C 48 110, 52 95, 50 70"
          stroke="#5e7a2a"
          strokeWidth={5}
          fill="none"
          strokeLinecap="round"
        />
        <path d="M50 110 C 60 100, 70 102, 74 92" stroke="#6b8a30" strokeWidth={3} fill="#7b9a36" opacity={0.9} />

        {/* head group */}
        <g ref={headRef} transform="translate(50 55)">
          {/* outer petals */}
          <g ref={petalsRef}>
            {Array.from({ length: 16 }).map((_, i) => {
              const a = (i / 16) * 360;
              return (
                <g key={i} transform={`rotate(${a})`}>
                  <ellipse cx={0} cy={-22} rx={6} ry={16} fill={`hsl(${44 + ((i * 3) % 6)}, 95%, ${55 + (i % 3) * 5}%)`} />
                  <ellipse cx={0} cy={-22} rx={3} ry={14} fill={`hsl(${36}, 95%, 50%)`} opacity={0.5} />
                </g>
              );
            })}
            {/* inner petals */}
            {Array.from({ length: 12 }).map((_, i) => {
              const a = (i / 12) * 360 + 11;
              return (
                <g key={"i" + i} transform={`rotate(${a})`}>
                  <ellipse cx={0} cy={-15} rx={4} ry={11} fill={`hsl(${40}, 100%, 65%)`} />
                </g>
              );
            })}
          </g>
          {/* dark core */}
          <circle r={11} fill="#3a230f" />
          {/* seed dots */}
          {Array.from({ length: 24 }).map((_, i) => {
            const a = (i / 24) * Math.PI * 2;
            const rd = 6;
            return <circle key={i} cx={Math.cos(a) * rd} cy={Math.sin(a) * rd} r={1.2} fill="#231708" />;
          })}
        </g>
      </svg>
    </div>
  );
}
