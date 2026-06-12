"use client";

import { useEffect, useRef } from "react";
import rough from "roughjs";
import type { Flower } from "@/lib/flowers";
import { useCursor } from "../Cursor";

type Props = { flowers: Flower[]; ink: string; reduceMotion: boolean };

// Sunday — Hand-drawn line art with rough.js. Cursor wakes nearest sketch.
export function LineArt({ flowers, ink, reduceMotion }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const cursor = useCursor();

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    while (svg.firstChild) svg.removeChild(svg.firstChild);

    const w = svg.clientWidth || window.innerWidth;
    const h = svg.clientHeight || window.innerHeight;
    svg.setAttribute("viewBox", `0 0 ${w} ${h}`);
    const rc = rough.svg(svg);

    // ground line
    svg.appendChild(
      rc.line(w * 0.04, h * 0.86, w * 0.96, h * 0.86, {
        stroke: ink,
        strokeWidth: 1,
        roughness: 1.6,
      })
    );

    flowers.forEach((f) => {
      const cx = f.x * w;
      const cy = f.y * h;
      const r = 18 + f.scale * 22;

      const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
      g.dataset.fx = String(cx);
      g.dataset.fy = String(cy);
      g.style.transformBox = "fill-box";
      g.style.transformOrigin = "center bottom";
      g.style.transition = "transform 380ms cubic-bezier(.2,.8,.2,1)";
      svg.appendChild(g);

      // stem
      g.appendChild(
        rc.line(cx, cy + r * 1.6, cx + (Math.random() - 0.5) * 6, cy + r * 0.4, {
          stroke: ink,
          strokeWidth: 1.4,
          roughness: 2,
        })
      );

      // leaf
      g.appendChild(
        rc.ellipse(cx + 14, cy + r * 1.1, 22, 10, {
          stroke: ink,
          strokeWidth: 1,
          roughness: 2.4,
          fill: "transparent",
        })
      );

      // head: flower-specific sketch
      switch (f.species) {
        case "sunflower":
        case "daisy": {
          const petals = f.species === "sunflower" ? 14 : 10;
          for (let i = 0; i < petals; i++) {
            const a = (i / petals) * Math.PI * 2;
            const px = cx + Math.cos(a) * (r * 0.65);
            const py = cy - r * 0.15 + Math.sin(a) * (r * 0.65);
            g.appendChild(
              rc.ellipse(px, py, r * 0.55, r * 0.22, {
                stroke: ink,
                strokeWidth: 1,
                roughness: 2.2,
                fill: "transparent",
              })
            );
          }
          g.appendChild(
            rc.circle(cx, cy - r * 0.1, r * 0.5, {
              stroke: ink,
              strokeWidth: 1.2,
              roughness: 2,
              fill: ink,
              fillStyle: "cross-hatch",
              hachureGap: 3,
              fillWeight: 0.6,
            })
          );
          break;
        }
        case "rose": {
          for (let i = 0; i < 4; i++) {
            g.appendChild(
              rc.circle(cx, cy - r * 0.15, r * (1.1 - i * 0.22), {
                stroke: ink,
                strokeWidth: 1,
                roughness: 2.2,
                fill: "transparent",
              })
            );
          }
          break;
        }
        case "tulip": {
          g.appendChild(
            rc.path(
              `M ${cx - r * 0.6} ${cy + r * 0.2} C ${cx - r * 0.8} ${cy - r * 0.7}, ${cx} ${cy - r * 1.1}, ${cx} ${cy - r * 1.1} C ${cx} ${cy - r * 1.1}, ${cx + r * 0.8} ${cy - r * 0.7}, ${cx + r * 0.6} ${cy + r * 0.2} Z`,
              { stroke: ink, strokeWidth: 1.2, roughness: 2, fill: "transparent" }
            )
          );
          break;
        }
        case "poppy": {
          for (let i = 0; i < 5; i++) {
            const a = (i / 5) * Math.PI * 2;
            g.appendChild(
              rc.ellipse(
                cx + Math.cos(a) * r * 0.4,
                cy - r * 0.15 + Math.sin(a) * r * 0.4,
                r * 0.9,
                r * 1.1,
                { stroke: ink, strokeWidth: 1, roughness: 2.4, fill: "transparent" }
              )
            );
          }
          g.appendChild(rc.circle(cx, cy - r * 0.15, r * 0.35, { stroke: ink, strokeWidth: 1, roughness: 2, fill: ink, fillStyle: "solid" }));
          break;
        }
        case "lily": {
          for (let i = 0; i < 6; i++) {
            const a = (i / 6) * Math.PI * 2;
            g.appendChild(
              rc.ellipse(
                cx + Math.cos(a) * r * 0.45,
                cy - r * 0.15 + Math.sin(a) * r * 0.45,
                r * 0.35,
                r * 1.1,
                { stroke: ink, strokeWidth: 1, roughness: 2.2, fill: "transparent" }
              )
            );
          }
          break;
        }
        case "lavender": {
          for (let i = 0; i < 9; i++) {
            const yy = cy - r * 0.2 - i * 6;
            g.appendChild(
              rc.circle(cx + (i % 2 === 0 ? -3 : 3), yy, 6, {
                stroke: ink,
                strokeWidth: 0.8,
                roughness: 2,
                fill: "transparent",
              })
            );
          }
          break;
        }
      }
    });

    if (reduceMotion) return;

    const onMove = (e: PointerEvent) => {
      const rect = svg.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      Array.from(svg.children).forEach((c) => {
        if (!(c instanceof SVGGElement) || !c.dataset.fx) return;
        const fx = +(c.dataset.fx ?? "0");
        const fy = +(c.dataset.fy ?? "0");
        const dx = mx - fx;
        const dy = my - fy;
        const d = Math.sqrt(dx * dx + dy * dy);
        const falloff = Math.max(0, 1 - d / 220);
        const lean = -((mx - fx) / 220) * 18 * falloff;
        const sc = 1 + 0.18 * falloff;
        c.style.transform = `rotate(${lean}deg) scale(${sc})`;
      });
    };
    window.addEventListener("pointermove", onMove);
    return () => window.removeEventListener("pointermove", onMove);
  }, [flowers, ink, reduceMotion, cursor.active]);

  return (
    <svg
      ref={svgRef}
      className="absolute inset-0 w-full h-full"
      preserveAspectRatio="xMidYMid slice"
      aria-label="Campo de flores dibujado a mano"
    />
  );
}
