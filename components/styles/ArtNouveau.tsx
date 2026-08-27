"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import type { Flower } from "@/lib/flowers";
import { FlowerGlyph } from "../FlowerGlyph";

type Props = { flowers: Flower[]; ink: string; reduceMotion: boolean };

// Saturday — Illuminated Manuscript: Art Nouveau style with animated gold filigree
export function ArtNouveau({ flowers, ink, reduceMotion }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || reduceMotion) return;
    
    // Animate the filigree drawing itself
    const paths = svgRef.current.querySelectorAll("path");
    gsap.fromTo(paths, 
      { strokeDasharray: 1000, strokeDashoffset: 1000 },
      { strokeDashoffset: 0, duration: 4, ease: "power2.inOut", stagger: 0.1 }
    );
  }, [reduceMotion]);

  return (
    <div 
      ref={containerRef} 
      className="absolute inset-0 overflow-hidden"
      style={{
        background: "radial-gradient(ellipse at 50% 0%, #fdf6e3 0%, #f5e6c8 40%, #e8d5a3 70%, #c8a96e 100%)"
      }}
    >
      {/* Paper texture overlay */}
      <div 
        className="absolute inset-0 opacity-20 mix-blend-multiply pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
        }}
      />

      {/* Decorative Frame */}
      <svg 
        ref={svgRef}
        className="absolute inset-0 w-full h-full pointer-events-none" 
        viewBox="0 0 100 100" 
        preserveAspectRatio="none"
      >
        <g fill="none" stroke="#b8860b" strokeWidth="0.5" opacity="0.8" strokeLinecap="round">
          {/* Top border */}
          <path d="M 5 5 L 95 5" />
          <path d="M 5 7 L 95 7" strokeWidth="0.2" />
          {/* Bottom border */}
          <path d="M 5 95 L 95 95" />
          <path d="M 5 93 L 95 93" strokeWidth="0.2" />
          {/* Left border */}
          <path d="M 5 5 L 5 95" />
          <path d="M 7 5 L 7 95" strokeWidth="0.2" />
          {/* Right border */}
          <path d="M 95 5 L 95 95" />
          <path d="M 93 5 L 93 95" strokeWidth="0.2" />

          {/* Corner ornaments (Art Nouveau style curves) */}
          <path d="M 5 20 C 15 20, 20 15, 20 5" />
          <path d="M 5 15 C 10 15, 15 10, 15 5" strokeWidth="0.2" />
          <path d="M 95 20 C 85 20, 80 15, 80 5" />
          <path d="M 95 15 C 90 15, 85 10, 85 5" strokeWidth="0.2" />
          <path d="M 5 80 C 15 80, 20 85, 20 95" />
          <path d="M 5 85 C 10 85, 15 90, 15 95" strokeWidth="0.2" />
          <path d="M 95 80 C 85 80, 80 85, 80 95" />
          <path d="M 95 85 C 90 85, 85 90, 85 95" strokeWidth="0.2" />
          
          {/* Side flourishes */}
          <path d="M 5 50 C 15 40, 15 60, 5 50" />
          <path d="M 95 50 C 85 40, 85 60, 95 50" />
        </g>
      </svg>

      {/* Flowers mapped to ornate glyphs */}
      {flowers.map((f, i) => (
        <div
          key={f.id}
          className="absolute"
          style={{
            left: `${f.x * 100}%`,
            top: `${f.y * 100}%`,
            transform: `translate(-50%, -100%) rotate(${f.rotation}deg) scale(${f.scale * 1.2})`,
            zIndex: Math.floor(f.z * 30),
            filter: "drop-shadow(2px 4px 6px rgba(0,0,0,0.2))",
          }}
        >
          <div className="hover:scale-110 transition-transform duration-500 ease-out" style={{ transformOrigin: "50% 100%" }}>
             <FlowerGlyph flower={f} mode="ornate" ink={ink} />
          </div>
        </div>
      ))}
    </div>
  );
}
