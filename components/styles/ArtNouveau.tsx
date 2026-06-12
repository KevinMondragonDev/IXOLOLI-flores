"use client";

import { useEffect, useRef } from "react";
import paper from "paper/dist/paper-core";
import type { Flower } from "@/lib/flowers";
import { useCursor } from "../Cursor";

type Props = { flowers: Flower[]; ink: string; reduceMotion: boolean };

// Saturday — Art Nouveau with Paper.js. Elegant decorative curves with gold
// strokes, animated wave-tendrils that respond to the cursor.
export function ArtNouveau({ flowers, reduceMotion }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cursor = useCursor();
  const cursorRef = useRef(cursor);
  cursorRef.current = cursor;

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
    const ink = "#2a1a0a";

    // Decorative frame
    const drawFrame = () => {
      const w = view.size.width;
      const h = view.size.height;
      const top = new paper.Path();
      top.strokeColor = new paper.Color(gold);
      top.strokeWidth = 1.4;
      top.add(new paper.Point(w * 0.04, h * 0.08));
      top.cubicCurveTo(
        new paper.Point(w * 0.25, h * 0.04),
        new paper.Point(w * 0.5, h * 0.12),
        new paper.Point(w * 0.5, h * 0.08)
      );
      top.cubicCurveTo(
        new paper.Point(w * 0.5, h * 0.12),
        new paper.Point(w * 0.75, h * 0.04),
        new paper.Point(w * 0.96, h * 0.08)
      );
      const bot = top.clone();
      bot.scale(1, -1, new paper.Point(w / 2, h / 2));
      // side lines
      const sides = new paper.Path();
      sides.strokeColor = new paper.Color(gold);
      sides.strokeWidth = 1.2;
      sides.add(new paper.Point(w * 0.04, h * 0.08));
      sides.lineTo(new paper.Point(w * 0.04, h * 0.92));
      const sR = sides.clone();
      sR.position = new paper.Point(w * 0.96, sides.position.y);
    };

    // Whiplash tendrils (signature Art Nouveau)
    const tendrils: paper.Path[] = [];
    const buildTendrils = () => {
      const w = view.size.width;
      const h = view.size.height;
      for (let i = 0; i < 6; i++) {
        const p = new paper.Path();
        p.strokeColor = new paper.Color(goldLight);
        p.strokeWidth = 1 + Math.random();
        p.opacity = 0.7;
        const baseX = (i / 6) * w + 30;
        const baseY = h - 10;
        p.add(new paper.Point(baseX, baseY));
        for (let s = 1; s <= 12; s++) {
          const t = s / 12;
          p.add(new paper.Point(baseX + Math.sin(t * 6 + i) * 60 * t, baseY - t * h * 0.6));
        }
        p.smooth({ type: "geometric" });
        tendrils.push(p);
      }
    };

    // Ornamental flowers
    type FlowerNode = {
      group: paper.Group;
      base: Flower;
      baseX: number;
      baseY: number;
    };
    const flowerNodes: FlowerNode[] = [];

    const drawFlower = (f: Flower) => {
      const w = view.size.width;
      const h = view.size.height;
      const cx = f.x * w;
      const cy = f.y * h;
      const r = 22 + f.scale * 22;
      const group = new paper.Group();

      // stem
      const stem = new paper.Path();
      stem.strokeColor = new paper.Color(gold);
      stem.strokeWidth = 1.4;
      stem.add(new paper.Point(cx, cy + r * 1.6));
      stem.cubicCurveTo(
        new paper.Point(cx - 4, cy + r),
        new paper.Point(cx + 6, cy + r * 0.4),
        new paper.Point(cx, cy + r * 0.1)
      );
      group.addChild(stem);

      // leaf
      const leaf = new paper.Path.Ellipse({
        center: new paper.Point(cx + 14, cy + r * 1.0),
        size: new paper.Size(26, 10),
      });
      leaf.rotate(-25, leaf.position);
      leaf.strokeColor = new paper.Color(gold);
      leaf.strokeWidth = 1.2;
      group.addChild(leaf);

      // head: layered petals
      const petals = 8;
      for (let i = 0; i < petals; i++) {
        const a = (i / petals) * 360;
        const petal = new paper.Path();
        petal.strokeColor = new paper.Color(gold);
        petal.strokeWidth = 1.1;
        const fillCol = new paper.Color(`hsla(${f.hue}, 55%, ${55 + (i % 2) * 8}%, 0.6)`);
        petal.fillColor = fillCol;
        petal.add(new paper.Point(cx, cy));
        petal.cubicCurveTo(
          new paper.Point(cx - r * 0.3, cy - r * 0.4),
          new paper.Point(cx - r * 0.3, cy - r * 1.2),
          new paper.Point(cx, cy - r * 1.05)
        );
        petal.cubicCurveTo(
          new paper.Point(cx + r * 0.3, cy - r * 1.2),
          new paper.Point(cx + r * 0.3, cy - r * 0.4),
          new paper.Point(cx, cy)
        );
        petal.rotate(a, new paper.Point(cx, cy));
        group.addChild(petal);
      }

      const center = new paper.Path.Circle(new paper.Point(cx, cy), r * 0.18);
      center.fillColor = new paper.Color(goldLight);
      center.strokeColor = new paper.Color(ink);
      center.strokeWidth = 0.8;
      group.addChild(center);

      flowerNodes.push({ group, base: f, baseX: cx, baseY: cy });
      group.applyMatrix = false;
      group.pivot = new paper.Point(cx, cy + r * 1.6);
    };

    drawFrame();
    buildTendrils();
    flowers.forEach(drawFlower);

    // Click ripples a gold burst
    paper.view.onClick = (event: paper.MouseEvent) => {
      const ring = new paper.Path.Circle(event.point, 6);
      ring.strokeColor = new paper.Color(goldLight);
      ring.strokeWidth = 2;
      const hearts: paper.Path[] = [];
      for (let i = 0; i < 8; i++) {
        const ang = (i / 8) * Math.PI * 2;
        const p = new paper.Path.Circle(
          event.point.add(new paper.Point(Math.cos(ang) * 6, Math.sin(ang) * 6)),
          3
        );
        p.fillColor = new paper.Color(goldLight);
        hearts.push(p);
      }
      let t = 0;
      const onFrame = () => {
        t += 0.04;
        ring.scale(1.04, ring.position);
        ring.opacity = Math.max(0, 1 - t);
        hearts.forEach((p, i) => {
          const ang = (i / 8) * Math.PI * 2;
          p.position = p.position.add(new paper.Point(Math.cos(ang) * 1.5, Math.sin(ang) * 1.5));
          p.opacity = Math.max(0, 1 - t);
        });
        if (t >= 1) {
          ring.remove();
          hearts.forEach((p) => p.remove());
          paper.view.off("frame", onFrame);
        }
      };
      paper.view.on("frame", onFrame);
    };

    paper.view.onFrame = (event: { delta: number; time: number; count: number }) => {
      if (reduceMotion) return;
      const c = cursorRef.current;
      const w = view.size.width;
      const h = view.size.height;
      // tendrils breathe
      tendrils.forEach((t, i) => {
        const phase = event.time + i;
        for (let s = 1; s < t.segments.length; s++) {
          const seg = t.segments[s];
          const tt = s / (t.segments.length - 1);
          seg.point.x = (i / 6) * w + 30 + Math.sin(phase * 0.8 + tt * 4) * 50 * tt + c.x * 30 * tt;
        }
        t.smooth({ type: "geometric" });
      });
      // flowers lean
      flowerNodes.forEach((n) => {
        const dx = (c.x + 0.5) * w - n.baseX;
        const fall = Math.max(0, 1 - Math.abs(dx) / 320);
        const lean = -(dx / 320) * 12 * fall;
        n.group.rotation = lean;
        n.group.scaling = new paper.Point(1 + 0.06 * fall, 1 + 0.06 * fall);
      });
    };

    const onResize = () => {
      paper.project.activeLayer.removeChildren();
      flowerNodes.length = 0;
      tendrils.length = 0;
      drawFrame();
      buildTendrils();
      flowers.forEach(drawFlower);
    };
    view.onResize = onResize;

    return () => {
      paper.project.clear();
    };
  }, [flowers, reduceMotion]);

  return (
    <div
      className="absolute inset-0"
      style={{
        background:
          "radial-gradient(ellipse at 50% 30%, #f3e3bf 0%, #cfa867 60%, #6e4a26 100%)",
      }}
    >
      <canvas
        ref={canvasRef}
        data-paper-resize="true"
        className="absolute inset-0 w-full h-full"
        aria-label="Composición art nouveau con tendrillas doradas"
      />
    </div>
  );
}
