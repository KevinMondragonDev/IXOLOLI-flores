"use client";

import { useEffect, useRef } from "react";
import { Application, Container, Graphics } from "pixi.js";
import type { Flower } from "@/lib/flowers";

type Props = { flowers: Flower[]; ink: string; reduceMotion: boolean };

// Tuesday — Pointillism. A single large central flower (rose) constructed from
// thousands of dots, surrounded by a dot-painted forest in 3 depth planes.
// The user can drag to paint additional dots using a Seurat-inspired palette.
export function Pointillism({ flowers: _flowers, reduceMotion }: Props) {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cleanup = () => {};
    let cancelled = false;

    (async () => {
      const host = hostRef.current;
      if (!host) return;
      const app = new Application();
      await app.init({
        background: 0xffe6cc,
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

      const baseLayer = new Container();
      const paintLayer = new Container();
      const hudLayer = new Container();
      app.stage.addChild(baseLayer);
      app.stage.addChild(paintLayer);
      app.stage.addChild(hudLayer);

      // Seurat-inspired palette (14 colors for optical mixing)
      const PALETTE = [
        0x6a1a4a, // deep violet
        0x8a2a5a, // medium violet
        0xaa3a6a, // light violet
        0xca4a7a, // pink violet
        0xea5a8a, // bright pink
        0xff6a9a, // hot pink
        0xff8aaa, // pale pink
        0xffaaba, // very pale pink
        0xffd4c8, // warm white
        0xffe8d8, // cream
        0xffc8a8, // peach
        0xffa888, // apricot
        0xff8868, // salmon
        0xff6848, // coral
      ];

      const pickColor = (i: number) => PALETTE[i % PALETTE.length];

      const W = () => app.renderer.width;
      const H = () => app.renderer.height;

      // ---- Build background forest (dot-painted) ----
      const buildForest = () => {
        baseLayer.removeChildren();
        const w = W();
        const h = H();
        const horizon = h * 0.62;

        // Sky gradient dots (sunset)
        for (let i = 0; i < 4000; i++) {
          const x = Math.random() * w;
          const y = Math.random() * horizon;
          const t = y / horizon;
          const hue = 320 + t * 40; // pink to orange
          const sat = 60 + (1 - t) * 20;
          const light = 70 + t * 15;
          const dot = new Graphics();
          dot.circle(x, y, 1.5 + Math.random() * 1.5).fill({
            color: { h: hue, s: sat, l: light },
            alpha: 0.85,
          });
          baseLayer.addChild(dot);
        }

        // Forest in 3 depth planes
        const plane = (depth: number, baseY: number, density: number, colorBase: number, scale: number) => {
          for (let i = 0; i < density; i++) {
            const x = Math.random() * w;
            const y = baseY + Math.random() * (h - baseY);
            const treeH = 80 + Math.random() * 120;
            const treeW = treeH * 0.3;
            // Trunk (brown dots)
            for (let j = 0; j < 12; j++) {
              const tx = x + (Math.random() - 0.5) * treeW * 0.2;
              const ty = y - j * (treeH / 12);
              const dot = new Graphics();
              dot.circle(tx, ty, 1.5 * scale).fill({ color: 0x5a3a1a, alpha: 0.9 });
              baseLayer.addChild(dot);
            }
            // Foliage (color dots in a rough tree shape)
            for (let j = 0; j < 40; j++) {
              const fx = x + (Math.random() - 0.5) * treeW;
              const fy = y - treeH * 0.6 - Math.random() * treeH * 0.5;
              const dot = new Graphics();
              dot.circle(fx, fy, 2 * scale).fill({
                color: colorBase + Math.floor(Math.random() * 0x101010),
                alpha: 0.85,
              });
              baseLayer.addChild(dot);
            }
          }
        };

        // Far plane (lighter, smaller)
        plane(1, horizon * 0.7, 25, 0x4a8a4a, 0.6);
        // Mid plane
        plane(2, horizon * 0.85, 18, 0x3a6a3a, 0.8);
        // Near plane (darker, larger)
        plane(3, horizon, 12, 0x2a4a2a, 1.0);

        // Ground dots
        for (let i = 0; i < 2000; i++) {
          const x = Math.random() * w;
          const y = horizon + Math.random() * (h - horizon);
          const dot = new Graphics();
          dot.circle(x, y, 1.2 + Math.random() * 1).fill({
            color: 0x6a8a4a + Math.floor(Math.random() * 0x101010),
            alpha: 0.9,
          });
          baseLayer.addChild(dot);
        }
      };

      // ---- Central flower (rose) made of dots ----
      const buildFlower = () => {
        const w = W();
        const h = H();
        const cx = w / 2;
        const cy = h * 0.55;
        const r = Math.min(w, h) * 0.18;

        // Stem (green dots)
        for (let i = 0; i < 80; i++) {
          const t = i / 80;
          const sx = cx + (Math.random() - 0.5) * 8;
          const sy = cy + r * 1.5 + t * (h * 0.25);
          const dot = new Graphics();
          dot.circle(sx, sy, 2).fill({ color: 0x3a6a3a, alpha: 0.9 });
          baseLayer.addChild(dot);
        }

        // Leaves (green dots)
        const leaf = (side: 1 | -1, yOff: number) => {
          for (let i = 0; i < 40; i++) {
            const t = Math.random();
            const lx = cx + side * (t * 40 + 10);
            const ly = cy + r * 0.8 + yOff + (Math.random() - 0.5) * 15;
            const dot = new Graphics();
            dot.circle(lx, ly, 2.5).fill({ color: 0x4a8a4a, alpha: 0.9 });
            baseLayer.addChild(dot);
          }
        };
        leaf(1, 20);
        leaf(-1, 35);

        // Rose head: concentric layers of dots in petal shapes
        const layers = 8;
        for (let layer = 0; layer < layers; layer++) {
          const layerR = r * (1 - layer * 0.1);
          const dotsInLayer = 60 + layer * 15;
          for (let i = 0; i < dotsInLayer; i++) {
            const ang = (i / dotsInLayer) * Math.PI * 2;
            // Petal shape modulation
            const petalMod = 1 + 0.3 * Math.sin(ang * 3);
            const rad = layerR * petalMod;
            const px = cx + Math.cos(ang) * rad;
            const py = cy + Math.sin(ang) * rad;
            const dot = new Graphics();
            // Color gradient from center (pale) to edge (deep pink)
            const hue = 340 + layer * 4;
            const sat = 70 + layer * 3;
            const light = 75 - layer * 4;
            dot.circle(px, py, 2.5 + Math.random() * 1).fill({
              color: { h: hue, s: sat, l: light },
              alpha: 0.95,
            });
            baseLayer.addChild(dot);
          }
        }

        // Center dots (yellow)
        for (let i = 0; i < 30; i++) {
          const a = Math.random() * Math.PI * 2;
          const rd = Math.random() * r * 0.15;
          const dot = new Graphics();
          dot.circle(cx + Math.cos(a) * rd, cy + Math.sin(a) * rd, 2).fill({
            color: 0xffd84a,
            alpha: 0.95,
          });
          baseLayer.addChild(dot);
        }
      };

      buildForest();
      buildFlower();

      // ---- Cursor brush preview ----
      const brushPreview = new Graphics();
      brushPreview.circle(0, 0, 12).stroke({ color: 0x6a1a4a, width: 1.5, alpha: 0.7 });
      brushPreview.circle(0, 0, 3).fill({ color: 0x6a1a4a, alpha: 0.6 });
      brushPreview.visible = false;
      hudLayer.addChild(brushPreview);

      // ---- User painting ----
      let painting = false;
      let lastX = 0;
      let lastY = 0;
      let lastT = 0;
      let strokeIndex = 0;

      const stamp = (x: number, y: number, vx: number, vy: number) => {
        const speed = Math.hypot(vx, vy);
        const n = Math.min(6, 2 + Math.floor(speed * 0.4));
        for (let i = 0; i < n; i++) {
          const jx = x + (Math.random() - 0.5) * 12;
          const jy = y + (Math.random() - 0.5) * 12;
          const col = pickColor(strokeIndex + i + Math.floor(speed));
          const dot = new Graphics();
          dot.circle(jx, jy, 2 + Math.random() * 1.5).fill({
            color: col,
            alpha: 0.92,
          });
          paintLayer.addChild(dot);
        }
        strokeIndex += n;
        if (paintLayer.children.length > 3000) {
          paintLayer.removeChildAt(0);
        }
      };

      const isOverProtected = (clientX: number, clientY: number) => {
        const el = document.elementFromPoint(clientX, clientY) as HTMLElement | null;
        return !!el?.closest("[data-no-paint]");
      };

      const onPointerMove = (e: PointerEvent) => {
        const rect = (app.canvas as HTMLCanvasElement).getBoundingClientRect();
        const dpr = app.renderer.resolution;
        const x = (e.clientX - rect.left) * dpr;
        const y = (e.clientY - rect.top) * dpr;
        if (isOverProtected(e.clientX, e.clientY)) {
          brushPreview.visible = false;
          return;
        }
        brushPreview.visible = true;
        brushPreview.x = x;
        brushPreview.y = y;
        if (painting) {
          const t = performance.now();
          const dt = Math.max(1, t - lastT);
          const vx = (x - lastX) / dt;
          const vy = (y - lastY) / dt;
          stamp(x, y, vx, vy);
          lastX = x;
          lastY = y;
          lastT = t;
        }
      };
      const onPointerDown = (e: PointerEvent) => {
        if (isOverProtected(e.clientX, e.clientY)) return;
        const rect = (app.canvas as HTMLCanvasElement).getBoundingClientRect();
        const dpr = app.renderer.resolution;
        lastX = (e.clientX - rect.left) * dpr;
        lastY = (e.clientY - rect.top) * dpr;
        lastT = performance.now();
        painting = true;
        stamp(lastX, lastY, 0, 0);
        // Double-click = butterfly of dots
        if (e.detail >= 2) {
          paintButterfly(lastX, lastY);
        }
      };
      const onPointerUp = () => {
        painting = false;
      };
      const onPointerLeave = () => {
        painting = false;
        brushPreview.visible = false;
      };

      const paintButterfly = (cx: number, cy: number) => {
        const wing = (side: 1 | -1) => {
          for (let i = 0; i < 60; i++) {
            const t = Math.random();
            const wx = cx + side * (t * 25 + 5);
            const wy = cy - 10 + (Math.random() - 0.5) * 30;
            const dot = new Graphics();
            dot.circle(wx, wy, 2).fill({
              color: pickColor(Math.floor(Math.random() * 14)),
              alpha: 0.9,
            });
            paintLayer.addChild(dot);
          }
        };
        wing(-1);
        wing(1);
        // Body
        for (let i = 0; i < 12; i++) {
          const by = cy - 8 + i * 2;
          const dot = new Graphics();
          dot.circle(cx, by, 1.5).fill({ color: 0x3a1a0a, alpha: 0.95 });
          paintLayer.addChild(dot);
        }
      };

      app.canvas.addEventListener("pointermove", onPointerMove);
      app.canvas.addEventListener("pointerdown", onPointerDown);
      window.addEventListener("pointerup", onPointerUp);
      app.canvas.addEventListener("pointerleave", onPointerLeave);

      app.renderer.on("resize", () => {
        buildForest();
        buildFlower();
      });

      cleanup = () => {
        app.canvas.removeEventListener("pointermove", onPointerMove);
        app.canvas.removeEventListener("pointerdown", onPointerDown);
        window.removeEventListener("pointerup", onPointerUp);
        app.canvas.removeEventListener("pointerleave", onPointerLeave);
        try {
          app.destroy(true, { children: true, texture: true });
        } catch {}
      };
    })();

    return () => {
      cancelled = true;
      cleanup();
    };
  }, []);

  return (
    <div
      ref={hostRef}
      className="absolute inset-0 w-full h-full cursor-crosshair"
      aria-label="Puntillismo — flor de puntos con bosque de fondo, pinta con el cursor"
    />
  );
}
