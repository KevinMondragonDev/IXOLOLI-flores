"use client";

import { useEffect, useRef } from "react";
import paper from "paper/dist/paper-core";
import type { Flower } from "@/lib/flowers";

type Props = { flowers: Flower[]; ink: string; reduceMotion: boolean };

// Saturday — Art Nouveau. A single, large central tulip painted in Paper.js
// that lives a cycle: it grows, blooms in full color, slowly wilts and dies
// (petals droop, leaves curl, color fades to umber), then sprouts back to
// life. The cycle loops forever.
//
// Phase map (0..1):
//   0.00 — 0.18 : germination + growth
//   0.18 — 0.32 : full bloom (small sway, golden glow)
//   0.32 — 0.62 : slow wilt (color desaturates, petals droop)
//   0.62 — 0.72 : death — petals fall, stem bows
//   0.72 — 0.85 : dormancy (bare stem)
//   0.85 — 1.00 : reborn sprout pushes up
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

    // --- Decorative frame ---
    const drawFrame = () => {
      const w = view.size.width;
      const h = view.size.height;
      // top arc
      const top = new paper.Path();
      top.strokeColor = new paper.Color(gold);
      top.strokeWidth = 1.4;
      top.add(new paper.Point(w * 0.06, h * 0.1));
      top.cubicCurveTo(
        new paper.Point(w * 0.3, h * 0.04),
        new paper.Point(w * 0.5, h * 0.12),
        new paper.Point(w * 0.5, h * 0.08)
      );
      top.cubicCurveTo(
        new paper.Point(w * 0.5, h * 0.12),
        new paper.Point(w * 0.7, h * 0.04),
        new paper.Point(w * 0.94, h * 0.1)
      );
      // bottom mirrored
      const bot = top.clone();
      bot.scale(1, -1, new paper.Point(w / 2, h / 2));
      // sides
      const left = new paper.Path();
      left.strokeColor = new paper.Color(gold);
      left.strokeWidth = 1.2;
      left.add(new paper.Point(w * 0.06, h * 0.1));
      left.lineTo(new paper.Point(w * 0.06, h * 0.9));
      const right = left.clone();
      right.position = new paper.Point(w * 0.94, left.position.y);
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
          p.opacity = 0.55;
          const baseX = side < 0 ? w * 0.1 + i * 14 : w * 0.9 - i * 14;
          const baseY = h * 0.9;
          p.add(new paper.Point(baseX, baseY));
          for (let s = 1; s <= 12; s++) {
            const t = s / 12;
            p.add(new paper.Point(baseX + side * Math.sin(t * 6 + i) * 70 * t, baseY - t * h * 0.7));
          }
          p.smooth({ type: "geometric" });
          tendrils.push(p);
        }
      }
    };

    // --- The Tulip: rebuilt every frame from the current phase ---
    let tulipGroup = new paper.Group();

    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
    const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
    const smoothstep = (a: number, b: number, x: number) => {
      const t = clamp01((x - a) / (b - a));
      return t * t * (3 - 2 * t);
    };

    // hsl helper
    const hsl = (h: number, s: number, l: number, a = 1) =>
      new paper.Color(`hsla(${h}, ${s}%, ${l}%, ${a})`);

    type PetalState = { fallen: boolean; fallX: number; fallY: number; fallRot: number };
    const fallenPetals: { x: number; y: number; rot: number; size: number; color: paper.Color }[] = [];

    const buildTulip = (phase: number) => {
      tulipGroup.removeChildren();
      const w = view.size.width;
      const h = view.size.height;
      const cx = w / 2;
      const groundY = h * 0.82;

      // ---------- Stages ----------
      const growT = smoothstep(0, 0.18, phase); // 0..1
      const wiltT = smoothstep(0.32, 0.62, phase); // 0..1 (wilting)
      const deathT = smoothstep(0.6, 0.72, phase); // 0..1 (fully dead)
      const dormT = smoothstep(0.72, 0.85, phase); // 0..1 (dormancy)
      const rebornT = smoothstep(0.85, 1.0, phase); // 0..1 (new sprout)

      // Effective bloom amount: grows, plateaus, then wilts to 0 by death
      const bloom = clamp01(growT - wiltT) * (1 - dormT);

      // Size of the head
      const r = lerp(0, 1, bloom) * Math.min(w, h) * 0.13 + 4;

      // Stem height grows with bloom and stays a bit during death
      const stemHeight = lerp(8, Math.min(w, h) * 0.42, Math.max(growT, 0.2 + rebornT * 0.2)) * (1 - dormT * 0.7);
      const stemTopY = groundY - stemHeight;

      // Stem bend: starts straight, bends progressively as it wilts
      const bend = wiltT * 90 + dormT * 60; // px to the side
      const ctrl1Y = groundY - stemHeight * 0.55;
      const ctrl2Y = groundY - stemHeight * 0.85;
      const ctrl1X = cx - bend * 0.4;
      const ctrl2X = cx + bend * 0.7;

      // ---- Soil mound ----
      const soil = new paper.Path();
      soil.fillColor = new paper.Color(dirt);
      soil.add(new paper.Point(cx - 70, groundY + 2));
      soil.cubicCurveTo(
        new paper.Point(cx - 50, groundY - 14),
        new paper.Point(cx + 50, groundY - 14),
        new paper.Point(cx + 70, groundY + 2)
      );
      soil.closed = true;
      tulipGroup.addChild(soil);

      // Sprouts during rebirth (little green shoots from soil)
      if (rebornT > 0 && rebornT < 1) {
        for (let i = 0; i < 5; i++) {
          const sx = cx + (i - 2) * 8;
          const sp = new paper.Path();
          sp.strokeColor = hsl(110, 60, 38);
          sp.strokeWidth = 2;
          sp.add(new paper.Point(sx, groundY));
          sp.lineTo(new paper.Point(sx + (i - 2) * 2, groundY - 6 * rebornT));
          tulipGroup.addChild(sp);
        }
      }

      // ---- Stem ----
      const stem = new paper.Path();
      stem.strokeColor = hsl(lerp(110, 35, wiltT), lerp(55, 30, wiltT), lerp(35, 22, wiltT));
      stem.strokeWidth = lerp(2, 4, bloom);
      stem.add(new paper.Point(cx, groundY));
      stem.cubicCurveTo(new paper.Point(ctrl1X, ctrl1Y), new paper.Point(ctrl2X, ctrl2Y), new paper.Point(cx + bend, stemTopY));
      tulipGroup.addChild(stem);

      // ---- Leaves ----
      // Two leaves; they droop as wilt progresses
      const leafDroop = wiltT * 90; // degrees
      const drawLeaf = (side: 1 | -1, yOff: number, size: number) => {
        const leaf = new paper.Path();
        leaf.strokeColor = hsl(lerp(105, 32, wiltT), lerp(55, 30, wiltT), lerp(30, 22, wiltT));
        leaf.strokeWidth = 1.4;
        leaf.fillColor = hsl(lerp(115, 35, wiltT), lerp(55, 25, wiltT), lerp(38, 26, wiltT), lerp(0.65, 0.35, wiltT));
        const baseX = cx;
        const baseY = groundY - yOff;
        const tip = new paper.Point(baseX + side * size * 0.8, baseY - size * 0.6);
        leaf.add(new paper.Point(baseX, baseY));
        leaf.cubicCurveTo(
          new paper.Point(baseX + side * size * 0.3, baseY - size * 0.5),
          new paper.Point(baseX + side * size * 0.7, baseY - size * 0.3),
          tip
        );
        leaf.cubicCurveTo(
          new paper.Point(baseX + side * size * 0.5, baseY - size * 0.1),
          new paper.Point(baseX + side * size * 0.2, baseY),
          new paper.Point(baseX, baseY)
        );
        leaf.rotate(side * leafDroop, new paper.Point(baseX, baseY));
        tulipGroup.addChild(leaf);
      };
      if (stemHeight > 30) {
        drawLeaf(1, stemHeight * 0.45, stemHeight * 0.32);
        drawLeaf(-1, stemHeight * 0.6, stemHeight * 0.28);
      }

      // ---- Tulip head ----
      // Anchor at the stem top (with bend)
      const headCx = cx + bend;
      const headCy = stemTopY;

      // 5 petals: drawn around head. Each petal is a curved teardrop with
      // outline + inner highlight. As wilt progresses they droop down.
      const petalCount = 5;
      const petalLen = r * 1.3;
      const petalWid = r * 0.55;
      const droopAngle = wiltT * 70 + deathT * 30; // extra droop

      // Color: vibrant pink/red at peak, browns out as it wilts
      const baseHue = 340; // warm pink/red
      const headHue = lerp(baseHue, 28, wiltT);
      const headSat = lerp(80, 30, wiltT);
      const headLight = lerp(65, 38, wiltT);

      // Draw outer petals (4) then central
      for (let i = 0; i < petalCount; i++) {
        // Skip one petal as deathT > 0.4 to simulate it falling, then more
        const fallenThis = deathT > 0.18 && i === 0;
        if (fallenThis) {
          if (fallenPetals.length < 30) {
            fallenPetals.push({
              x: headCx + (Math.random() - 0.5) * 30,
              y: headCy + 10,
              rot: (Math.random() - 0.5) * 60,
              size: petalLen * 0.9,
              color: hsl(headHue, headSat, headLight, 0.85),
            });
          }
          continue;
        }

        const ang = (i / petalCount) * 360 - 90; // -90 = top
        const radial = ang * (Math.PI / 180);

        const petal = new paper.Path();
        petal.fillColor = hsl(headHue + (i % 2 ? 0 : 6), headSat, headLight + (i % 2 ? -3 : 4), 0.92);
        petal.strokeColor = new paper.Color(gold);
        petal.strokeWidth = 1.2;

        // teardrop path
        petal.add(new paper.Point(headCx, headCy));
        petal.cubicCurveTo(
          new paper.Point(headCx - petalWid, headCy - petalLen * 0.45),
          new paper.Point(headCx - petalWid * 0.55, headCy - petalLen * 1.05),
          new paper.Point(headCx, headCy - petalLen)
        );
        petal.cubicCurveTo(
          new paper.Point(headCx + petalWid * 0.55, headCy - petalLen * 1.05),
          new paper.Point(headCx + petalWid, headCy - petalLen * 0.45),
          new paper.Point(headCx, headCy)
        );

        // Rotate to its slot around head + extra droop
        let rot = ang + 90; // facing outward
        rot += Math.sin(radial) * droopAngle; // sides droop more
        petal.rotate(rot, new paper.Point(headCx, headCy));

        tulipGroup.addChild(petal);
      }

      // Center / pistil
      if (bloom > 0.05) {
        const pistil = new paper.Path.Circle(new paper.Point(headCx, headCy - petalLen * 0.4), Math.max(1, r * 0.12));
        pistil.fillColor = new paper.Color(goldLight);
        pistil.strokeColor = new paper.Color(ink);
        pistil.strokeWidth = 0.8;
        tulipGroup.addChild(pistil);
      }

      // Fallen petals on the ground
      for (const fp of fallenPetals) {
        const fallen = new paper.Path();
        fallen.fillColor = fp.color;
        fallen.strokeColor = new paper.Color(gold);
        fallen.strokeWidth = 0.8;
        const pw = fp.size * 0.4;
        fallen.add(new paper.Point(fp.x, fp.y));
        fallen.cubicCurveTo(
          new paper.Point(fp.x - pw, fp.y - fp.size * 0.4),
          new paper.Point(fp.x - pw * 0.5, fp.y - fp.size),
          new paper.Point(fp.x, fp.y - fp.size)
        );
        fallen.cubicCurveTo(
          new paper.Point(fp.x + pw * 0.5, fp.y - fp.size),
          new paper.Point(fp.x + pw, fp.y - fp.size * 0.4),
          new paper.Point(fp.x, fp.y)
        );
        fallen.rotate(fp.rot, new paper.Point(fp.x, fp.y));
        tulipGroup.addChild(fallen);
      }

      // During reborn at the very end clear fallen petals so the next cycle
      // starts fresh
      if (phase > 0.97) {
        fallenPetals.length = 0;
      }
    };

    // Build static layers
    drawFrame();
    buildTendrils();

    // Animation loop: 18 seconds per full cycle
    const CYCLE_MS = 18000;
    const start = performance.now();
    let lastBuiltPhase = -1;

    view.onFrame = (event: { delta: number; time: number; count: number }) => {
      const now = performance.now();
      const phase = ((now - start) % CYCLE_MS) / CYCLE_MS;
      // Rebuild ~30fps (paper view runs at ~60fps already)
      if (Math.abs(phase - lastBuiltPhase) > 0.002 || lastBuiltPhase < 0) {
        buildTulip(phase);
        lastBuiltPhase = phase;
      }
      if (!reduceMotion) {
        // tendrils sway
        const w = view.size.width;
        const h = view.size.height;
        tendrils.forEach((t, i) => {
          const phase2 = event.time + i;
          const side = i < 3 ? -1 : 1;
          const baseX = side < 0 ? w * 0.1 + (i % 3) * 14 : w * 0.9 - (i % 3) * 14;
          for (let s = 1; s < t.segments.length; s++) {
            const seg = t.segments[s];
            const tt = s / (t.segments.length - 1);
            seg.point.x = baseX + side * Math.sin(phase2 * 0.6 + tt * 4) * 60 * tt;
          }
          t.smooth({ type: "geometric" });
        });
      }
    };

    const onResize = () => {
      fitCanvas();
      layer.removeChildren();
      tulipGroup = new paper.Group();
      tendrils.length = 0;
      drawFrame();
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
        aria-label="Tulipán Art Nouveau que florece, se marchita y renace"
      />
    </div>
  );
}
