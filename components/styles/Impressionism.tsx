"use client";

import { useEffect, useRef } from "react";
import type { Flower } from "@/lib/flowers";
import { useCursor } from "../Cursor";

type Props = { flowers: Flower[]; ink: string; reduceMotion: boolean };

type SunState = {
  base: Flower;
  px: number; // current px (DPR-scaled)
  py: number;
  radius: number; // current head radius (DPR-scaled), 0 while regrowing
  targetRadius: number;
  bornAt: number; // time when started growing
  exploding: boolean;
  explodedAt: number;
  petalDrops: { ang: number; spd: number; rot: number; life: number }[];
};

type Heart = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  hue: number;
  life: number; // 0..1 remaining
  rot: number;
  rotSpd: number;
};

// Friday — Impressionism sunflower field where touching a sunflower makes it
// burst into hearts. After a short pause the sunflower regrows in place.
export function Impressionism({ flowers, reduceMotion }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cursor = useCursor();
  const cursorRef = useRef(cursor);
  cursorRef.current = cursor;

  // Track previous cursor for velocity-based explode trigger
  const prevCursor = useRef({ x: 0, y: 0, t: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let w = 0;
    let h = 0;
    const resize = () => {
      canvas.width = canvas.clientWidth * dpr;
      canvas.height = canvas.clientHeight * dpr;
      w = canvas.width;
      h = canvas.height;
      // recompute pixel positions
      for (const s of suns) {
        s.px = s.base.x * w;
        s.py = s.base.y * h;
        s.targetRadius = (24 + s.base.scale * 22) * dpr;
      }
    };

    const now = () => performance.now();

    const suns: SunState[] = flowers.map((f) => ({
      base: f,
      px: 0,
      py: 0,
      radius: 0,
      targetRadius: 0,
      bornAt: now() + Math.random() * 600,
      exploding: false,
      explodedAt: 0,
      petalDrops: [],
    }));
    const hearts: Heart[] = [];

    resize();
    window.addEventListener("resize", resize);

    let raf = 0;
    let running = true;
    let lastT = now();
    const onVis = () => {
      running = !document.hidden;
      lastT = now();
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

    const drawSunflower = (s: SunState) => {
      const r = s.radius;
      if (r <= 0.5) return;
      const f = s.base;
      // stem
      for (let i = 0; i < 14; i++) {
        const t = i / 14;
        stroke(
          s.px + Math.sin(t * 2) * 3 * dpr,
          s.py + r * 0.4 + t * r * 1.6,
          Math.PI / 2,
          5 * dpr,
          1.4 * dpr,
          `hsla(95, 45%, ${28 + ((i * 5) % 12)}%, 0.9)`
        );
      }
      // a leaf
      stroke(
        s.px + 9 * dpr,
        s.py + r * 0.9,
        Math.PI / 5,
        7 * dpr,
        3 * dpr,
        `hsla(100, 50%, 38%, 0.85)`
      );
      // golden petals (two layered rings)
      const baseHue = 45 + (f.hue % 8);
      const lean = cursorRef.current.active && !reduceMotion ? -cursorRef.current.x * 0.3 : 0;
      const ringDraw = (count: number, radial: number, len: number, wide: number, light: number) => {
        for (let i = 0; i < count; i++) {
          const ang = (i / count) * Math.PI * 2 + lean;
          const px = s.px + Math.cos(ang) * radial;
          const py = s.py + Math.sin(ang) * radial - r * 0.15;
          stroke(
            px,
            py,
            ang + Math.PI / 2,
            len,
            wide,
            `hsla(${baseHue + ((i * 7) % 10) - 5}, 92%, ${light}%, 0.95)`
          );
        }
      };
      ringDraw(18, r * 0.55, 8 * dpr, 3 * dpr, 60);
      ringDraw(14, r * 0.42, 6.5 * dpr, 2.6 * dpr, 70);
      // dark core
      ctx.fillStyle = "#3a230f";
      ctx.beginPath();
      ctx.arc(s.px, s.py - r * 0.15, r * 0.32, 0, Math.PI * 2);
      ctx.fill();
      // seed dots
      for (let i = 0; i < 24; i++) {
        const ang = (i / 24) * Math.PI * 2;
        const rad = r * 0.18;
        ctx.fillStyle = `hsla(30, 40%, 25%, 0.9)`;
        ctx.beginPath();
        ctx.arc(s.px + Math.cos(ang) * rad, s.py - r * 0.15 + Math.sin(ang) * rad, 1.4 * dpr, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    const drawHeart = (hh: Heart) => {
      const sz = hh.size;
      ctx.save();
      ctx.translate(hh.x, hh.y);
      ctx.rotate(hh.rot);
      ctx.scale(sz, sz);
      ctx.globalAlpha = Math.max(0, Math.min(1, hh.life));
      ctx.fillStyle = `hsl(${hh.hue}, 85%, 60%)`;
      ctx.beginPath();
      // simple heart path (cubic curves)
      ctx.moveTo(0, 0.3);
      ctx.bezierCurveTo(0, -0.2, -1, -0.2, -1, 0.4);
      ctx.bezierCurveTo(-1, 0.9, -0.4, 1.1, 0, 1.4);
      ctx.bezierCurveTo(0.4, 1.1, 1, 0.9, 1, 0.4);
      ctx.bezierCurveTo(1, -0.2, 0, -0.2, 0, 0.3);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.6)";
      ctx.lineWidth = 0.08;
      ctx.stroke();
      ctx.restore();
    };

    const explode = (s: SunState) => {
      if (s.exploding || s.radius < s.targetRadius * 0.6) return;
      s.exploding = true;
      s.explodedAt = now();
      // spawn hearts
      const count = 14 + Math.floor(Math.random() * 8);
      for (let i = 0; i < count; i++) {
        const ang = Math.random() * Math.PI * 2;
        const speed = (60 + Math.random() * 140) * dpr;
        hearts.push({
          x: s.px,
          y: s.py - s.radius * 0.15,
          vx: Math.cos(ang) * speed,
          vy: Math.sin(ang) * speed - 80 * dpr,
          size: (6 + Math.random() * 10) * dpr,
          hue: 340 + Math.random() * 25,
          life: 1,
          rot: Math.random() * Math.PI * 2,
          rotSpd: (Math.random() - 0.5) * 4,
        });
      }
      // spawn petal drops too (golden)
      for (let i = 0; i < 10; i++) {
        s.petalDrops.push({
          ang: Math.random() * Math.PI * 2,
          spd: 60 + Math.random() * 120,
          rot: Math.random() * Math.PI,
          life: 1,
        });
      }
      // limit hearts in flight
      if (hearts.length > 250) hearts.splice(0, hearts.length - 250);
    };

    const handleClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const cx = (e.clientX - rect.left) * dpr;
      const cy = (e.clientY - rect.top) * dpr;
      // explode nearest hit
      for (const s of suns) {
        const dx = cx - s.px;
        const dy = cy - (s.py - s.radius * 0.15);
        if (dx * dx + dy * dy < s.radius * s.radius) {
          explode(s);
          return;
        }
      }
      // also spawn a small heart burst at click pos so it always feels alive
      for (let i = 0; i < 10; i++) {
        const ang = Math.random() * Math.PI * 2;
        const speed = (40 + Math.random() * 100) * dpr;
        hearts.push({
          x: cx,
          y: cy,
          vx: Math.cos(ang) * speed,
          vy: Math.sin(ang) * speed - 60 * dpr,
          size: (5 + Math.random() * 8) * dpr,
          hue: 340 + Math.random() * 25,
          life: 1,
          rot: Math.random() * Math.PI * 2,
          rotSpd: (Math.random() - 0.5) * 4,
        });
      }
    };
    canvas.addEventListener("pointerdown", handleClick);

    // hover-explode: if cursor lingers/passes through a sunflower, burst it
    let lastHoverHit = -1;
    const checkHoverExplode = (cxPx: number, cyPx: number) => {
      for (let i = 0; i < suns.length; i++) {
        const s = suns[i];
        if (s.exploding) continue;
        const dx = cxPx - s.px;
        const dy = cyPx - (s.py - s.radius * 0.15);
        if (dx * dx + dy * dy < s.radius * s.radius * 0.7) {
          if (lastHoverHit !== i) {
            lastHoverHit = i;
            explode(s);
          }
          return;
        }
      }
      lastHoverHit = -1;
    };

    const draw = () => {
      if (!running) {
        raf = 0;
        return;
      }
      const t = now();
      const dt = Math.min(0.05, (t - lastT) / 1000);
      lastT = t;

      // background haze (dusk meadow for sunflowers)
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, "#f1d8a8");
      grad.addColorStop(0.45, "#e6b97a");
      grad.addColorStop(0.75, "#a8a368");
      grad.addColorStop(1, "#5d6e3a");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // background brush strokes
      for (let i = 0; i < 1100; i++) {
        const seedX = (i * 9301 + 49297) % 233280;
        const seedY = (i * 6481 + 53711) % 233280;
        const x = (seedX / 233280) * w;
        const y = (seedY / 233280) * h;
        const isSky = y / h < 0.5;
        const hue = isSky ? 35 + ((i * 7) % 25) : 70 + ((i * 11) % 40);
        const sat = isSky ? 55 : 50;
        const light = isSky ? 78 : 50;
        stroke(
          x,
          y,
          ((i * 13) % 360) * (Math.PI / 180),
          (4 + ((i * 5) % 6)) * dpr,
          1.4 * dpr,
          `hsla(${hue}, ${sat}%, ${light}%, 0.55)`
        );
      }

      // hover detection in canvas px
      const c = cursorRef.current;
      if (c.active) {
        const cxPx = (c.x + 0.5) * w;
        const cyPx = (c.y + 0.5) * h;
        checkHoverExplode(cxPx, cyPx);
      }

      // grow / explode logic
      for (const s of suns) {
        if (!s.exploding) {
          // grow toward target
          const age = (t - s.bornAt) / 600; // 600ms grow
          s.radius = Math.max(0, Math.min(1, age)) * s.targetRadius;
        } else {
          // shrink quickly
          s.radius = Math.max(0, s.radius - dt * s.targetRadius * 6);
          if (s.radius <= 0 && t - s.explodedAt > 1800 + Math.random() * 1200) {
            // schedule respawn
            s.exploding = false;
            s.bornAt = t + 200;
            s.radius = 0;
            s.petalDrops = [];
          }
        }

        drawSunflower(s);

        // draw petal drops (golden falling pieces)
        if (s.petalDrops.length) {
          const elapsed = (t - s.explodedAt) / 1000;
          s.petalDrops = s.petalDrops.filter((p) => {
            p.life -= dt * 0.8;
            const x = s.px + Math.cos(p.ang) * p.spd * elapsed * dpr;
            const y = s.py + Math.sin(p.ang) * p.spd * elapsed * dpr * 0.4 + 200 * elapsed * elapsed * dpr;
            stroke(x, y, p.rot + elapsed * 3, 7 * dpr, 3 * dpr, `hsla(45, 92%, ${55 + ((p.spd | 0) % 15)}%, ${Math.max(0, p.life)})`);
            return p.life > 0;
          });
        }
      }

      // hearts physics
      for (let i = hearts.length - 1; i >= 0; i--) {
        const hh = hearts[i];
        hh.x += hh.vx * dt;
        hh.y += hh.vy * dt;
        hh.vy += 30 * dpr * dt; // gravity gentle
        hh.vx *= 0.99;
        hh.rot += hh.rotSpd * dt;
        hh.life -= dt * 0.55;
        if (hh.life <= 0 || hh.y > h + 40 * dpr) {
          hearts.splice(i, 1);
        } else {
          drawHeart(hh);
        }
      }

      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVis);
      canvas.removeEventListener("pointerdown", handleClick);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [flowers, reduceMotion]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full cursor-pointer"
      aria-label="Campo de girasoles que estallan en corazones al tocarlos"
    />
  );
}
