"use client";

import { useEffect, useRef } from "react";
import { Application, Container, Graphics } from "pixi.js";
import type { Flower } from "@/lib/flowers";

type Props = { flowers: Flower[]; ink: string; reduceMotion: boolean };

// Tuesday — "Starry Love", a Van Gogh inspired night about love. A cobalt
// sky with swirling brushstrokes, a heart-shaped moon, golden stars and two
// cypress flames. The user can DRAG to paint their own brushstrokes onto the
// canvas — like adding to the painting.
export function Pointillism({ flowers: _flowers, reduceMotion: _reduceMotion }: Props) {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cleanup = () => {};
    let cancelled = false;

    (async () => {
      const host = hostRef.current;
      if (!host) return;
      const app = new Application();
      await app.init({
        background: 0x0e1a3a,
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

      // Layers
      const baseLayer = new Container(); // pre-painted Van Gogh
      const paintLayer = new Container(); // user brushstrokes
      const hudLayer = new Container(); // cursor brush preview
      app.stage.addChild(baseLayer);
      app.stage.addChild(paintLayer);
      app.stage.addChild(hudLayer);

      // Van Gogh palette — cobalts, ultramarines, lemon yellow, ochre,
      // vermilion, terracotta and white.
      const PALETTE = [
        0x0a1a4a, // deep cobalt
        0x1c3a78, // ultramarine
        0x2e63b8, // bright blue
        0x4a8ad9, // sky blue
        0x9bbfe6, // pale blue
        0xf1e6a8, // pale yellow
        0xf2c739, // ochre
        0xffd84a, // lemon yellow
        0xe87d2a, // amber
        0xc8442a, // vermilion
        0x6e3a1a, // umber
        0x132a0e, // dark green
        0x2c5a26, // green
        0x6aa84f, // light green
        0xeae0c8, // off white
      ];

      const pickColor = (i: number) => PALETTE[i % PALETTE.length];

      // ---- Helpers ----
      const drawStroke = (
        g: Graphics,
        x: number,
        y: number,
        len: number,
        angle: number,
        thickness: number,
        color: number,
        alpha = 0.95
      ) => {
        g.save?.();
        const dx = Math.cos(angle) * len * 0.5;
        const dy = Math.sin(angle) * len * 0.5;
        g.ellipse(x, y, len * 0.5, thickness)
          .fill({ color, alpha });
        // The ellipse needs rotation — Pixi v8 Graphics has no per-shape
        // rotation, so we transform via container or just paint enough strokes
        // to imply direction. We approximate with two small offset dots.
        g.circle(x - dx, y - dy, thickness * 0.9).fill({ color, alpha });
        g.circle(x + dx, y + dy, thickness * 0.9).fill({ color, alpha });
        g.restore?.();
      };

      // Pixi v8 Graphics doesn't support per-shape rotation, so for proper
      // oriented brushstrokes we draw small rotated rectangles via a temp
      // graphic placed in a container.
      const drawOrientedStroke = (
        parent: Container,
        x: number,
        y: number,
        len: number,
        thickness: number,
        angle: number,
        color: number,
        alpha = 0.95
      ) => {
        const g = new Graphics();
        g.roundRect(-len / 2, -thickness / 2, len, thickness, thickness * 0.5).fill({
          color,
          alpha,
        });
        g.x = x;
        g.y = y;
        g.rotation = angle;
        parent.addChild(g);
        return g;
      };

      // ---- Build the base painting ----
      const W = () => app.renderer.width;
      const H = () => app.renderer.height;

      const paintBase = () => {
        baseLayer.removeChildren();
        const w = W();
        const h = H();
        const horizon = h * 0.62;

        // ground (dark hills)
        const ground = new Graphics();
        ground.rect(0, horizon, w, h - horizon).fill({ color: 0x0e1f1a });
        baseLayer.addChild(ground);

        // sky horizontal wash (cobalt -> deeper)
        for (let i = 0; i < 1200; i++) {
          const x = Math.random() * w;
          const y = Math.random() * horizon;
          const colorIdx = 0 + Math.floor((y / horizon) * 4);
          drawOrientedStroke(
            baseLayer,
            x,
            y,
            6 + Math.random() * 10,
            2 + Math.random() * 1.4,
            Math.random() * Math.PI * 2,
            PALETTE[colorIdx],
            0.7
          );
        }

        // swirling galaxies — multiple spirals like Starry Night
        const spirals = [
          { cx: w * 0.22, cy: horizon * 0.32, r: Math.min(w, h) * 0.16, dir: 1 },
          { cx: w * 0.75, cy: horizon * 0.28, r: Math.min(w, h) * 0.14, dir: -1 },
          { cx: w * 0.5, cy: horizon * 0.48, r: Math.min(w, h) * 0.1, dir: 1 },
        ];
        for (const s of spirals) {
          for (let i = 0; i < 280; i++) {
            const t = i / 280;
            const ang = t * Math.PI * 6 * s.dir;
            const rad = t * s.r;
            const x = s.cx + Math.cos(ang) * rad;
            const y = s.cy + Math.sin(ang) * rad;
            const color = i % 3 === 0 ? 0xffd84a : i % 3 === 1 ? 0x4a8ad9 : 0xeae0c8;
            drawOrientedStroke(
              baseLayer,
              x,
              y,
              8 + Math.random() * 8,
              2.4,
              ang + Math.PI / 2,
              color,
              0.95
            );
          }
        }

        // stars — golden halos
        const stars = [
          { x: w * 0.12, y: horizon * 0.15, r: 8 },
          { x: w * 0.35, y: horizon * 0.08, r: 6 },
          { x: w * 0.58, y: horizon * 0.12, r: 10 },
          { x: w * 0.82, y: horizon * 0.1, r: 7 },
          { x: w * 0.46, y: horizon * 0.22, r: 5 },
          { x: w * 0.18, y: horizon * 0.46, r: 5 },
          { x: w * 0.66, y: horizon * 0.5, r: 6 },
        ];
        for (const st of stars) {
          for (let i = 0; i < 60; i++) {
            const ang = Math.random() * Math.PI * 2;
            const rad = Math.pow(Math.random(), 1.6) * st.r * 4;
            drawOrientedStroke(
              baseLayer,
              st.x + Math.cos(ang) * rad,
              st.y + Math.sin(ang) * rad,
              6 + Math.random() * 6,
              2,
              ang + Math.PI / 2,
              rad < st.r * 1.8 ? 0xffe66a : 0x4a8ad9,
              Math.max(0.2, 1 - rad / (st.r * 4))
            );
          }
          const core = new Graphics();
          core.circle(st.x, st.y, st.r * 0.6).fill({ color: 0xfff5b0, alpha: 1 });
          baseLayer.addChild(core);
        }

        // Heart moon (Van Gogh crescent reimagined as a heart for love)
        const heartCx = w * 0.78;
        const heartCy = horizon * 0.22;
        const heartScale = Math.min(w, h) * 0.07;
        const heartPoints: { x: number; y: number }[] = [];
        for (let i = 0; i < 220; i++) {
          const t = (i / 220) * Math.PI * 2;
          // parametric heart
          const px = 16 * Math.pow(Math.sin(t), 3);
          const py = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
          heartPoints.push({ x: heartCx + (px / 16) * heartScale, y: heartCy + (py / 16) * heartScale });
        }
        // fill heart with dense yellow strokes
        for (let i = 0; i < 380; i++) {
          const inside = heartPoints[Math.floor(Math.random() * heartPoints.length)];
          drawOrientedStroke(
            baseLayer,
            inside.x + (Math.random() - 0.5) * heartScale * 0.4,
            inside.y + (Math.random() - 0.5) * heartScale * 0.4,
            6 + Math.random() * 6,
            2,
            Math.random() * Math.PI * 2,
            i % 4 === 0 ? 0xe87d2a : 0xffd84a,
            0.95
          );
        }
        // halo around heart
        for (let i = 0; i < 200; i++) {
          const t = (i / 200) * Math.PI * 2;
          const rad = heartScale * (1.3 + Math.random() * 0.7);
          drawOrientedStroke(
            baseLayer,
            heartCx + Math.cos(t) * rad,
            heartCy + Math.sin(t) * rad - heartScale * 0.1,
            7 + Math.random() * 5,
            2,
            t + Math.PI / 2,
            0x4a8ad9,
            0.65
          );
        }

        // Cypresses (twin flames, symbol of the two lovers reaching to the sky)
        const cypress = (cx: number, baseY: number, height: number) => {
          for (let i = 0; i < 600; i++) {
            const t = Math.random();
            const yy = baseY - t * height;
            const widthT = (1 - Math.pow(t, 1.4)) * height * 0.12;
            const xx = cx + (Math.random() - 0.5) * widthT;
            const ang = Math.PI / 2 + (Math.random() - 0.5) * 0.6;
            drawOrientedStroke(
              baseLayer,
              xx,
              yy,
              7 + Math.random() * 6,
              2.2,
              ang,
              [0x132a0e, 0x2c5a26, 0x6aa84f][Math.floor(Math.random() * 3)],
              0.95
            );
          }
        };
        cypress(w * 0.12, h * 0.94, h * 0.55);
        cypress(w * 0.88, h * 0.96, h * 0.6);

        // Distant village rooftops along horizon
        for (let i = 0; i < 22; i++) {
          const x = w * 0.25 + (i / 22) * w * 0.5;
          const sz = 6 + Math.random() * 6;
          const g = new Graphics();
          g.rect(x - sz / 2, horizon - sz * 0.6, sz, sz * 0.6).fill({ color: 0xeae0c8, alpha: 0.85 });
          g.poly([x - sz / 2 - 1, horizon - sz * 0.6, x + sz / 2 + 1, horizon - sz * 0.6, x, horizon - sz * 1.05]).fill({ color: 0xc8442a, alpha: 0.85 });
          baseLayer.addChild(g);
        }

        // Hill grass strokes
        for (let i = 0; i < 600; i++) {
          const x = Math.random() * w;
          const y = horizon + Math.random() * (h - horizon);
          const ang = Math.PI / 2 + (Math.random() - 0.5) * 0.4;
          drawOrientedStroke(
            baseLayer,
            x,
            y,
            6 + Math.random() * 6,
            2,
            ang,
            [0x132a0e, 0x2c5a26, 0x1a3a14][Math.floor(Math.random() * 3)],
            0.9
          );
        }
      };

      paintBase();

      // ---- Cursor brush preview ----
      const brushPreview = new Graphics();
      brushPreview.circle(0, 0, 14).stroke({ color: 0xffffff, width: 1.5, alpha: 0.7 });
      brushPreview.circle(0, 0, 4).fill({ color: 0xffffff, alpha: 0.6 });
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
        const angle = speed > 0.4 ? Math.atan2(vy, vx) : Math.random() * Math.PI * 2;
        // number of strokes per stamp scales with speed
        const n = Math.min(8, 2 + Math.floor(speed * 0.5));
        for (let i = 0; i < n; i++) {
          const jx = x + (Math.random() - 0.5) * 14;
          const jy = y + (Math.random() - 0.5) * 14;
          const col = pickColor(strokeIndex + i + Math.floor(speed));
          drawOrientedStroke(
            paintLayer,
            jx,
            jy,
            10 + Math.random() * 10,
            2 + Math.random() * 1.4,
            angle + (Math.random() - 0.5) * 0.3,
            col,
            0.92
          );
        }
        strokeIndex += n;
        if (paintLayer.children.length > 4000) {
          // cap memory; remove oldest
          paintLayer.removeChildAt(0);
        }
      };

      const onPointerMove = (e: PointerEvent) => {
        const rect = (app.canvas as HTMLCanvasElement).getBoundingClientRect();
        const dpr = app.renderer.resolution;
        const x = (e.clientX - rect.left) * dpr;
        const y = (e.clientY - rect.top) * dpr;
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
        const rect = (app.canvas as HTMLCanvasElement).getBoundingClientRect();
        const dpr = app.renderer.resolution;
        lastX = (e.clientX - rect.left) * dpr;
        lastY = (e.clientY - rect.top) * dpr;
        lastT = performance.now();
        painting = true;
        // initial stamp
        stamp(lastX, lastY, 0, 0);
        // big heart on double-click
        if (e.detail >= 2) {
          paintHeart(lastX, lastY);
        }
      };
      const onPointerUp = () => {
        painting = false;
      };
      const onPointerLeave = () => {
        painting = false;
        brushPreview.visible = false;
      };

      const paintHeart = (cx: number, cy: number) => {
        const scale = 40;
        for (let i = 0; i < 220; i++) {
          const t = (i / 220) * Math.PI * 2;
          const px = 16 * Math.pow(Math.sin(t), 3);
          const py = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
          drawOrientedStroke(
            paintLayer,
            cx + (px / 16) * scale + (Math.random() - 0.5) * 8,
            cy + (py / 16) * scale + (Math.random() - 0.5) * 8,
            8 + Math.random() * 6,
            2.4,
            t + Math.PI / 2,
            i % 3 === 0 ? 0xffd84a : 0xc8442a,
            0.95
          );
        }
      };

      app.canvas.addEventListener("pointermove", onPointerMove);
      app.canvas.addEventListener("pointerdown", onPointerDown);
      window.addEventListener("pointerup", onPointerUp);
      app.canvas.addEventListener("pointerleave", onPointerLeave);

      // Resize: rebuild the base painting (the user paint layer is preserved)
      app.renderer.on("resize", paintBase);

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
      aria-label="Pintura interactiva tipo Van Gogh sobre el amor"
    />
  );
}
