"use client";

import { useEffect, useRef } from "react";
import { Application, Container, Graphics, BlurFilter } from "pixi.js";
import type { Flower } from "@/lib/flowers";
import { useCursor } from "../Cursor";

type Props = { flowers: Flower[]; ink: string; reduceMotion: boolean };

// Tuesday — Pointillism with PixiJS (WebGL). Thousands of dots, mouse attracts
// a soft swirl over the field.
export function Pointillism({ flowers, reduceMotion }: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const cursor = useCursor();
  const cursorRef = useRef(cursor);
  cursorRef.current = cursor;

  useEffect(() => {
    let cleanup = () => {};
    let cancelled = false;

    (async () => {
      const host = hostRef.current;
      if (!host) return;
      const app = new Application();
      await app.init({
        background: 0xeed7a8,
        antialias: true,
        autoDensity: true,
        resolution: Math.min(window.devicePixelRatio || 1, 2),
        resizeTo: host,
      });
      if (cancelled) {
        app.destroy(true);
        return;
      }
      host.appendChild(app.canvas);

      const w = () => app.renderer.width;
      const h = () => app.renderer.height;

      // Background dot field (sky + grass)
      const bg = new Graphics();
      app.stage.addChild(bg);
      const drawBackground = () => {
        bg.clear();
        const W = w();
        const H = h();
        for (let i = 0; i < 1800; i++) {
          const x = (((i * 9301 + 49297) % 233280) / 233280) * W;
          const y = (((i * 6481 + 53711) % 233280) / 233280) * H;
          const isSky = y / H < 0.55;
          const hue = isSky ? 200 + ((i * 7) % 30) : 80 + ((i * 11) % 40);
          const l = isSky ? 80 : 55;
          const color = hslToHex(hue, 50, l);
          bg.circle(x, y, 2).fill({ color, alpha: 0.7 });
        }
      };

      // Flower containers
      const flowerLayer = new Container();
      app.stage.addChild(flowerLayer);
      const blur = new BlurFilter({ strength: 0.6 });
      flowerLayer.filters = [blur];

      type FlowerNode = {
        g: Graphics;
        base: Flower;
        baseX: number;
        baseY: number;
      };
      const nodes: FlowerNode[] = [];

      const drawFlower = (g: Graphics, f: Flower, scaleR: number) => {
        g.clear();
        const r = (24 + f.scale * 22) * scaleR;
        // stem
        for (let i = 0; i < 30; i++) {
          const t = i / 30;
          const sx = Math.sin(t * 2) * 4;
          const sy = r * 0.7 + t * r * 1.3;
          g.circle(sx, sy, 2).fill({
            color: hslToHex((f.hue + 90) % 360, 45, 30 + ((i * 7) % 15)),
            alpha: 0.85,
          });
        }
        // head dots
        const dotCount = Math.floor(180 * f.scale + 80);
        for (let i = 0; i < dotCount; i++) {
          const ang = (i / dotCount) * Math.PI * 2;
          const rad = r * (0.4 + ((i * 31) % 100) / 140);
          const px = Math.cos(ang) * rad;
          const py = Math.sin(ang) * rad - r * 0.3;
          const hueJ = (i % 20) - 10;
          const l = 50 + ((i * 13) % 25);
          g.circle(px, py, 2).fill({
            color: hslToHex(f.hue + hueJ, 75, l),
            alpha: 0.95,
          });
        }
        // center
        for (let i = 0; i < 30; i++) {
          const ang = (i / 30) * Math.PI * 2;
          const rad = (((i * 13) % 100) / 100) * r * 0.2;
          g.circle(Math.cos(ang) * rad, Math.sin(ang) * rad - r * 0.3, 2.4).fill({
            color: hslToHex((f.hue + 35) % 360, 80, 50),
          });
        }
      };

      const buildFlowers = () => {
        flowerLayer.removeChildren();
        nodes.length = 0;
        for (const f of flowers) {
          const g = new Graphics();
          drawFlower(g, f, 1);
          g.x = f.x * w();
          g.y = f.y * h();
          flowerLayer.addChild(g);
          nodes.push({ g, base: f, baseX: g.x, baseY: g.y });
        }
      };

      drawBackground();
      buildFlowers();

      app.renderer.on("resize", () => {
        drawBackground();
        for (const n of nodes) {
          n.baseX = n.base.x * w();
          n.baseY = n.base.y * h();
          n.g.x = n.baseX;
          n.g.y = n.baseY;
        }
      });

      let raf = 0;
      const tick = () => {
        const c = cursorRef.current;
        const W = w();
        const H = h();
        if (!reduceMotion) {
          const cx = (c.x + 0.5) * W;
          const cy = (c.y + 0.5) * H;
          for (const n of nodes) {
            const dx = cx - n.baseX;
            const dy = cy - n.baseY;
            const d = Math.sqrt(dx * dx + dy * dy);
            const fall = Math.max(0, 1 - d / 280);
            const lean = -((cx - n.baseX) / W) * 30 * fall;
            const tx = c.active ? c.x * n.base.z * 22 : 0;
            const ty = c.active ? c.y * n.base.z * 14 : 0;
            n.g.x = n.baseX + tx;
            n.g.y = n.baseY + ty;
            n.g.rotation = (lean * Math.PI) / 180;
            n.g.scale.set(1 + 0.12 * fall);
          }
        }
        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);

      // click bursts a new flower at the spot
      app.canvas.addEventListener("pointerdown", (e: PointerEvent) => {
        const rect = (app.canvas as HTMLCanvasElement).getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const fake: Flower = {
          id: Date.now(),
          x: x / w(),
          y: y / h(),
          scale: 0.8,
          rotation: 0,
          hue: Math.floor(Math.random() * 360),
          species: "daisy",
          z: 0.9,
        };
        const g = new Graphics();
        drawFlower(g, fake, 0.2);
        g.x = x;
        g.y = y;
        flowerLayer.addChild(g);
        const node: FlowerNode = { g, base: fake, baseX: x, baseY: y };
        nodes.push(node);
        // grow tween
        const start = performance.now();
        const grow = () => {
          const t = Math.min(1, (performance.now() - start) / 600);
          drawFlower(g, fake, 0.2 + t * 0.8);
          if (t < 1) requestAnimationFrame(grow);
        };
        grow();
      });

      cleanup = () => {
        cancelAnimationFrame(raf);
        try {
          app.destroy(true, { children: true, texture: true });
        } catch {}
      };
    })();

    return () => {
      cancelled = true;
      cleanup();
    };
  }, [flowers, reduceMotion]);

  return (
    <div
      ref={hostRef}
      className="absolute inset-0 w-full h-full"
      aria-label="Campo de flores en puntillismo"
    />
  );
}

function hslToHex(h: number, s: number, l: number): number {
  s /= 100;
  l /= 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  const r = Math.round(255 * f(0));
  const g = Math.round(255 * f(8));
  const b = Math.round(255 * f(4));
  return (r << 16) | (g << 8) | b;
}
