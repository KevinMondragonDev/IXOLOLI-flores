"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import gsap from "gsap";
import Particles, { initParticlesEngine } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";
import type { Container, ISourceOptions } from "@tsparticles/engine";
import type { Flower } from "@/lib/flowers";

type Props = { flowers: Flower[]; ink: string; reduceMotion: boolean };

// Friday — Starry Night: Van Gogh style with animated swirls and luminous sunflowers
export function Impressionism({ flowers: _flowers, reduceMotion }: Props) {
  const [engineReady, setEngineReady] = useState(false);
  const containerRef = useRef<Container | null>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    initParticlesEngine(async (engine) => {
      await loadSlim(engine);
    }).then(() => setEngineReady(true));
  }, []);

  const options: ISourceOptions = {
    fullScreen: { enable: false },
    fpsLimit: 60,
    particles: {
      number: { value: 120, density: { enable: true, width: 800, height: 800 } },
      color: { value: ["#ffd54f", "#ffca28", "#ffc107", "#ffb300", "#ffffff"] },
      shape: { type: "circle" },
      opacity: {
        value: { min: 0.1, max: 0.8 },
        animation: { enable: true, speed: 1, sync: false },
      },
      size: {
        value: { min: 1, max: 4 },
        animation: { enable: true, speed: 2, sync: false },
      },
      move: {
        enable: true,
        speed: 0.8,
        direction: "none",
        random: true,
        straight: false,
        outModes: { default: "out" },
        attract: { enable: true, rotate: { x: 600, y: 1200 } }
      },
    },
    interactivity: {
      events: {
        onHover: { enable: true, mode: "bubble" },
      },
      modes: {
        bubble: { distance: 100, size: 8, duration: 2, opacity: 1, color: "#ffffff" },
      },
    },
  };

  const bouquet = [
    { angle: -45, length: 0.4, scale: 0.8, hue: 45, x: 50, y: 70 },
    { angle: -25, length: 0.5, scale: 1.1, hue: 50, x: 50, y: 70 },
    { angle: -5, length: 0.6, scale: 1.2, hue: 48, x: 50, y: 70 },
    { angle: 15, length: 0.55, scale: 1.0, hue: 42, x: 50, y: 70 },
    { angle: 35, length: 0.45, scale: 0.9, hue: 47, x: 50, y: 70 },
  ];

  return (
    <div ref={stageRef} className="absolute inset-0 overflow-hidden bg-[#0a192f]">
      <StarrySky />

      {/* Table */}
      <div
        className="absolute inset-x-0 bottom-0 h-1/3"
        style={{
          background: "linear-gradient(180deg, #1f2937 0%, #111827 100%)",
          borderTop: "2px solid #374151"
        }}
      >
        {/* Table texture */}
        <div className="absolute inset-0 opacity-10 mix-blend-overlay"
             style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'20\' height=\'20\' viewBox=\'0 0 20 20\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'1\' fill-rule=\'evenodd\'%3E%3Ccircle cx=\'3\' cy=\'3\' r=\'3\'/%3E%3Ccircle cx=\'13\' cy=\'13\' r=\'3\'/%3E%3C/g%3E%3C/svg%3E")' }} />
      </div>

      <Vase />

      {/* Stems */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 10 }}>
        {bouquet.map((f, i) => (
          <Stem key={`stem-${i}`} {...f} />
        ))}
      </svg>

      {/* Flower Heads */}
      {bouquet.map((f, i) => (
        <SunflowerHead key={`flower-${i}`} index={i} {...f} reduceMotion={reduceMotion} />
      ))}

      {engineReady && (
        <Particles
          id="stars"
          className="absolute inset-0 pointer-events-none mix-blend-screen"
          options={options}
          particlesLoaded={async (c) => { containerRef.current = c ?? null; }}
        />
      )}
    </div>
  );
}

function StarrySky() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    // Draw Van Gogh style swirls
    const drawSwirls = () => {
      const w = canvas.width, h = canvas.height;
      ctx.clearRect(0, 0, w, h);
      
      const drawDash = (x: number, y: number, angle: number, color: string, length = 15) => {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angle);
        ctx.beginPath();
        ctx.moveTo(-length/2, 0);
        ctx.bezierCurveTo(-length/4, -2, length/4, 2, length/2, 0);
        ctx.strokeStyle = color;
        ctx.lineWidth = 2 + Math.random();
        ctx.lineCap = "round";
        ctx.stroke();
        ctx.restore();
      };

      // Draw large spirals
      const spirals = [
        { cx: w * 0.3, cy: h * 0.3, r: Math.min(w, h) * 0.25 },
        { cx: w * 0.7, cy: h * 0.2, r: Math.min(w, h) * 0.2 },
        { cx: w * 0.5, cy: h * 0.5, r: Math.min(w, h) * 0.3 },
      ];

      const colors = ['#1565c0', '#1976d2', '#2196f3', '#4fc3f7', '#0d47a1', '#ffffff', '#ffd54f'];

      spirals.forEach(s => {
        for(let r = 10; r < s.r; r += 12) {
          const numDashes = Math.floor((2 * Math.PI * r) / 20);
          for(let i=0; i<numDashes; i++) {
             const angle = (i / numDashes) * Math.PI * 2;
             const x = s.cx + Math.cos(angle) * r;
             const y = s.cy + Math.sin(angle) * r;
             // Add spiral distortion
             const spiralAngle = angle + (r / s.r) * Math.PI;
             drawDash(x, y, spiralAngle + Math.PI/2, colors[Math.floor(Math.random() * colors.length)]);
          }
        }
      });
      
      // Fill background with horizontal-ish dashes
      for(let i=0; i<2000; i++) {
         const x = Math.random() * w;
         const y = Math.random() * h;
         drawDash(x, y, (Math.random() - 0.5) * 0.2, colors[Math.floor(Math.random() * 5)]);
      }
    };
    drawSwirls();
    return () => window.removeEventListener("resize", resize);
  }, []);
  return <canvas ref={canvasRef} className="absolute inset-0 opacity-40 mix-blend-screen" />;
}

