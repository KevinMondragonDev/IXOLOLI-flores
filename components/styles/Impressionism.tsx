"use client";

import { useEffect, useRef } from "react";
import type { Flower } from "@/lib/flowers";
import { useCursor } from "../Cursor";

type Props = { flowers: Flower[]; ink: string; reduceMotion: boolean };

// Renders the field as short brush strokes (Monet-like).
export function Impressionism({ flowers, reduceMotion }: Props) {
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

    const stroke = (
      x: number,
      y: number,
      ang: number,
      len: number,
      width: number,
      color: string
    ) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(ang);
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.ellipse(0, 0, len, width, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    };

    const draw = () => {
      if (!running) {
        raf = 0;
        return;
      }
      const w = canvas.width;
      const h = canvas.height;
      const cx = cursorRef.current.x;
      const cy = cursorRef.current.y;
      const active = cursorRef.current.active;

      // background haze
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, "#d8e7f0");
      grad.addColorStop(0.55, "#c9dcc4");
      grad.addColorStop(1, "#8aae9b");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // background brush strokes
      for (let i = 0; i < 1200; i++) {
        const seedX = (i * 9301 + 49297) % 233280;
        const seedY = (i * 6481 + 53711) % 233280;
        const x = (seedX / 233280) * w;
        const y = (seedY / 233280) * h;
        const isSky = y / h < 0.55;
        const hue = isSky ? 200 + ((i * 7) % 40) : 80 + ((i * 11) % 50);
        const sat = isSky ? 30 : 45;
        const light = isSky ? 75 : 50;
        stroke(
          x,
          y,
          ((i * 13) % 360) * (Math.PI / 180),
          (4 + ((i * 5) % 6)) * dpr,
          1.4 * dpr,
          `hsla(${hue}, ${sat}%, ${light}%, 0.6)`
        );
      }

      // flowers as cluster of short strokes
      for (const f of flowers) {
        const px = f.x * w + (active && !reduceMotion ? cx * f.z * 18 * dpr : 0);
        const py = f.y * h + (active && !reduceMotion ? cy * f.z * 10 * dpr : 0);
        const r = (24 + f.scale * 18) * dpr;
        // stem
        for (let i = 0; i < 18; i++) {
          const t = i / 18;
          stroke(
            px + Math.sin(t * 2) * 3 * dpr,
            py + r * 0.6 + t * r * 1.4,
            Math.PI / 2 + (Math.random() - 0.5) * 0.2,
            5 * dpr,
            1.3 * dpr,
            `hsla(${(f.hue + 90) % 360}, 45%, ${30 + ((i * 5) % 12)}%, 0.85)`
          );
        }
        // petals
        const lean = active && !reduceMotion ? -cx * 0.5 : 0;
        const count = Math.floor(80 * f.scale + 30);
        for (let i = 0; i < count; i++) {
          const ang = (i / count) * Math.PI * 2 + lean;
          const rad = r * (0.45 + Math.random() * 0.55);
          const sx = px + Math.cos(ang) * rad;
          const sy = py + Math.sin(ang) * rad - r * 0.3;
          const l = 55 + Math.random() * 25;
          stroke(
            sx,
            sy,
            ang + Math.PI / 2,
            5 * dpr,
            1.6 * dpr,
            `hsla(${f.hue + (Math.random() * 20 - 10)}, 75%, ${l}%, 0.9)`
          );
        }
        // center
        for (let i = 0; i < 12; i++) {
          stroke(
            px + (Math.random() - 0.5) * r * 0.3,
            py - r * 0.3 + (Math.random() - 0.5) * r * 0.2,
            Math.random() * Math.PI,
            3 * dpr,
            2 * dpr,
            `hsla(${(f.hue + 40) % 360}, 85%, 55%, 0.95)`
          );
        }
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
