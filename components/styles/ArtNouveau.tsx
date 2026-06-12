"use client";

import { useEffect, useRef } from "react";
import paper from "paper/dist/paper-core";
import type { Flower } from "@/lib/flowers";

type Props = { flowers: Flower[]; ink: string; reduceMotion: boolean };

// Saturday — Art Nouveau. A single, large central iris painted in Paper.js
// with a Mucha-inspired decorative frame. The iris lives a cycle: it sprouts
// from a rhizome, blooms in full violet splendor, slowly wilts (standards
// droop, falls hang lower), dies (one petal falls), lies dormant, then
// regrows. A butterfly crosses the scene during bloom.
//
// Phase map (0..1, 24s total):
//   0.00 — 0.33 : sprout + growth
//   0.33 — 0.50 : full bloom
//   0.50 — 0.75 : slow wilt
//   0.75 — 0.83 : death — one petal falls
//   0.83 — 0.92 : dormancy
//   0.92 — 1.00 : reborn sprout
export function ArtNouveau({ reduceMotion }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const fitCanvas = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = canvas.clientWidth * dpr;
      canvas.height = canvas.clientHeight * dpr;
    };
    fitCanvas();
    paper.setup(canvas);
    const view = paper.view;

    const gold = "#a37326";
    const goldLight = "#d4a942";
    const dirt = "#5a3a1c";
    const ink = "#2a1a0a";

    const layer = paper.project.activeLayer;

    // --- Mucha-inspired decorative frame ---
    const drawFrame = () => {
      const w = view.size.width;
      const h = view.size.height;
      const frame = new paper.Group();

      // Top arc with whiplash curves and rosettes
      const topArc = new paper.Path();
      topArc.strokeColor = new paper.Color(gold);
      topArc.strokeWidth = 1.6;
      topArc.add(new paper.Point(w * 0.08, h * 0.12));
      topArc.cubicCurveTo(
        new paper.Point(w * 0.3, h * 0.04),
        new paper.Point(w * 0.5, h * 0.14),
        new paper.Point(w * 0.5, h * 0.08)
      );
      topArc.cubicCurveTo(
        new paper.Point(w * 0.5, h * 0.14),
        new paper.Point(w * 0.7, h * 0.04),
        new paper.Point(w * 0.92, h * 0.12)
      );
      frame.addChild(topArc);

      // Rosettes along the arc
      const rosettePositions = [0.25, 0.5, 0.75];
      rosettePositions.forEach((t) => {
        const rx = w * (0.08 + t * 0.84);
        const ry = h * 0.1;
        const rosette = new paper.Path();
        rosette.strokeColor = new paper.Color(goldLight);
        rosette.strokeWidth = 1;
        for (let i = 0; i < 8; i++) {
          const a = (i / 8) * Math.PI * 2;
          rosette.add(new paper.Point(rx + Math.cos(a) * 8, ry + Math.sin(a) * 8));
        }
        rosette.closed = true;
        frame.addChild(rosette);
      });

      // Bottom frame with parallel lines (Mucha poster style)
      const botY = h * 0.88;
      for (let i = 0; i < 5; i++) {
        const line = new paper.Path();
        line.strokeColor = new paper.Color(gold);
        line.strokeWidth = i === 0 ? 1.4 : 0.8;
        line.opacity = 1 - i * 0.15;
        line.add(new paper.Point(w * 0.08, botY + i * 3));
        line.lineTo(new paper.Point(w * 0.92, botY + i * 3));
        frame.addChild(line);
      }

      // Side vertical flourishes
      const flourish = (side: 1 | -1) => {
        const fx = side < 0 ? w * 0.08 : w * 0.92;
        const f = new paper.Path();
        f.strokeColor = new paper.Color(goldLight);
        f.strokeWidth = 1;
        f.add(new paper.Point(fx, h * 0.88));
        f.cubicCurveTo(
          new paper.Point(fx + side * 18, h * 0.6),
          new paper.Point(fx + side * 24, h * 0.35),
          new paper.Point(fx, h * 0.12)
        );
        frame.addChild(f);
      };
      flourish(-1);
      flourish(1);

      return frame;
    };

    // --- Ambient tendrils ---
    const tendrils: paper.Path[] = [];
    const buildTendrils = () => {
      const w = view.size.width;
      const h = view.size.height;
      for (let side = -1; side <= 1; side += 2) {
        for (let i = 0; i < 3; i++) {
          const p = new paper.Path();
          p.strokeColor = new paper.Color(goldLight);
          p.strokeWidth = 1;
          p.opacity = 0.5;
          const baseX = side < 0 ? w * 0.12 + i * 12 : w * 0.88 - i * 12;
          const baseY = h * 0.88;
          p.add(new paper.Point(baseX, baseY));
          for (let s = 1; s <= 10; s++) {
            const t = s / 10;
            p.add(new paper.Point(baseX + side * Math.sin(t * 5 + i) * 60 * t, baseY - t * h * 0.65));
          }
          p.smooth({ type: "geometric" });
          tendrils.push(p);
        }
      }
    };

    // --- The Iris: rebuilt every frame from the current phase ---
    let irisGroup = new paper.Group();

    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
    const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
    const smoothstep = (a: number, b: number, x: number) => {
      const t = clamp01((x - a) / (b - a));
      return t * t * (3 - 2 * t);
    };

    const hsl = (h: number, s: number, l: number, a = 1) =>
      new paper.Color(`hsla(${h}, ${s}%, ${l}%, ${a})`);

    let fallenPetal: { x: number; y: number; rot: number; size: number; color: paper.Color } | null = null;

    const buildIris = (phase: number) => {
      irisGroup.removeChildren();
      const w = view.size.width;
      const h = view.size.height;
      const cx = w / 2;
      const groundY = h * 0.82;

      // ---------- Stages ----------
      const growT = smoothstep(0, 0.33, phase);
      const bloomT = smoothstep(0.33, 0.5, phase);
      const wiltT = smoothstep(0.5, 0.75, phase);
      const deathT = smoothstep(0.75, 0.83, phase);
      const dormT = smoothstep(0.83, 0.92, phase);
      const rebornT = smoothstep(0.92, 1.0, phase);

      // Effective bloom amount
      const bloom = clamp01(growT - wiltT) * (1 - dormT);

      // Stem height
      const stemHeight = lerp(8, Math.min(w, h) * 0.45, Math.max(growT, 0.2 + rebornT * 0.2)) * (1 - dormT * 0.6);
      const stemTopY = groundY - stemHeight;

      // Stem bend (slight, iris stems are stiffer)
      const bend = wiltT * 40 + dormT * 30;
      const ctrl1Y = groundY - stemHeight * 0.55;
      const ctrl2Y = groundY - stemHeight * 0.85;
      const ctrl1X = cx - bend * 0.3;
      const ctrl2X = cx + bend * 0.5;

      // ---- Soil mound ----
      const soil = new paper.Path();
      soil.fillColor = new paper.Color(dirt);
      soil.add(new paper.Point(cx - 60, groundY + 2));
      soil.cubicCurveTo(
        new paper.Point(cx - 40, groundY - 12),
        new paper.Point(cx + 40, groundY - 12),
        new paper.Point(cx + 60, groundY + 2)
      );
      soil.closed = true;
      irisGroup.addChild(soil);

      // Sprouts during rebirth
      if (rebornT > 0 && rebornT < 1) {
        for (let i = 0; i < 4; i++) {
          const sx = cx + (i - 1.5) * 10;
          const sp = new paper.Path();
          sp.strokeColor = hsl(110, 55, 38);
          sp.strokeWidth = 2;
          sp.add(new paper.Point(sx, groundY));
          sp.lineTo(new paper.Point(sx + (i - 1.5) * 2, groundY - 5 * rebornT));
          irisGroup.addChild(sp);
        }
      }

      // ---- Stem ----
      const stem = new paper.Path();
      stem.strokeColor = hsl(lerp(105, 30, wiltT), lerp(50, 25, wiltT), lerp(32, 20, wiltT));
      stem.strokeWidth = lerp(2, 3.5, bloom);
      stem.add(new paper.Point(cx, groundY));
      stem.cubicCurveTo(new paper.Point(ctrl1X, ctrl1Y), new paper.Point(ctrl2X, ctrl2Y), new paper.Point(cx + bend, stemTopY));
      irisGroup.addChild(stem);

      // ---- Leaves (2, sword-like) ----
      const leafDroop = wiltT * 70;
      const drawLeaf = (side: 1 | -1, yOff: number, length: number) => {
        const leaf = new paper.Path();
        leaf.strokeColor = hsl(lerp(110, 28, wiltT), lerp(50, 22, wiltT), lerp(28, 18, wiltT));
        leaf.strokeWidth = 1.4;
        leaf.fillColor = hsl(lerp(115, 32, wiltT), lerp(50, 20, wiltT), lerp(32, 22, wiltT), lerp(0.65, 0.35, wiltT));
        const baseX = cx;
        const baseY = groundY - yOff;
        const tip = new paper.Point(baseX + side * length * 0.15, baseY - length);
        leaf.add(new paper.Point(baseX, baseY));
        leaf.cubicCurveTo(
          new paper.Point(baseX + side * length * 0.1, baseY - length * 0.6),
          new paper.Point(baseX + side * length * 0.12, baseY - length * 0.85),
          tip
        );
        leaf.cubicCurveTo(
          new paper.Point(baseX + side * length * 0.08, baseY - length * 0.85),
          new paper.Point(baseX + side * length * 0.06, baseY - length * 0.6),
          new paper.Point(baseX, baseY)
        );
        leaf.rotate(side * leafDroop, new paper.Point(baseX, baseY));
        irisGroup.addChild(leaf);
      };
      if (stemHeight > 30) {
        drawLeaf(1, stemHeight * 0.4, stemHeight * 0.38);
        drawLeaf(-1, stemHeight * 0.55, stemHeight * 0.32);
      }

      // ---- Iris head ----
      const headCx = cx + bend;
      const headCy = stemTopY;

      // Color: violet at peak, browns out as it wilts
      const baseHue = 270; // violet
      const headHue = lerp(baseHue, 28, wiltT);
      const headSat = lerp(75, 30, wiltT);
      const headLight = lerp(55, 35, wiltT);

      // 3 standards (upright petals) and 3 falls (drooping petals with beards)
      const petalLen = Math.min(w, h) * 0.12 * bloom;
      const petalWid = petalLen * 0.45;

      // Standards (top 3)
      for (let i = 0; i < 3; i++) {
        const ang = (i - 1) * 25; // -25, 0, 25 degrees
        const droop = wiltT * 30 + (i === 1 ? 0 : wiltT * 15);
        const standard = new paper.Path();
        standard.fillColor = hsl(headHue + (i % 2 ? 0 : 8), headSat, headLight + (i % 2 ? -3 : 4), 0.92);
        standard.strokeColor = new paper.Color(gold);
        standard.strokeWidth = 1.4;
        // teardrop shape
        standard.add(new paper.Point(headCx, headCy));
        standard.cubicCurveTo(
          new paper.Point(headCx - petalWid, headCy - petalLen * 0.4),
          new paper.Point(headCx - petalWid * 0.55, headCy - petalLen * 1.05),
          new paper.Point(headCx, headCy - petalLen)
        );
        standard.cubicCurveTo(
          new paper.Point(headCx + petalWid * 0.55, headCy - petalLen * 1.05),
          new paper.Point(headCx + petalWid, headCy - petalLen * 0.4),
          new paper.Point(headCx, headCy)
        );
        standard.rotate(ang + droop, new paper.Point(headCx, headCy));
        irisGroup.addChild(standard);

        // Inner vein detail
        const vein = new paper.Path();
        vein.strokeColor = new paper.Color(goldLight);
        vein.strokeWidth = 0.6;
        vein.add(new paper.Point(headCx, headCy));
        vein.lineTo(new paper.Point(headCx, headCy - petalLen * 0.85));
        vein.rotate(ang + droop, new paper.Point(headCx, headCy));
        irisGroup.addChild(vein);
      }

      // Falls (bottom 3, hanging with beards)
      for (let i = 0; i < 3; i++) {
        const ang = (i - 1) * 30 + 180; // 150, 180, 210
        const hang = 45 + wiltT * 60; // they hang more as it wilts
        const fall = new paper.Path();
        fall.fillColor = hsl(headHue + 6, headSat - 5, headLight - 2, 0.9);
        fall.strokeColor = new paper.Color(gold);
        fall.strokeWidth = 1.4;
        fall.add(new paper.Point(headCx, headCy));
        fall.cubicCurveTo(
          new paper.Point(headCx - petalWid * 0.8, headCy + petalLen * 0.3),
          new paper.Point(headCx - petalWid * 0.5, headCy + petalLen * 0.85),
          new paper.Point(headCx, headCy + petalLen)
        );
        fall.cubicCurveTo(
          new paper.Point(headCx + petalWid * 0.5, headCy + petalLen * 0.85),
          new paper.Point(headCx + petalWid * 0.8, headCy + petalLen * 0.3),
          new paper.Point(headCx, headCy)
        );
        fall.rotate(ang, new paper.Point(headCx, headCy));
        fall.rotate(hang, new paper.Point(headCx, headCy));
        irisGroup.addChild(fall);

        // Beard (yellow fuzzy stripe)
        const beard = new paper.Path();
        beard.strokeColor = new paper.Color("#e6c845");
        beard.strokeWidth = 1.8;
        beard.add(new paper.Point(headCx, headCy + petalLen * 0.25));
        beard.lineTo(new paper.Point(headCx, headCy + petalLen * 0.7));
        beard.rotate(ang, new paper.Point(headCx, headCy));
        beard.rotate(hang, new paper.Point(headCx, headCy));
        irisGroup.addChild(beard);

        // One fall may detach during death
        if (deathT > 0.1 && i === 1 && !fallenPetal) {
          fallenPetal = {
            x: headCx,
            y: headCy + petalLen * 0.8,
            rot: ang + hang,
            size: petalLen,
            color: fall.fillColor.clone(),
          };
        }
      }

      // Center style (white/yellow patch)
      if (bloom > 0.05) {
        const center = new paper.Path();
        center.fillColor = hsl(50, 70, 92, 0.95);
        center.strokeColor = new paper.Color(gold);
        center.strokeWidth = 1;
        center.add(new paper.Point(headCx, headCy));
        center.cubicCurveTo(
          new paper.Point(headCx - petalWid * 0.3, headCy - petalLen * 0.2),
          new paper.Point(headCx - petalWid * 0.2, headCy + petalLen * 0.2),
          new paper.Point(headCx, headCy + petalLen * 0.25)
        );
        center.cubicCurveTo(
          new paper.Point(headCx + petalWid * 0.2, headCy + petalLen * 0.2),
          new paper.Point(headCx + petalWid * 0.3, headCy - petalLen * 0.2),
          new paper.Point(headCx, headCy)
        );
        irisGroup.addChild(center);
      }

      // Fallen petal on the ground
      if (fallenPetal) {
        const fallen = new paper.Path();
        fallen.fillColor = fallenPetal.color;
        fallen.strokeColor = new paper.Color(gold);
        fallen.strokeWidth = 1;
        const pw = fallenPetal.size * 0.4;
        fallen.add(new paper.Point(fallenPetal.x, fallenPetal.y));
        fallen.cubicCurveTo(
          new paper.Point(fallenPetal.x - pw, fallenPetal.y - fallenPetal.size * 0.3),
          new paper.Point(fallenPetal.x - pw * 0.5, fallenPetal.y - fallenPetal.size * 0.85),
          new paper.Point(fallenPetal.x, fallenPetal.y - fallenPetal.size)
        );
        fallen.cubicCurveTo(
          new paper.Point(fallenPetal.x + pw * 0.5, fallenPetal.y - fallenPetal.size * 0.85),
          new paper.Point(fallenPetal.x + pw, fallenPetal.y - fallenPetal.size * 0.3),
          new paper.Point(fallenPetal.x, fallenPetal.y)
        );
        fallen.rotate(fallenPetal.rot + 45, new paper.Point(fallenPetal.x, fallenPetal.y));
        irisGroup.addChild(fallen);
      }

      // Clear fallen petal at cycle end
      if (phase > 0.98) {
        fallenPetal = null;
      }
    };

    // Build static layers
    const frame = drawFrame();
    buildTendrils();

    // Animation loop: 24 seconds per full cycle
    const CYCLE_MS = 24000;
    const start = performance.now();
    let lastBuiltPhase = -1;

    // Butterfly state
    let butterfly: paper.Group | null = null;
    let butterflyPhase = 0; // 0..1 for its own loop

    view.onFrame = (event: { delta: number; time: number; count: number }) => {
      const now = performance.now();
      const phase = ((now - start) % CYCLE_MS) / CYCLE_MS;
      // Rebuild ~30fps
      if (Math.abs(phase - lastBuiltPhase) > 0.002 || lastBuiltPhase < 0) {
        buildIris(phase);
        lastBuiltPhase = phase;
      }

      if (!reduceMotion) {
        // tendrils sway
        const w = view.size.width;
        const h = view.size.height;
        tendrils.forEach((t, i) => {
          const phase2 = event.time + i;
          const side = i < 3 ? -1 : 1;
          const baseX = side < 0 ? w * 0.12 + (i % 3) * 12 : w * 0.88 - (i % 3) * 12;
          for (let s = 1; s < t.segments.length; s++) {
            const seg = t.segments[s];
            const tt = s / (t.segments.length - 1);
            seg.point.x = baseX + side * Math.sin(phase2 * 0.5 + tt * 3.5) * 55 * tt;
          }
          t.smooth({ type: "geometric" });
        });

        // Butterfly during bloom (phase 0.33..0.5)
        const bloomStart = 0.33;
        const bloomEnd = 0.5;
        if (phase >= bloomStart && phase < bloomEnd) {
          if (!butterfly) {
            butterfly = new paper.Group();
            const w = view.size.width;
            const h = view.size.height;
            // Wings
            const wing = (side: 1 | -1) => {
              const wg = new paper.Path();
              wg.fillColor = new paper.Color("#e6c845");
              wg.strokeColor = new paper.Color(gold);
              wg.strokeWidth = 0.8;
              wg.add(new paper.Point(0, 0));
              wg.cubicCurveTo(
                new paper.Point(side * 12, -8),
                new paper.Point(side * 18, -2),
                new paper.Point(side * 4, 6)
              );
              wg.cubicCurveTo(
                new paper.Point(side * 2, 8),
                new paper.Point(side * 6, 10),
                new paper.Point(0, 8)
              );
              wg.closed = true;
              return wg;
            };
            butterfly.addChild(wing(-1));
            butterfly.addChild(wing(1));
            // Body
            const body = new paper.Path();
            body.strokeColor = new paper.Color(ink);
            body.strokeWidth = 1.2;
            body.add(new paper.Point(0, -6));
            body.lineTo(new paper.Point(0, 8));
            butterfly.addChild(body);
            butterfly.position = new paper.Point(w * 0.12, h * 0.3);
            layer.addChild(butterfly);
          }
          // Fly across
          const t = (phase - bloomStart) / (bloomEnd - bloomStart);
          const w = view.size.width;
          const h = view.size.height;
          butterfly.position = new paper.Point(
            w * 0.12 + t * w * 0.76,
            h * 0.3 + Math.sin(t * Math.PI * 2) * 40
          );
          // Wing flap
          const flap = Math.sin(event.time * 15) * 0.4;
          (butterfly.children[0] as paper.Path).rotation = flap;
          (butterfly.children[1] as paper.Path).rotation = -flap;
        } else if (butterfly) {
          butterfly.remove();
          butterfly = null;
        }
      }
    };

    const onResize = () => {
      fitCanvas();
      layer.removeChildren();
      irisGroup = new paper.Group();
      tendrils.length = 0;
      const newFrame = drawFrame();
      buildTendrils();
    };
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
      paper.project.clear();
    };
  }, [reduceMotion]);

  return (
    <div
      className="absolute inset-0"
      style={{
        background:
          "radial-gradient(ellipse at 50% 40%, #f3e3bf 0%, #cfa867 55%, #6e4a26 100%)",
      }}
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        aria-label="Iris Art Nouveau con ciclo de vida"
      />
    </div>
  );
}
