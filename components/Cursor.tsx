"use client";

import { createContext, useContext, useEffect, useState } from "react";

type CursorState = {
  x: number; // -0.5..0.5 from center
  y: number; // -0.5..0.5
  rawX: number; // px
  rawY: number; // px
  active: boolean;
};

const CursorCtx = createContext<CursorState>({
  x: 0,
  y: 0,
  rawX: 0,
  rawY: 0,
  active: false,
});

export function CursorProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<CursorState>({
    x: 0,
    y: 0,
    rawX: 0,
    rawY: 0,
    active: false,
  });

  useEffect(() => {
    let raf = 0;
    let next: CursorState | null = null;
    const flush = () => {
      if (next) setState(next);
      next = null;
      raf = 0;
    };
    const onMove = (e: PointerEvent) => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      next = {
        rawX: e.clientX,
        rawY: e.clientY,
        x: e.clientX / w - 0.5,
        y: e.clientY / h - 0.5,
        active: true,
      };
      if (!raf) raf = requestAnimationFrame(flush);
    };
    const onLeave = () => {
      next = { x: 0, y: 0, rawX: 0, rawY: 0, active: false };
      if (!raf) raf = requestAnimationFrame(flush);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerleave", onLeave);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerleave", onLeave);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return <CursorCtx.Provider value={state}>{children}</CursorCtx.Provider>;
}

export function useCursor() {
  return useContext(CursorCtx);
}
