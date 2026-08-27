"use client";

import { useEffect, useRef } from "react";
import type { Flower } from "@/lib/flowers";

type Props = { flowers: Flower[]; ink: string; reduceMotion: boolean };

// Sunday — Ink Garden: Japanese sumi-e brush strokes with sakura petals
export function LineArt({ flowers: _flowers, reduceMotion }: Props) {
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
      ctx.scale(dpr, dpr);
    };
    resize();
    window.addEventListener("resize", resize);

    interface Petal {
      x: number; y: number; vx: number; vy: number; rot: number; vrot: number;
      size: number; alpha: number; hue: number; swing: number; swingSpeed: number;
    }
    const petals: Petal[] = [];
    const W = () => canvas.clientWidth;
    const H = () => canvas.clientHeight;

    for (let i = 0; i < 40; i++) {
      petals.push({
        x: Math.random() * W(), y: -20 - Math.random() * H(),
        vx: (Math.random() - 0.5) * 1.2, vy: 0.4 + Math.random() * 1.0,
        rot: Math.random() * Math.PI * 2, vrot: (Math.random() - 0.5) * 0.04,
        size: 6 + Math.random() * 10, alpha: 0.4 + Math.random() * 0.5,
        hue: 330 + Math.random() * 30, swing: Math.random() * Math.PI * 2,
        swingSpeed: 0.01 + Math.random() * 0.02,
      });
    }

    // Draw a sumi-e branch
    const drawBranch = (ctx: CanvasRenderingContext2D, x: number, y: number, angle: number, length: number, depth: number, thickness: number) => {
      if (depth <= 0 || length < 8) return;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);
      const grad = ctx.createLinearGradient(0, 0, 0, -length);
      grad.addColorStop(0, `rgba(30, 18, 9, ${0.85 - depth * 0.06})`);
      grad.addColorStop(1, `rgba(50, 30, 15, ${0.55 - depth * 0.05})`);
      ctx.strokeStyle = grad;
      ctx.lineWidth = thickness;
      ctx.lineCap = "round";
      // Slightly wobbly line for brush feel
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.bezierCurveTo(
        (Math.random() - 0.5) * 8, -length * 0.33,
        (Math.random() - 0.5) * 8, -length * 0.66,
        0, -length
      );
      ctx.stroke();
      // Child branches
      const numChildren = depth > 2 ? 3 : 2;
      for (let i = 0; i < numChildren; i++) {
        const spread = (0.3 + depth * 0.08) * (i % 2 === 0 ? 1 : -1) * (0.7 + i * 0.3);
        drawBranch(ctx, 0, -length, spread, length * (0.55 + Math.random() * 0.15), depth - 1, thickness * 0.62);
      }
      ctx.restore();
    };

    // Draw a sakura blossom at position
    const drawBlossom = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number, alpha: number) => {
      for (let i = 0; i < 5; i++) {
        const angle = (i / 5) * Math.PI * 2 - Math.PI / 2;
        const px = x + Math.cos(angle) * size * 0.55;
        const py = y + Math.sin(angle) * size * 0.55;
        ctx.save();
        ctx.translate(px, py);
        ctx.rotate(angle + Math.PI / 2);
        ctx.beginPath();
        ctx.ellipse(0, 0, size * 0.35, size * 0.5, 0, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(340, 70%, 88%, ${alpha * 0.8})`;
        ctx.fill();
        ctx.strokeStyle = `hsla(330, 55%, 72%, ${alpha * 0.5})`;
        ctx.lineWidth = 0.5;
        ctx.stroke();
        ctx.restore();
      }
      // Center
      ctx.beginPath();
      ctx.arc(x, y, size * 0.18, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(350, 80%, 70%, ${alpha * 0.9})`;
      ctx.fill();
      // Stamens
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + Math.cos(a) * size * 0.3, y + Math.sin(a) * size * 0.3);
        ctx.strokeStyle = `hsla(350, 70%, 65%, ${alpha * 0.6})`;
        ctx.lineWidth = 0.6;
        ctx.stroke();
      }
    };

    // Draw falling petal shape
    const drawPetal = (ctx: CanvasRenderingContext2D, p: Petal) => {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.beginPath();
      ctx.ellipse(0, 0, p.size * 0.4, p.size * 0.6, 0, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${p.hue}, 70%, 85%, ${p.alpha})`;
      ctx.fill();
      ctx.strokeStyle = `hsla(${p.hue - 10}, 60%, 72%, ${p.alpha * 0.5})`;
      ctx.lineWidth = 0.5;
      ctx.stroke();
      // Vein line
      ctx.beginPath();
      ctx.moveTo(0, -p.size * 0.55);
      ctx.lineTo(0, p.size * 0.55);
      ctx.strokeStyle = `hsla(${p.hue - 20}, 55%, 75%, ${p.alpha * 0.4})`;
      ctx.lineWidth = 0.4;
      ctx.stroke();
      ctx.restore();
    };

    // Static branch rendering (done once on resize, cached to offscreen)
    let branchCanvas: HTMLCanvasElement | null = null;
    const renderBranches = () => {
      const w = W(), h = H();
      branchCanvas = document.createElement("canvas");
      branchCanvas.width = canvas.width;
      branchCanvas.height = canvas.height;
      const bctx = branchCanvas.getContext("2d")!;
      bctx.scale(dpr, dpr);

      // Paper texture wash
      const paperGrad = bctx.createLinearGradient(0, 0, w, h);
      paperGrad.addColorStop(0, "#faf8f2");
      paperGrad.addColorStop(0.5, "#f5f0e8");
      paperGrad.addColorStop(1, "#ece4d4");
      bctx.fillStyle = paperGrad;
      bctx.fillRect(0, 0, w, h);

      // Subtle paper grain
      for (let i = 0; i < 800; i++) {
        const gx = Math.random() * w, gy = Math.random() * h;
        bctx.fillStyle = `rgba(120,90,60,${0.02 + Math.random() * 0.03})`;
        bctx.fillRect(gx, gy, 1 + Math.random() * 2, 1);
      }

      // Main branch — left side, reaching right
      drawBranch(bctx, w * 0.08, h * 0.75, -Math.PI * 0.35, h * 0.35, 6, 8);
      // Secondary branch — right side, reaching left
      drawBranch(bctx, w * 0.95, h * 0.85, -Math.PI * 0.72, h * 0.28, 5, 6);
      // Top branch — from above
      drawBranch(bctx, w * 0.55, 0, Math.PI * 0.5 + 0.2, h * 0.22, 4, 5);

      // Blossoms at branch tips (approximate positions)
      const blossomSpots = [
        { x: w * 0.28, y: h * 0.32, s: 18 }, { x: w * 0.45, y: h * 0.22, s: 14 },
        { x: w * 0.62, y: h * 0.35, s: 16 }, { x: w * 0.35, y: h * 0.48, s: 12 },
        { x: w * 0.72, y: h * 0.42, s: 20 }, { x: w * 0.55, y: h * 0.28, s: 15 },
        { x: w * 0.20, y: h * 0.55, s: 13 }, { x: w * 0.80, y: h * 0.55, s: 17 },
        { x: w * 0.50, y: h * 0.15, s: 12 }, { x: w * 0.15, y: h * 0.40, s: 14 },
        { x: w * 0.88, y: h * 0.68, s: 11 }, { x: w * 0.38, y: h * 0.62, s: 10 },
      ];
      blossomSpots.forEach(b => drawBlossom(bctx, b.x, b.y, b.s, 0.9));

      // Haiku-style thin line at bottom
      bctx.beginPath();
      bctx.moveTo(w * 0.15, h * 0.88);
      bctx.lineTo(w * 0.85, h * 0.88);
      bctx.strokeStyle = "rgba(30,18,9,0.15)";
      bctx.lineWidth = 0.6;
      bctx.stroke();

      // Ink drop seals (red circles) — sumi-e signature
      [[w * 0.88, h * 0.85], [w * 0.90, h * 0.80]].forEach(([sx, sy]) => {
        bctx.beginPath();
        bctx.arc(sx, sy, 8, 0, Math.PI * 2);
        bctx.fillStyle = "rgba(190, 30, 20, 0.75)";
        bctx.fill();
      });
    };
    renderBranches();
    window.addEventListener("resize", renderBranches);

    let lastT = 0;
    const tick = (now: number) => {
      animRef.current = requestAnimationFrame(tick);
      const dt = now - lastT;
      lastT = now;
      if (reduceMotion && dt < 80) return;

      const w = W(), h = H();
      ctx.clearRect(0, 0, w, h);
      if (branchCanvas) ctx.drawImage(branchCanvas, 0, 0, w, h);

      // Animate petals
      petals.forEach(p => {
        p.swing += p.swingSpeed;
        p.x += p.vx + Math.sin(p.swing) * 0.6;
        p.y += p.vy;
        p.rot += p.vrot;
        if (p.y > h + 20) {
          p.y = -20;
          p.x = Math.random() * w;
          p.alpha = 0.4 + Math.random() * 0.5;
        }
        drawPetal(ctx, p);
      });
    };
    if (!reduceMotion) animRef.current = requestAnimationFrame(tick);
    else {
      // Static render
      const w = W(), h = H();
      ctx.clearRect(0, 0, w, h);
      if (branchCanvas) ctx.drawImage(branchCanvas, 0, 0, w, h);
      petals.forEach(p => drawPetal(ctx, p));
    }

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener("resize", resize);
      window.removeEventListener("resize", renderBranches);
    };
  }, [reduceMotion]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      aria-label="Jardín de Tinta — ramas de cerezo en sumi-e con pétalos de sakura"
    />
  );
}
