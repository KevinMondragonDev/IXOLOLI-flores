"use client";

import { useEffect, useRef, useCallback } from "react";
import type { Flower } from "@/lib/flowers";

type Props = { flowers: Flower[]; ink: string; reduceMotion: boolean };

// Wednesday — Hello Kitty Garden: Kawaii aesthetic, pink polka dots, bows, and cute flowers
export function Cartoon({ flowers, reduceMotion }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  interface Bow { x: number; y: number; s: number; vx: number; vy: number; rot: number; vrot: number; }
  interface Sparkle { x: number; y: number; r: number; phase: number; speed: number; }

  const bowsRef = useRef<Bow[]>([]);
  const sparklesRef = useRef<Sparkle[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const resize = () => {
      canvas.width = canvas.clientWidth * dpr;
      canvas.height = canvas.clientHeight * dpr;
    };
    resize();
    window.addEventListener("resize", resize);

    const W = () => canvas.width / dpr;
    const H = () => canvas.height / dpr;

    // Initialize particles
    const initParticles = () => {
      const w = W(), h = H();
      bowsRef.current = Array.from({ length: 15 }).map(() => ({
        x: Math.random() * w,
        y: Math.random() * h * 1.5 - h * 0.5,
        s: 0.3 + Math.random() * 0.4,
        vx: (Math.random() - 0.5) * 1.5,
        vy: 0.8 + Math.random() * 1.5,
        rot: Math.random() * Math.PI * 2,
        vrot: (Math.random() - 0.5) * 0.05,
      }));

      sparklesRef.current = Array.from({ length: 40 }).map(() => ({
        x: Math.random() * w,
        y: Math.random() * h,
        r: 2 + Math.random() * 4,
        phase: Math.random() * Math.PI * 2,
        speed: 0.02 + Math.random() * 0.04,
      }));
    };
    initParticles();
    window.addEventListener("resize", initParticles);

    // Draw a cute Hello Kitty bow
    const drawBow = (ctx: CanvasRenderingContext2D, bow: Bow) => {
      ctx.save();
      ctx.translate(bow.x, bow.y);
      ctx.scale(bow.s, bow.s);
      ctx.rotate(bow.rot);

      ctx.fillStyle = "#ff0000"; // Signature red
      ctx.strokeStyle = "#4a0000";
      ctx.lineWidth = 4;
      ctx.lineJoin = "round";

      // Left loop
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.bezierCurveTo(-30, -30, -40, 10, -10, 15);
      ctx.fill();
      ctx.stroke();

      // Right loop
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.bezierCurveTo(30, -30, 40, 10, 10, 15);
      ctx.fill();
      ctx.stroke();

      // Center knot
      ctx.beginPath();
      ctx.arc(0, 0, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Highlights
      ctx.fillStyle = "rgba(255,255,255,0.6)";
      ctx.beginPath();
      ctx.arc(-20, -10, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(20, -10, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(-2, -3, 2, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    };

    // Draw a cute Sanrio-style flower (rounded, bold outlines)
    const drawKawaiiFlower = (ctx: CanvasRenderingContext2D, f: Flower, index: number, t: number) => {
      const w = W(), h = H();
      const px = f.x * w;
      const py = f.y * h;
      const s = f.scale * Math.min(w, h) * 0.05;
      const sway = Math.sin(t * 0.002 + index) * 0.05; // very subtle sway

      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(f.rotation * (Math.PI / 180) + sway);

      // Shadow
      ctx.save();
      ctx.scale(1, 0.3);
      ctx.beginPath();
      ctx.arc(0, s * 4, s * 1.5, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(200, 0, 100, 0.15)";
      ctx.fill();
      ctx.restore();

      const petalColor = `hsl(${f.hue}, 80%, 85%)`;
      const petalStroke = `hsl(${f.hue}, 70%, 50%)`;

      // 5 rounded petals
      ctx.fillStyle = petalColor;
      ctx.strokeStyle = petalStroke;
      ctx.lineWidth = s * 0.15;
      ctx.lineJoin = "round";

      for (let i = 0; i < 5; i++) {
        ctx.save();
        ctx.rotate((i * Math.PI * 2) / 5);
        ctx.beginPath();
        ctx.ellipse(0, -s * 1.2, s * 0.8, s * 1.1, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      }

      // Bright yellow center
      ctx.beginPath();
      ctx.arc(0, 0, s * 0.6, 0, Math.PI * 2);
      ctx.fillStyle = "#ffde00";
      ctx.fill();
      ctx.strokeStyle = "#cc9900";
      ctx.stroke();

      // Cute face on the flower! (Kawaii style)
      ctx.fillStyle = "#331100";
      // Left eye
      ctx.beginPath();
      ctx.ellipse(-s * 0.2, -s * 0.1, s * 0.08, s * 0.12, 0, 0, Math.PI * 2);
      ctx.fill();
      // Right eye
      ctx.beginPath();
      ctx.ellipse(s * 0.2, -s * 0.1, s * 0.08, s * 0.12, 0, 0, Math.PI * 2);
      ctx.fill();
      // Little smile
      ctx.beginPath();
      ctx.arc(0, s * 0.15, s * 0.1, 0.1 * Math.PI, 0.9 * Math.PI);
      ctx.lineWidth = s * 0.08;
      ctx.strokeStyle = "#331100";
      ctx.lineCap = "round";
      ctx.stroke();

      // Blush
      ctx.fillStyle = "rgba(255, 100, 150, 0.6)";
      ctx.beginPath();
      ctx.arc(-s * 0.35, s * 0.05, s * 0.12, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(s * 0.35, s * 0.05, s * 0.12, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    };

    let lastT = 0;
    const tick = (now: number) => {
      animRef.current = requestAnimationFrame(tick);
      const dt = now - lastT;
      lastT = now;
      if (reduceMotion && dt < 80) return;

      const w = W(), h = H();
      ctx.clearRect(0, 0, w * dpr, h * dpr);
      ctx.save();
      ctx.scale(dpr, dpr);

      // Scrolling Polka Dot Background
      ctx.fillStyle = "rgba(255, 255, 255, 0.2)";
      const dotSpacing = 60;
      const offset = (now * 0.02) % dotSpacing;
      for (let x = -dotSpacing; x < w + dotSpacing; x += dotSpacing) {
        for (let y = -dotSpacing; y < h + dotSpacing; y += dotSpacing) {
          ctx.beginPath();
          ctx.arc(x + offset, y + offset, 4, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Sparkles
      sparklesRef.current.forEach(s => {
        s.phase += s.speed;
        const alpha = (Math.sin(s.phase) + 1) * 0.5;
        ctx.save();
        ctx.translate(s.x, s.y);
        ctx.scale(alpha, alpha);
        
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        // Star shape
        for (let i = 0; i < 4; i++) {
          ctx.rotate(Math.PI / 2);
          ctx.lineTo(0, -s.r * 3);
          ctx.lineTo(s.r * 0.8, -s.r * 0.8);
        }
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      });

      // Render flowers (sorted by y)
      const sortedFlowers = [...flowers].sort((a, b) => a.y - b.y);
      sortedFlowers.forEach((f, i) => drawKawaiiFlower(ctx, f, i, now));

      // Falling bows
      bowsRef.current.forEach(bow => {
        bow.x += bow.vx;
        bow.y += bow.vy;
        bow.rot += bow.vrot;

        if (bow.y > h + 50) {
          bow.y = -50;
          bow.x = Math.random() * w;
        }
        if (bow.x < -50) bow.x = w + 50;
        if (bow.x > w + 50) bow.x = -50;

        drawBow(ctx, bow);
      });

      ctx.restore();
    };
    animRef.current = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener("resize", resize);
      window.removeEventListener("resize", initParticles);
    };
  }, [flowers, reduceMotion]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      aria-label="Jardín Hello Kitty — tema kawaii con flores felices, moños rojos cayendo y destellos"
    />
  );
}
