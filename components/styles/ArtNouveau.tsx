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

    const fillCol = (hue: number, l = 60, a = 0.65) =>
      new paper.Color(`hsla(${hue}, 55%, ${l}%, ${a})`);
    const goldStroke = (g: paper.Item, width = 1.2) => {
      (g as paper.PathItem).strokeColor = new paper.Color(gold);
      (g as paper.PathItem).strokeWidth = width;
    };

    const drawFlower = (f: Flower) => {
      const w = view.size.width;
      const h = view.size.height;
      const cx = f.x * w;
      const cy = f.y * h;
      const r = 22 + f.scale * 22;
      const group = new paper.Group();

      // stem (curvy art-nouveau whiplash)
      const stem = new paper.Path();
      goldStroke(stem, 1.4);
      stem.add(new paper.Point(cx, cy + r * 2.0));
      const sCtrl = (Math.random() - 0.5) * 18;
      stem.cubicCurveTo(
        new paper.Point(cx - 6 + sCtrl, cy + r * 1.2),
        new paper.Point(cx + 8 - sCtrl, cy + r * 0.5),
        new paper.Point(cx, cy + r * 0.1)
      );
      group.addChild(stem);

      // a curly leaf on the side
      const leaf = new paper.Path();
      goldStroke(leaf, 1.2);
      leaf.fillColor = fillCol((f.hue + 90) % 360, 35, 0.45);
      const lx = cx + (f.id % 2 === 0 ? 14 : -14);
      const ly = cy + r * 1.1;
      leaf.add(new paper.Point(cx, cy + r * 1.3));
      leaf.cubicCurveTo(
        new paper.Point(lx, cy + r * 0.7),
        new paper.Point(lx + 16, ly),
        new paper.Point(lx, ly + 6)
      );
      leaf.cubicCurveTo(
        new paper.Point(lx - 6, ly + 4),
        new paper.Point(cx + 4, cy + r * 1.2),
        new paper.Point(cx, cy + r * 1.3)
      );
      leaf.smooth({ type: "geometric" });
      group.addChild(leaf);

      // species-specific head
      switch (f.species) {
        case "rose": {
          // layered concentric ovals turning inward
          for (let i = 0; i < 5; i++) {
            const layer = new paper.Path();
            const rr = r * (1 - i * 0.15);
            layer.fillColor = fillCol(f.hue + i * 4, 55 - i * 4, 0.55);
            goldStroke(layer, 0.9);
            layer.add(new paper.Point(cx, cy + rr * 0.1));
            layer.cubicCurveTo(
              new paper.Point(cx - rr, cy + rr * 0.1),
              new paper.Point(cx - rr * 0.9, cy - rr),
              new paper.Point(cx, cy - rr)
            );
            layer.cubicCurveTo(
              new paper.Point(cx + rr * 0.9, cy - rr),
              new paper.Point(cx + rr, cy + rr * 0.1),
              new paper.Point(cx, cy + rr * 0.1)
            );
            layer.smooth({ type: "geometric" });
            layer.rotate(i * 30, new paper.Point(cx, cy));
            group.addChild(layer);
          }
          break;
        }
        case "tulip": {
          // 3 cupped petals
          const cup = new paper.Path();
          cup.fillColor = fillCol(f.hue, 60, 0.7);
          goldStroke(cup, 1.4);
          cup.add(new paper.Point(cx - r * 0.7, cy + r * 0.2));
          cup.cubicCurveTo(
            new paper.Point(cx - r * 0.9, cy - r * 0.8),
            new paper.Point(cx, cy - r * 1.3),
            new paper.Point(cx, cy - r * 1.3)
          );
          cup.cubicCurveTo(
            new paper.Point(cx, cy - r * 1.3),
            new paper.Point(cx + r * 0.9, cy - r * 0.8),
            new paper.Point(cx + r * 0.7, cy + r * 0.2)
          );
          cup.cubicCurveTo(
            new paper.Point(cx + r * 0.2, cy + r * 0.05),
            new paper.Point(cx - r * 0.2, cy + r * 0.05),
            new paper.Point(cx - r * 0.7, cy + r * 0.2)
          );
          group.addChild(cup);
          const middle = new paper.Path();
          goldStroke(middle, 1.0);
          middle.add(new paper.Point(cx, cy + r * 0.05));
          middle.lineTo(new paper.Point(cx, cy - r * 1.2));
          group.addChild(middle);
          break;
        }
        case "lily": {
          // 6 elongated trumpet petals
          for (let i = 0; i < 6; i++) {
            const petal = new paper.Path();
            petal.fillColor = fillCol(f.hue + i * 6, 70 - i * 3, 0.55);
            goldStroke(petal, 1.0);
            petal.add(new paper.Point(cx, cy));
            petal.cubicCurveTo(
              new paper.Point(cx - r * 0.25, cy - r * 0.6),
              new paper.Point(cx - r * 0.18, cy - r * 1.4),
              new paper.Point(cx, cy - r * 1.5)
            );
            petal.cubicCurveTo(
              new paper.Point(cx + r * 0.18, cy - r * 1.4),
              new paper.Point(cx + r * 0.25, cy - r * 0.6),
              new paper.Point(cx, cy)
            );
            petal.rotate((i * 360) / 6, new paper.Point(cx, cy));
            group.addChild(petal);
          }
          break;
        }
        case "poppy": {
          // 4 wavy crinkled petals
          for (let i = 0; i < 4; i++) {
            const petal = new paper.Path();
            petal.fillColor = fillCol(f.hue, 55, 0.7);
            goldStroke(petal, 1.0);
            petal.add(new paper.Point(cx, cy));
            petal.cubicCurveTo(
              new paper.Point(cx - r * 0.9, cy - r * 0.4),
              new paper.Point(cx - r * 0.5, cy - r * 1.3),
              new paper.Point(cx, cy - r * 1.2)
            );
            petal.cubicCurveTo(
              new paper.Point(cx + r * 0.5, cy - r * 1.3),
              new paper.Point(cx + r * 0.9, cy - r * 0.4),
              new paper.Point(cx, cy)
            );
            petal.rotate((i * 360) / 4 + 22, new paper.Point(cx, cy));
            group.addChild(petal);
          }
          const seed = new paper.Path.Circle(new paper.Point(cx, cy), r * 0.18);
          seed.fillColor = new paper.Color(ink);
          goldStroke(seed, 0.8);
          group.addChild(seed);
          break;
        }
        case "lavender": {
          // a tall thin spike of clustered florets
          const spike = new paper.Path();
          goldStroke(spike, 1.2);
          spike.add(new paper.Point(cx, cy + r * 0.2));
          spike.lineTo(new paper.Point(cx, cy - r * 2));
          group.addChild(spike);
          for (let i = 0; i < 10; i++) {
            const yy = cy - r * 0.1 - i * (r * 0.2);
            const florett = new paper.Path.Ellipse({
              center: new paper.Point(cx + (i % 2 === 0 ? -3 : 3), yy),
              size: new paper.Size(r * 0.4, r * 0.22),
            });
            florett.fillColor = fillCol(280, 55 + (i % 3) * 6, 0.7);
            goldStroke(florett, 0.8);
            group.addChild(florett);
          }
          break;
        }
        case "daisy": {
          // many narrow petals
          for (let i = 0; i < 12; i++) {
            const petal = new paper.Path.Ellipse({
              center: new paper.Point(cx, cy - r * 0.75),
              size: new paper.Size(r * 0.22, r * 0.7),
            });
            petal.fillColor = fillCol(50, 92, 0.7);
            goldStroke(petal, 0.8);
            petal.rotate((i * 360) / 12, new paper.Point(cx, cy));
            group.addChild(petal);
          }
          const eye = new paper.Path.Circle(new paper.Point(cx, cy), r * 0.22);
          eye.fillColor = new paper.Color(goldLight);
          goldStroke(eye, 0.8);
          group.addChild(eye);
          break;
        }
        case "sunflower":
        default: {
          // double ring of pointy petals
          const ringPetals = (count: number, radius: number, len: number, hue: number, l: number) => {
            for (let i = 0; i < count; i++) {
              const petal = new paper.Path();
              petal.fillColor = fillCol(hue, l, 0.75);
              goldStroke(petal, 0.9);
              petal.add(new paper.Point(cx, cy));
              petal.cubicCurveTo(
                new paper.Point(cx - radius * 0.25, cy - len * 0.4),
                new paper.Point(cx - radius * 0.15, cy - len),
                new paper.Point(cx, cy - len)
              );
              petal.cubicCurveTo(
                new paper.Point(cx + radius * 0.15, cy - len),
                new paper.Point(cx + radius * 0.25, cy - len * 0.4),
                new paper.Point(cx, cy)
              );
              petal.rotate((i * 360) / count, new paper.Point(cx, cy));
              group.addChild(petal);
            }
          };
          ringPetals(14, r * 0.4, r * 1.05, 45, 60);
          ringPetals(10, r * 0.3, r * 0.7, 38, 70);
          const core = new paper.Path.Circle(new paper.Point(cx, cy), r * 0.28);
          core.fillColor = new paper.Color("#3a230f");
          goldStroke(core, 1);
          group.addChild(core);
          break;
        }
      }

      flowerNodes.push({ group, base: f, baseX: cx, baseY: cy });
      group.applyMatrix = false;
      group.pivot = new paper.Point(cx, cy + r * 2);
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