function Vase() {
  return (
    <div className="absolute left-1/2 bottom-[10%] -translate-x-1/2 w-48 h-64 z-20"
         style={{ filter: "drop-shadow(10px 20px 15px rgba(0,0,0,0.6))" }}>
      <svg viewBox="0 0 100 150" className="w-full h-full">
         <defs>
            <linearGradient id="vase" x1="0%" y1="0%" x2="100%" y2="0%">
               <stop offset="0%" stopColor="#d97706" />
               <stop offset="30%" stopColor="#f59e0b" />
               <stop offset="80%" stopColor="#b45309" />
               <stop offset="100%" stopColor="#78350f" />
            </linearGradient>
            <filter id="rough">
              <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="3" result="noise" />
              <feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.15 0" in="noise" result="coloredNoise" />
              <feComposite operator="in" in="coloredNoise" in2="SourceGraphic" result="texture" />
              <feBlend mode="multiply" in="texture" in2="SourceGraphic" />
            </filter>
         </defs>
         <path d="M 30 10 L 70 10 C 75 10 75 15 70 20 C 65 25 60 40 85 75 C 105 105 95 140 80 145 C 65 150 35 150 20 145 C 5 140 -5 105 15 75 C 40 40 35 25 30 20 C 25 15 25 10 30 10 Z"
               fill="url(#vase)" filter="url(#rough)" stroke="#451a03" strokeWidth="2" />
         <path d="M 30 10 L 70 10" stroke="#fcd34d" strokeWidth="3" fill="none" opacity="0.6" />
         {/* Painterly highlights */}
         <path d="M 25 80 C 15 110 25 135 40 142" stroke="#fde68a" strokeWidth="4" strokeLinecap="round" fill="none" opacity="0.4" style={{filter: 'blur(1px)'}} />
      </svg>
    </div>
  );
}

function Stem({ angle, length, x, y }: { angle: number; length: number; x: number; y: number }) {
  const endX = x + Math.sin((angle * Math.PI) / 180) * length * 50;
  const endY = y - Math.cos((angle * Math.PI) / 180) * length * 50;
  return (
    <path
      d={`M ${x}% ${y}% Q ${(x + endX)/2 + 5}% ${(y + endY)/2}% ${endX}% ${endY}%`}
      stroke="#166534"
      strokeWidth="8"
      fill="none"
      strokeLinecap="round"
      style={{ filter: "drop-shadow(2px 2px 4px rgba(0,0,0,0.5))" }}
    />
  );
}

function SunflowerHead({ index, angle, length, scale, hue, reduceMotion, x, y }: any) {
  const headRef = useRef<HTMLDivElement>(null);
  
  const endX = x + Math.sin((angle * Math.PI) / 180) * length * 50;
  const endY = y - Math.cos((angle * Math.PI) / 180) * length * 50;

  useEffect(() => {
    if (!headRef.current || reduceMotion) return;
    gsap.fromTo(headRef.current, 
      { rotation: angle * 0.5 - 5 },
      { 
        rotation: angle * 0.5 + 5, 
        duration: 3 + Math.random(), 
        yoyo: true, 
        repeat: -1, 
        ease: "sine.inOut",
        delay: index * 0.2
      }
    );
  }, [reduceMotion, angle, index]);

  return (
    <div
      ref={headRef}
      className="absolute z-30"
      style={{
        left: `${endX}%`,
        top: `${endY}%`,
        transform: `translate(-50%, -50%) scale(${scale})`,
        filter: "drop-shadow(5px 10px 8px rgba(0,0,0,0.5))"
      }}
    >
      <svg width="160" height="160" viewBox="0 0 160 160">
        <defs>
          <filter id="glow">
             <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
             <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
             </feMerge>
          </filter>
        </defs>
        <g transform="translate(80, 80)">
           {/* Petals */}
           {Array.from({ length: 24 }).map((_, i) => {
              const a = (i / 24) * 360;
              const len = 35 + Math.random() * 15;
              const color = i % 3 === 0 ? "#f59e0b" : i % 2 === 0 ? "#fbbf24" : "#fcd34d";
              return (
                <path
                  key={i}
                  d={`M 0 0 Q 15 ${-len/2} 0 ${-len} Q -15 ${-len/2} 0 0`}
                  fill={color}
                  stroke="#b45309"
                  strokeWidth="1"
                  transform={`rotate(${a})`}
                  style={{ filter: "url(#glow)" }}
                />
              );
           })}
           {/* Center */}
           <circle r="22" fill="#451a03" />
           <circle r="18" fill="#78350f" />
           {/* Seeds */}
           {Array.from({ length: 40 }).map((_, i) => {
             const r = Math.random() * 16;
             const a = Math.random() * Math.PI * 2;
             return (
               <circle 
                 key={`seed-${i}`}
                 cx={Math.cos(a) * r} 
                 cy={Math.sin(a) * r} 
                 r="1.5" 
                 fill={Math.random() > 0.5 ? "#b45309" : "#fbbf24"} 
               />
             );
           })}
        </g>
      </svg>
    </div>
  );
}
