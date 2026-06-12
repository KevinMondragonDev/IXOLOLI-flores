"use client";

import { useEffect, useRef } from "react";
import type { Flower } from "@/lib/flowers";
import { useCursor } from "../Cursor";

type Props = { flowers: Flower[]; ink: string; reduceMotion: boolean };

// Renders the field as thousands of colored dots (Seurat / Signac).
export function Pointillism({ flowers, reduceMotion }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cursor = useCursor();
  const cursorRef = useRef(cursor);
  cursorRef.current = cursor;

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

    let raf = 0;
    let running = true;
    const onVis = () => {
      running = !document.hidden;
      if (running && !raf) raf = requestAnimationFrame(draw);
    };
    document.addEventListener("visibilitychange", onVis);

    const draw = () => {
      if (!running) {
        raf = 0;
        return;
      }
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      const cx = cursorRef.current.x;
      const cy = cursorRef.current.y;
      const active = cursorRef.current.active;

      // background dots (sky/grass)
      for (let i = 0; i < 1500; i++) {
        const x = (i * 9301 + 49297) % 233280;
        const y = (i * 6481 + 53711) % 233280;
        const px = (x / 233280) * w;
        const py = (y / 233280) * h;
        const isSky = py / h < 0.55;
        const hue = isSky ? 200 + ((i * 7) % 30) : 80 + ((i * 11) % 40);
        ctx.fillStyle = `hsla(${hue}, 50%, ${isSky ? 80 : 55}%, 0.6)`;
        ctx.beginPath();
        ctx.arc(px, py, 2 * dpr, 0, Math.PI * 2);
        ctx.fill();
      }

      // flowers
      for (const f of flowers) {
        const lean = active && !reduceMotion ? -cx * 28 : 0;
        const px = f.x * w + (active && !reduceMotion ? cx * f.z * 18 * dpr : 0);
        const py = f.y * h + (active && !reduceMotion ? cy * f.z * 10 * dpr : 0);
        drawDottedFlower(ctx, px, py, f, dpr, lean);
      }

      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVis);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [flowers, reduceMotion]);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />;
}

function drawDottedFlower(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  f: Flower,
  dpr: number,
  leanDeg: number
) {
  const r = (28 + f.scale * 18) * dpr;
  const dotSize = 2.2 * dpr;
  // stem
  for (let i = 0; i < 30; i++) {
    const t = i / 30;
    const sx = cx + Math.sin(t * 2) * 4 * dpr;
    const sy = cy + r * 0.7 + t * r * 1.3;
    ctx.fillStyle = `hsla(${(f.hue + 90) % 360}, 45%, ${30 + ((i * 7) % 15)}%, 0.85)`;
    ctx.beginPath();
    ctx.arc(sx, sy, dotSize, 0, Math.PI * 2);
    ctx.fill();
  }
  // head: dotted ring(s)
  const lean = (leanDeg * Math.PI) / 180;
  const dotCount = Math.floor(140 * f.scale + 60);
  for (let i = 0; i < dotCount; i++) {
    const ang = (i / dotCount) * Math.PI * 2 + lean;
    const rad = r * (0.4 + Math.random() * 0.7);
    const px = cx + Math.cos(ang) * rad;
    const py = cy + Math.sin(ang) * rad - r * 0.3;
    const hueJitter = (i % 20) - 10;
    const l = 50 + ((i * 13) % 25);
    ctx.fillStyle = `hsla(${f.hue + hueJitter}, 75%, ${l}%, 0.9)`;
    ctx.beginPath();
    ctx.arc(px, py, dotSize, 0, Math.PI * 2);
    ctx.fill();
  }
  // center
  for (let i = 0; i < 30; i++) {
    const ang = Math.random() * Math.PI * 2;
    const rad = Math.random() * r * 0.2;
    ctx.fillStyle = `hsla(${(f.hue + 35) % 360}, 80%, 50%, 0.95)`;
    ctx.beginPath();
    ctx.arc(cx + Math.cos(ang) * rad, cy + Math.sin(ang) * rad - r * 0.3, dotSize, 0, Math.PI * 2);
    ctx.fill();
  }
}
