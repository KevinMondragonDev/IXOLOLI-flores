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

// Friday — Sunflowers as a still-life bouquet in a vase, centered. Fixed
// composition (no random placement) so flowers are well-spaced and aesthetic.
// Click any flower head to burst hearts; one initial burst on mount.
export function Impressionism({ flowers: _flowers, reduceMotion }: Props) {
  const [engineReady, setEngineReady] = useState(false);
  const containerRef = useRef<Container | null>(null);
  const stageRef = useRef<HTMLDivElement>(null);

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
      const speed = 8 + Math.random() * 16;
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
            gravity: { enable: true, acceleration: 10 },
            outModes: { default: "destroy" },
            decay: 0.005,
            straight: true,
          },
          life: { duration: { value: 2.4 }, count: 1 },
        }
      );
    }
  }, []);

  // Initial heart shower from the vase mouth on mount, plus a slow drift.
  useEffect(() => {
    if (!engineReady) return;
    const stage = stageRef.current;
    if (!stage) return;
    const r = stage.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const vy = r.top + r.height * 0.62;
    const t1 = setTimeout(() => burstHearts(cx, vy, 28), 350);
    const interval = setInterval(() => {
      // gentle drifting hearts around the bouquet
      const x = cx + (Math.random() - 0.5) * r.width * 0.5;
      const y = r.top + r.height * (0.25 + Math.random() * 0.3);
      const c = containerRef.current;
      if (!c) return;
      c.particles.addParticle(
        { x, y },
        {
          shape: { type: "heart" },
          color: { value: ["#ff7aa2", "#ffb6c1", "#ff9ec4"][Math.floor(Math.random() * 3)] },
          size: { value: 4 + Math.random() * 6 },
          opacity: {
            value: { min: 0.3, max: 0.85 },
            animation: { enable: true, speed: 0.4, startValue: "max", destroy: "min" },
          },
          move: {
            enable: true,
            speed: { min: 0.4, max: 1.4 },
            direction: "top",
            gravity: { enable: false },
            outModes: { default: "destroy" },
            decay: 0,
            straight: false,
          },
          life: { duration: { value: 5 }, count: 1 },
        }
      );
    }, 700);
    return () => {
      clearTimeout(t1);
      clearInterval(interval);
    };
  }, [engineReady, burstHearts]);

  // Bouquet composition — stems fan out from the vase neck.
  // Angles in degrees from vertical (negative = left, positive = right).
  const bouquet = useMemo(
    () => [
      { angle: -38, length: 0.34, headScale: 0.9, hueShift: 8 },
      { angle: -22, length: 0.42, headScale: 1.0, hueShift: 0 },
      { angle: -10, length: 0.5, headScale: 1.05, hueShift: -4 },
      { angle: 0, length: 0.55, headScale: 1.15, hueShift: 0 },
      { angle: 12, length: 0.48, headScale: 1.0, hueShift: 6 },
      { angle: 26, length: 0.4, headScale: 0.95, hueShift: -2 },
      { angle: 40, length: 0.32, headScale: 0.88, hueShift: 4 },
    ],
    []
  );

  const fallen = useMemo(
    () => [
      { x: -0.18, y: 0.9, rot: -22, scale: 0.7 },
      { x: 0.22, y: 0.92, rot: 18, scale: 0.65 },
      { x: 0.04, y: 0.94, rot: -6, scale: 0.6 },
    ],
    []
  );

  return (
    <div ref={stageRef} className="absolute inset-0 overflow-hidden">
      {/* warm meadow / studio background */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, #f1d8a8 0%, #e6b97a 45%, #c89a55 78%, #6b4d28 100%)",
        }}
      />
      <PaintedHaze />

      {/* table */}
      <div
        className="absolute inset-x-0"
        style={{
          bottom: 0,
          height: "32%",
          background:
            "linear-gradient(180deg, rgba(108,72,38,0.55) 0%, rgba(72,46,22,0.85) 100%)",
        }}
      />
      <div
        className="absolute inset-x-0"
        style={{
          bottom: "32%",
          height: 2,
          background: "rgba(0,0,0,0.25)",
        }}
      />

      {/* Vase — centered, sitting on the table */}
      <Vase />

      {/* Stems behind the vase neck */}
      <div className="absolute left-1/2 top-0 h-full" style={{ width: 1, transform: "translateX(-50%)" }}>
        {/* Each stem is a curved SVG drawn from the vase neck up to where the head sits */}
        <svg className="absolute" style={{ left: "-50vw", top: 0, width: "100vw", height: "100%", overflow: "visible" }}>
          {bouquet.map((b, i) => (
            <Stem key={i} angle={b.angle} length={b.length} hueShift={b.hueShift} />
          ))}
        </svg>
      </div>

      {/* Sunflower heads at end of each stem */}
      {bouquet.map((b, i) => (
        <SunflowerHead
          key={i}
          index={i}
          angle={b.angle}
          length={b.length}
          headScale={b.headScale}
          hueShift={b.hueShift}
          reduceMotion={reduceMotion}
          onBurst={burstHearts}
        />
      ))}

      {/* Fallen sunflowers on the table */}
      {fallen.map((f, i) => (
        <FallenSunflower key={i} {...f} reduceMotion={reduceMotion} onBurst={burstHearts} />
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

// Vase — ceramic terracotta with a soft highlight.
function Vase() {
  return (
    <svg
      className="absolute"
      viewBox="0 0 200 280"
      style={{
        left: "50%",
        bottom: "12%",
        width: "min(28vw, 240px)",
        height: "min(40vh, 340px)",
        transform: "translateX(-50%)",
        overflow: "visible",
        filter: "drop-shadow(0 8px 18px rgba(0,0,0,0.4))",
      }}
      aria-label="Jarrón con girasoles"
    >
      <defs>
        <linearGradient id="vaseGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#c95a2c" />
          <stop offset="0.45" stopColor="#e08148" />
          <stop offset="1" stopColor="#7e3814" />
        </linearGradient>
        <linearGradient id="vaseGradTop" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#b14a22" />
          <stop offset="1" stopColor="#e07a3c" />
        </linearGradient>
      </defs>
      {/* body */}
      <path
        d="M40 90 C 30 130, 30 180, 40 230 C 60 260, 140 260, 160 230 C 170 180, 170 130, 160 90 Z"
        fill="url(#vaseGrad)"
        stroke="#3a1a08"
        strokeWidth={2}
      />
      {/* neck */}
      <path
        d="M60 80 L 60 95 L 140 95 L 140 80 Z"
        fill="url(#vaseGradTop)"
        stroke="#3a1a08"
        strokeWidth={2}
      />
      {/* mouth (ellipse top) */}
      <ellipse cx={100} cy={80} rx={42} ry={8} fill="#5a1f08" stroke="#2a0d04" strokeWidth={2} />
      {/* highlight */}
      <path d="M55 110 C 50 160, 50 210, 60 240" stroke="rgba(255,220,180,0.4)" strokeWidth={6} fill="none" />
      {/* decorative band */}
      <path d="M48 150 L 152 150" stroke="#3a1a08" strokeWidth={1.6} opacity={0.7} />
      <path d="M52 158 C 80 150, 120 162, 148 156" stroke="#fff5e0" strokeWidth={1} opacity={0.4} fill="none" />
    </svg>
  );
}

// A single curved stem from vase neck to head position.
function Stem({ angle, length, hueShift }: { angle: number; length: number; hueShift: number }) {
  // The stem goes from (50%, 75%) of the screen (vase neck) to (50% + dx, 75% - dy)
  // in viewport units. Use SVG percent coords.
  const rad = (angle * Math.PI) / 180;
  const dx = Math.sin(rad) * length;
  const dy = Math.cos(rad) * length;
  const x1 = 50;
  const y1 = 75;
  const x2 = x1 + dx * 100;
  const y2 = y1 - dy * 100;
  // control point bows the stem outward slightly
  const bowX = (x1 + x2) / 2 + Math.sin(rad) * 4;
  const bowY = (y1 + y2) / 2 + 6;
  return (
    <path
      d={`M ${x1}% ${y1}% Q ${bowX}% ${bowY}% ${x2}% ${y2}%`}
      stroke={`hsl(${85 + hueShift}, 50%, 32%)`}
      strokeWidth={4}
      fill="none"
      strokeLinecap="round"
      filter="drop-shadow(0 2px 2px rgba(0,0,0,0.3))"
    />
  );
}

function SunflowerHead({
  index,
  angle,
  length,
  headScale,
  hueShift,
  reduceMotion,
  onBurst,
}: {
  index: number;
  angle: number;
  length: number;
  headScale: number;
  hueShift: number;
  reduceMotion: boolean;
  onBurst: (x: number, y: number, count?: number) => void;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const headRef = useRef<SVGGElement>(null);
  const petalsRef = useRef<SVGGElement>(null);
  const [busy, setBusy] = useState(false);

  // Position the head at the end of the stem
  const rad = (angle * Math.PI) / 180;
  const dx = Math.sin(rad) * length;
  const dy = Math.cos(rad) * length;
  const left = 50 + dx * 100;
  const top = 75 - dy * 100;

  useEffect(() => {
    if (!headRef.current || reduceMotion) return;
    gsap.from(headRef.current, {
      scale: 0,
      transformOrigin: "50% 50%",
      duration: 1.1,
      ease: "elastic.out(1, 0.55)",
      delay: 0.2 + index * 0.08,
    });
  }, [reduceMotion, index]);

  useEffect(() => {
    if (!wrapRef.current || reduceMotion) return;
    const tween = gsap.to(wrapRef.current, {
      rotation: `+=${(index % 2 === 0 ? 1 : -1) * 3}`,
      transformOrigin: "50% 100%",
      duration: 2.6 + index * 0.22,
      yoyo: true,
      repeat: -1,
      ease: "sine.inOut",
    });
    return () => {
      tween.kill();
    };
  }, [reduceMotion, index]);

  const explode = (e: React.PointerEvent) => {
    if (busy) return;
    setBusy(true);
    const rect = wrapRef.current?.getBoundingClientRect();
    const cx = rect ? rect.left + rect.width / 2 : e.clientX;
    const cy = rect ? rect.top + rect.height / 2 : e.clientY;
    onBurst(cx, cy, 22);

    if (headRef.current && petalsRef.current) {
      gsap
        .timeline({
          onComplete: () => {
            gsap.delayedCall(1.4 + Math.random() * 0.6, () => {
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

      Array.from(petalsRef.current.children).forEach((el) => {
        const ang2 = Math.random() * Math.PI * 2;
        const dist = 50 + Math.random() * 70;
        gsap.to(el, {
          x: Math.cos(ang2) * dist,
          y: Math.sin(ang2) * dist + 50,
          rotation: (Math.random() - 0.5) * 540,
          opacity: 0,
          duration: 1.1,
          ease: "power2.out",
        });
      });
    }
  };

  const size = 110 * headScale;

  return (
    <div
      ref={wrapRef}
      className="absolute"
      style={{
        left: `${left}%`,
        top: `${top}%`,
        width: size,
        height: size,
        transform: `translate(-50%, -50%) rotate(${angle * 0.6}deg)`,
      }}
    >
      <FlowerHeadSVG
        size={size}
        hueShift={hueShift}
        headRef={headRef}
        petalsRef={petalsRef}
        onPointerDown={explode}
      />
    </div>
  );
}

function FallenSunflower({
  x,
  y,
  rot,
  scale,
  reduceMotion,
  onBurst,
}: {
  x: number;
  y: number;
  rot: number;
  scale: number;
  reduceMotion: boolean;
  onBurst: (x: number, y: number, count?: number) => void;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const headRef = useRef<SVGGElement>(null);
  const petalsRef = useRef<SVGGElement>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!headRef.current || reduceMotion) return;
    gsap.from(headRef.current, {
      scale: 0,
      duration: 0.9,
      ease: "elastic.out(1, 0.5)",
      delay: 0.5,
    });
  }, [reduceMotion]);

  const explode = (e: React.PointerEvent) => {
    if (busy) return;
    setBusy(true);
    const rect = wrapRef.current?.getBoundingClientRect();
    const cx = rect ? rect.left + rect.width / 2 : e.clientX;
    const cy = rect ? rect.top + rect.height / 2 : e.clientY;
    onBurst(cx, cy, 16);
    if (headRef.current && petalsRef.current) {
      gsap.to(headRef.current, {
        scale: 0,
        duration: 0.4,
        ease: "power2.in",
        onComplete: () => {
          gsap.delayedCall(1.6, () => {
            if (!headRef.current || !petalsRef.current) return;
            gsap.set(petalsRef.current.children, { rotation: 0, x: 0, y: 0, opacity: 1 });
            gsap.to(headRef.current, {
              scale: 1,
              duration: 0.9,
              ease: "elastic.out(1, 0.5)",
              onComplete: () => setBusy(false),
            });
          });
        },
      });
    }
  };

  const size = 100 * scale;

  return (
    <div
      ref={wrapRef}
      className="absolute"
      style={{
        left: `${50 + x * 30}%`,
        top: `${y * 100}%`,
        width: size,
        height: size,
        transform: `translate(-50%, -50%) rotate(${rot}deg)`,
      }}
    >
      <FlowerHeadSVG
        size={size}
        hueShift={0}
        headRef={headRef}
        petalsRef={petalsRef}
        onPointerDown={explode}
      />
    </div>
  );
}

// Shared sunflower head SVG.
function FlowerHeadSVG({
  size,
  hueShift,
  headRef,
  petalsRef,
  onPointerDown,
}: {
  size: number;
  hueShift: number;
  headRef: React.RefObject<SVGGElement>;
  petalsRef: React.RefObject<SVGGElement>;
  onPointerDown: (e: React.PointerEvent) => void;
}) {
  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      onPointerDown={onPointerDown}
      style={{
        overflow: "visible",
        cursor: "pointer",
        filter: "drop-shadow(0 6px 10px rgba(0,0,0,0.35))",
      }}
      aria-label="Girasol — tócalo para que estalle en corazones"
    >
      <g ref={headRef} transform="translate(50 50)">
        <g ref={petalsRef}>
          {Array.from({ length: 18 }).map((_, i) => {
            const a = (i / 18) * 360;
            const len = 22 + (i % 2) * 2;
            return (
              <g key={i} transform={`rotate(${a})`}>
                <ellipse
                  cx={0}
                  cy={-len * 0.55}
                  rx={5}
                  ry={len * 0.55}
                  fill={`hsl(${42 + hueShift + (i % 3)}, 95%, ${56 + (i % 2) * 6}%)`}
                />
                <ellipse cx={0} cy={-len * 0.55} rx={2.5} ry={len * 0.5} fill={`hsl(${30 + hueShift}, 95%, 50%)`} opacity={0.55} />
              </g>
            );
          })}
          {Array.from({ length: 12 }).map((_, i) => {
            const a = (i / 12) * 360 + 11;
            return (
              <g key={"i" + i} transform={`rotate(${a})`}>
                <ellipse cx={0} cy={-12} rx={4} ry={10} fill={`hsl(${38 + hueShift}, 100%, 64%)`} />
              </g>
            );
          })}
        </g>
        <circle r={11} fill="#3a230f" />
        {Array.from({ length: 30 }).map((_, i) => {
          const a = (i / 30) * Math.PI * 2;
          const r = 6 + (i % 2) * 1.5;
          return <circle key={i} cx={Math.cos(a) * r} cy={Math.sin(a) * r} r={1.2} fill="#1a0d04" />;
        })}
        <circle r={11} fill="none" stroke="#5a3a18" strokeWidth={1} />
      </g>
    </svg>
  );
}

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
        const hue = isSky ? 35 + ((i * 7) % 25) : 30 + ((i * 11) % 30);
        const sat = isSky ? 55 : 55;
        const light = isSky ? 78 : 38;
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(((i * 13) % 360) * (Math.PI / 180));
        ctx.fillStyle = `hsla(${hue}, ${sat}%, ${light}%, 0.5)`;
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
