"use client";

import { useEffect, useMemo, useState } from "react";
import { rngForDate } from "@/lib/seed";
import { generateField } from "@/lib/flowers";
import { PALETTES } from "@/lib/palettes";
import { poemForSeed, POEMS } from "@/lib/poems";
import { STYLES, STYLE_BY_DAY, type StyleId } from "@/lib/styles";
import { FlowerField } from "./FlowerField";
import { PoemCard } from "./PoemCard";

type Props = { dateKey: string; dayOfWeek: number; dateLabelEs: string };

export function Experience({ dateKey, dayOfWeek, dateLabelEs }: Props) {
  const [styleOverride, setStyleOverride] = useState<StyleId | null>(null);
  const [poemIndexOverride, setPoemIndexOverride] = useState<number | null>(null);
  const [devUnlocked, setDevUnlocked] = useState(false);
  const [devOpen, setDevOpen] = useState(false);
  const [codeInput, setCodeInput] = useState("");
  const [codeError, setCodeError] = useState(false);

  // Restore dev unlock from localStorage
  useEffect(() => {
    try {
      if (localStorage.getItem("ixololi:dev") === "1") setDevUnlocked(true);
    } catch {}
  }, []);

  const styleId = styleOverride ?? STYLE_BY_DAY[dayOfWeek];
  const style = STYLES[styleId];

  // Re-seed when overrides change so the field regenerates visibly
  const { flowers, poem } = useMemo(() => {
    const seedKey = `${dateKey}|${styleOverride ?? "auto"}|${poemIndexOverride ?? "auto"}`;
    const rng = rngForDate(seedKey);
    const palette = PALETTES[styleId];
    const count = 40 + Math.floor(rng() * 30);
    const f = generateField(rng, count, palette);
    const p = poemIndexOverride != null ? POEMS[poemIndexOverride] : poemForSeed(rng);
    return { flowers: f, poem: p };
  }, [dateKey, styleId, styleOverride, poemIndexOverride]);

  const submitCode = () => {
    if (codeInput.trim() === "1234") {
      setDevUnlocked(true);
      setCodeError(false);
      setCodeInput("");
      try {
        localStorage.setItem("ixololi:dev", "1");
      } catch {}
    } else {
      setCodeError(true);
    }
  };

  return (
    <main
      className="relative min-h-screen w-full overflow-hidden"
      style={{ background: style.background, color: style.ink }}
    >
      <FlowerField
        key={styleId + (poemIndexOverride ?? "")}
        flowers={flowers}
        styleId={styleId}
        ink={style.ink}
        reduceMotion={false}
      />

      <div className="relative z-10 flex flex-col min-h-screen pointer-events-none">
        <header className="px-6 sm:px-10 pt-8 flex items-center justify-between pointer-events-auto">
          <div className="font-serif text-xl tracking-wide opacity-80">
            IXOLOLI<span className="opacity-60"> · campo de poetas</span>
          </div>
          <div className="text-xs uppercase tracking-[0.25em] opacity-60">
            {dateLabelEs}
          </div>
        </header>

        <div className="flex-1" />

        <section className="px-4 sm:px-8 pb-10 sm:pb-16 pointer-events-auto">
          <PoemCard
            poem={poem}
            styleNameEs={style.nameEs}
            styleNameEn={style.nameEn}
            dateLabel={dateKey}
            ink={style.ink}
          />
          <p className="mt-4 text-center text-xs opacity-60">
            Mueve el cursor entre las flores · click para hacer florecer una nueva · vuelve mañana para otro campo
          </p>
        </section>
      </div>

      {/* Dev trigger */}
      <button
        data-no-paint="true"
        onClick={() => setDevOpen((v) => !v)}
        className="fixed bottom-3 right-3 z-50 w-8 h-8 rounded-full bg-black/70 hover:bg-black text-white text-[12px] transition pointer-events-auto"
        style={{ border: "1px solid rgba(255,255,255,0.2)" }}
        aria-label="Modo desarrollador"
        title="Dev"
      >
        ✦
      </button>

      {devOpen && (
        <div
          data-no-paint="true"
          className="fixed bottom-12 right-3 z-50 w-72 rounded-xl p-4 shadow-2xl pointer-events-auto"
          style={{
            background: "#141418",
            color: "#f5f5f5",
            border: "1px solid rgba(255,255,255,0.1)",
            isolation: "isolate",
          }}
        >
          <div className="text-xs uppercase tracking-widest opacity-70 mb-3">
            Dev mode
          </div>

          {!devUnlocked ? (
            <div>
              <label className="text-xs opacity-80">Código de acceso</label>
              <div className="flex gap-2 mt-1">
                <input
                  type="password"
                  inputMode="numeric"
                  value={codeInput}
                  onChange={(e) => {
                    setCodeInput(e.target.value);
                    setCodeError(false);
                  }}
                  onKeyDown={(e) => e.key === "Enter" && submitCode()}
                  className="flex-1 bg-white/10 border border-white/15 rounded px-2 py-1 text-sm outline-none focus:border-white/40"
                  placeholder="****"
                  autoFocus
                />
                <button
                  onClick={submitCode}
                  className="px-3 py-1 text-xs uppercase tracking-widest bg-white text-black rounded"
                >
                  OK
                </button>
              </div>
              {codeError && (
                <div className="text-[11px] text-red-300 mt-2">Código incorrecto</div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <div className="text-xs opacity-70 mb-1">Estilo</div>
                <div className="flex flex-wrap gap-1.5">
                  <Chip
                    active={styleOverride === null}
                    onClick={() => setStyleOverride(null)}
                  >
                    Auto
                  </Chip>
                  {(Object.keys(STYLES) as StyleId[]).map((id) => (
                    <Chip
                      key={id}
                      active={styleOverride === id}
                      onClick={() => setStyleOverride(id)}
                    >
                      {STYLES[id].nameEs}
                    </Chip>
                  ))}
                </div>
              </div>

              <div>
                <div className="text-xs opacity-70 mb-1 flex justify-between">
                  <span>Poema</span>
                  <span className="opacity-50">
                    {poemIndexOverride === null
                      ? "auto"
                      : `${poemIndexOverride + 1}/${POEMS.length}`}
                  </span>
                </div>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => setPoemIndexOverride(null)}
                    className="text-[11px] px-2 py-1 rounded bg-white/10 hover:bg-white/20"
                  >
                    Auto
                  </button>
                  <button
                    onClick={() =>
                      setPoemIndexOverride(
                        poemIndexOverride === null
                          ? 0
                          : (poemIndexOverride - 1 + POEMS.length) % POEMS.length
                      )
                    }
                    className="text-[11px] px-2 py-1 rounded bg-white/10 hover:bg-white/20"
                  >
                    ←
                  </button>
                  <button
                    onClick={() =>
                      setPoemIndexOverride(
                        poemIndexOverride === null
                          ? 0
                          : (poemIndexOverride + 1) % POEMS.length
                      )
                    }
                    className="text-[11px] px-2 py-1 rounded bg-white/10 hover:bg-white/20"
                  >
                    →
                  </button>
                  <button
                    onClick={() =>
                      setPoemIndexOverride(Math.floor(Math.random() * POEMS.length))
                    }
                    className="text-[11px] px-2 py-1 rounded bg-white/10 hover:bg-white/20"
                  >
                    Random
                  </button>
                </div>
              </div>

              <div className="flex justify-between pt-2 border-t border-white/10">
                <button
                  onClick={() => {
                    setStyleOverride(null);
                    setPoemIndexOverride(null);
                  }}
                  className="text-[11px] opacity-70 hover:opacity-100"
                >
                  Reset
                </button>
                <button
                  onClick={() => {
                    setDevUnlocked(false);
                    setStyleOverride(null);
                    setPoemIndexOverride(null);
                    try {
                      localStorage.removeItem("ixololi:dev");
                    } catch {}
                  }}
                  className="text-[11px] opacity-70 hover:opacity-100"
                >
                  Salir
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </main>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={
        "text-[11px] px-2 py-1 rounded-full border transition " +
        (active
          ? "bg-white text-black border-white"
          : "bg-white/5 border-white/15 hover:bg-white/15")
      }
    >
      {children}
    </button>
  );
}
