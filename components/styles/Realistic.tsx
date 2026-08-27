"use client";

import { useEffect, useRef } from "react";
import type { Flower } from "@/lib/flowers";

type Props = { flowers: Flower[]; ink: string; reduceMotion: boolean };

// Thursday — Lantern Garden: Chinese romantic theme (Qixi festival / Mid-Autumn)
// Features floating lanterns, a full moon, bamboo silhouettes, and glowing lotus flowers
export function Realistic({ flowers, reduceMotion }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

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

    interface Lantern { x: number; y: number; s: number; vx: number; vy: number; phase: number; }
    interface Particle { x: number; y: number; r: number; vx: number; vy: number; alpha: number; }

    const lanterns: Lantern[] = [];
    const particles: Particle[] = [];

    const initScene = () => {
      lanterns.length = 0;
      particles.length = 0;
      const w = W(), h = H();
      
      // Floating lanterns
      for (let i = 0; i < 25; i++) {
        lanterns.push({
          x: Math.random() * w,
          y: Math.random() * h * 1.5,
          s: 0.3 + Math.random() * 0.7,
          vx: (Math.random() - 0.5) * 0.2,
          vy: -0.2 - Math.random() * 0.6,
          phase: Math.random() * Math.PI * 2,
        });
      }

      // Fireflies / light particles
      for (let i = 0; i < 60; i++) {
        particles.push({
          x: Math.random() * w,
          y: Math.random() * h,
          r: 1 + Math.random() * 2,
          vx: (Math.random() - 0.5) * 0.5,
          vy: (Math.random() - 0.5) * 0.5 - 0.2,
          alpha: Math.random(),
        });
      }
    };
    initScene();
    window.addEventListener("resize", initScene);

    const drawMoon = (ctx: CanvasRenderingContext2D) => {
      const w = W(), h = H();
      const mx = w * 0.8;
      const my = h * 0.25;
      const mr = Math.min(w, h) * 0.15;

      ctx.save();
      // Moon glow
      const glow = ctx.createRadialGradient(mx, my, mr * 0.8, mx, my, mr * 3);
      glow.addColorStop(0, "rgba(255, 235, 180, 0.4)");
      glow.addColorStop(0.5, "rgba(255, 210, 120, 0.1)");
      glow.addColorStop(1, "rgba(255, 180, 80, 0)");
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, w, h);

      // Moon body
      ctx.beginPath();
      ctx.arc(mx, my, mr, 0, Math.PI * 2);
      ctx.fillStyle = "#fff4d4";
      ctx.fill();
      
      // Subtle craters (using low opacity overlays)
      ctx.beginPath();
      ctx.arc(mx - mr * 0.2, my + mr * 0.2, mr * 0.4, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(0,0,0,0.03)";
      ctx.fill();
      ctx.beginPath();
      ctx.arc(mx + mr * 0.3, my - mr * 0.1, mr * 0.25, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(0,0,0,0.02)";
      ctx.fill();

      ctx.restore();
    };

    const drawLantern = (ctx: CanvasRenderingContext2D, l: Lantern, t: number) => {
      const sway = Math.sin(t * 0.001 + l.phase) * 5 * l.s;
      ctx.save();
      ctx.translate(l.x + sway, l.y);
      ctx.scale(l.s, l.s);

      // Lantern glow
      const lg = ctx.createRadialGradient(0, 0, 0, 0, 0, 40);
      lg.addColorStop(0, "rgba(255, 150, 50, 0.6)");
      lg.addColorStop(1, "rgba(255, 50, 0, 0)");
      ctx.fillStyle = lg;
      ctx.beginPath();
      ctx.arc(0, 0, 40, 0, Math.PI * 2);
      ctx.fill();

      // Paper body
      const grad = ctx.createLinearGradient(-12, 0, 12, 0);
      grad.addColorStop(0, "#c62828");
      grad.addColorStop(0.5, "#ef5350");
      grad.addColorStop(1, "#b71c1c");
      
      ctx.beginPath();
      ctx.moveTo(-10, -15);
      ctx.quadraticCurveTo(-15, 0, -10, 15);
      ctx.lineTo(10, 15);
      ctx.quadraticCurveTo(15, 0, 10, -15);
      ctx.closePath();
      ctx.fillStyle = grad;
      ctx.fill();

      // Top and bottom wooden rims
      ctx.fillStyle = "#3e2723";
      ctx.fillRect(-8, -17, 16, 2);
      ctx.fillRect(-8, 15, 16, 2);

      // Tassel
      ctx.beginPath();
      ctx.moveTo(0, 17);
      ctx.lineTo(0, 22);
      ctx.strokeStyle = "#ffb300";
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, 22);
      ctx.lineTo(-4, 32);
      ctx.moveTo(0, 22);
      ctx.lineTo(0, 34);
      ctx.moveTo(0, 22);
      ctx.lineTo(4, 32);
      ctx.strokeStyle = "#d84315";
      ctx.stroke();

      // Ribs
      ctx.beginPath();
      ctx.moveTo(-4, -15);
      ctx.quadraticCurveTo(-6, 0, -4, 15);
      ctx.moveTo(4, -15);
      ctx.quadraticCurveTo(6, 0, 4, 15);
      ctx.moveTo(0, -15);
      ctx.lineTo(0, 15);
      ctx.strokeStyle = "rgba(0,0,0,0.15)";
      ctx.stroke();

      ctx.restore();
    };

    const drawBamboo = (ctx: CanvasRenderingContext2D, t: number) => {
      const w = W(), h = H();
      ctx.save();
      // Silhouettes of bamboo leaves on the left and right
      ctx.fillStyle = "#150202"; // very dark crimson/black
      
      const drawLeaf = (x: number, y: number, angle: number, scale: number) => {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angle + Math.sin(t * 0.0005 + x) * 0.05);
        ctx.scale(scale, scale);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(20, -10, 40, 0);
        ctx.quadraticCurveTo(20, 10, 0, 0);
        ctx.fill();
        ctx.restore();
      };

      // Left branch
      ctx.beginPath();
      ctx.moveTo(-10, h * 0.2);
      ctx.quadraticCurveTo(w * 0.1, h * 0.15, w * 0.2, h * 0.05);
      ctx.lineWidth = 4;
      ctx.strokeStyle = "#150202";
      ctx.stroke();
      
      drawLeaf(w * 0.05, h * 0.18, -Math.PI * 0.1, 1.2);
      drawLeaf(w * 0.12, h * 0.12, 0, 1.0);
      drawLeaf(w * 0.18, h * 0.08, Math.PI * 0.1, 0.8);

      // Right branch
      ctx.beginPath();
      ctx.moveTo(w + 10, h * 0.4);
      ctx.quadraticCurveTo(w * 0.85, h * 0.3, w * 0.8, h * 0.2);
      ctx.stroke();

      drawLeaf(w * 0.9, h * 0.35, Math.PI, 1.5);
      drawLeaf(w * 0.85, h * 0.28, Math.PI * 1.1, 1.1);
      drawLeaf(w * 0.82, h * 0.22, Math.PI * 1.2, 0.9);

      ctx.restore();
    };

    const drawLotus = (ctx: CanvasRenderingContext2D, f: Flower, t: number, index: number) => {
      const w = W(), h = H();
      const px = f.x * w;
      // Map flowers to the bottom area (like a dark lake/pond)
      const py = h * 0.75 + (f.y * h * 0.25); 
      const s = f.scale * Math.min(w, h) * 0.06;
      const sway = Math.sin(t * 0.001 + index) * 2;

      ctx.save();
      ctx.translate(px, py);

      // Water ripple shadow
      ctx.save();
      ctx.scale(1, 0.2);
      ctx.beginPath();
      ctx.arc(0, 0, s * 1.5, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 100, 100, ${0.1 + Math.sin(t * 0.002 + index) * 0.05})`;
      ctx.fill();
      ctx.beginPath();
      ctx.arc(0, 0, s * 2.5, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(255, 200, 200, ${0.05 + Math.sin(t * 0.001 + index) * 0.05})`;
      ctx.stroke();
      ctx.restore();

      ctx.rotate((sway * Math.PI) / 180);

      // Glowing aura
      const aura = ctx.createRadialGradient(0, -s*0.5, 0, 0, -s*0.5, s*1.2);
      aura.addColorStop(0, "rgba(255, 50, 100, 0.3)");
      aura.addColorStop(1, "rgba(255, 0, 50, 0)");
      ctx.fillStyle = aura;
      ctx.beginPath();
      ctx.arc(0, -s*0.5, s*1.2, 0, Math.PI * 2);
      ctx.fill();

      // Lotus petals
      const hue = f.hue % 40 + 330; // map hue to pinks/reds/magentas
      for (let i = 0; i < 8; i++) {
        const pa = (i / 8) * Math.PI; // semi-circle
        ctx.save();
        // Fan out from -PI/2
        ctx.rotate(-Math.PI / 2 + pa - Math.PI / 2 + Math.PI/8);
        const pg = ctx.createLinearGradient(0, 0, 0, -s * 1.2);
        pg.addColorStop(0, `hsl(${hue}, 90%, 85%)`);
        pg.addColorStop(1, `hsl(${hue - 15}, 85%, 60%)`);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(-s * 0.4, -s * 0.6, 0, -s * 1.2);
        ctx.quadraticCurveTo(s * 0.4, -s * 0.6, 0, 0);
        ctx.fillStyle = pg;
        ctx.fill();
        ctx.strokeStyle = `hsl(${hue}, 100%, 90%)`;
        ctx.lineWidth = 0.5;
        ctx.stroke();
        ctx.restore();
      }

      // Center light
      ctx.beginPath();
      ctx.arc(0, -s*0.2, s*0.15, 0, Math.PI*2);
      ctx.fillStyle = "#fffacd";
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

      drawMoon(ctx);

      // Water reflection at the bottom
      const water = ctx.createLinearGradient(0, h * 0.7, 0, h);
      water.addColorStop(0, "rgba(20, 2, 2, 0)");
      water.addColorStop(0.2, "rgba(40, 5, 5, 0.4)");
      water.addColorStop(1, "rgba(10, 0, 0, 0.8)");
      ctx.fillStyle = water;
      ctx.fillRect(0, h * 0.7, w, h * 0.3);

      drawBamboo(ctx, now);

      // Light particles
      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.alpha += (Math.random() - 0.5) * 0.1;
        p.alpha = Math.max(0, Math.min(1, p.alpha));
        if (p.x < 0) p.x = w;
        if (p.x > w) p.x = 0;
        if (p.y < 0) p.y = h;
        
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 200, 100, ${p.alpha * 0.8})`;
        ctx.fill();
      });

      // Lanterns
      lanterns.forEach(l => {
        l.x += l.vx;
        l.y += l.vy;
        if (l.y < -50) {
          l.y = h + 50;
          l.x = Math.random() * w;
        }
        drawLantern(ctx, l, now);
      });

      // Lotus flowers (sort by y to render correctly in perspective)
      const sortedFlowers = [...flowers].sort((a, b) => a.y - b.y);
      sortedFlowers.forEach((f, i) => drawLotus(ctx, f, now, i));

      ctx.restore();
    };
    animRef.current = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener("resize", resize);
      window.removeEventListener("resize", initScene);
    };
  }, [flowers, reduceMotion]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      aria-label="Jardín de Linternas — noche romántica con linternas chinas y lotos iluminados"
    />
  );
}
