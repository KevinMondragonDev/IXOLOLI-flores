"use client";

import { useState } from "react";
import type { Poem } from "@/lib/poems";

type Props = {
  poem: Poem;
  styleNameEs: string;
  styleNameEn: string;
  dateLabel: string;
  ink: string;
};

export function PoemCard({ poem, styleNameEs, styleNameEn, dateLabel, ink }: Props) {
  const [lang, setLang] = useState<"es" | "en">("es");
  const text = lang === "es" ? poem.es : poem.en;
  const styleName = lang === "es" ? styleNameEs : styleNameEn;

  // Detect if ink is light (for dark backgrounds) or dark (for light backgrounds)
  const isLight = ink.startsWith("#f") || ink.startsWith("#e") || ink === "#fffde7" || ink === "#f0e6ff";
  const cardBg = isLight
    ? "rgba(0, 0, 0, 0.45)"
    : "rgba(255, 252, 245, 0.72)";
  const cardBorder = isLight
    ? "rgba(255, 255, 255, 0.15)"
    : "rgba(255, 255, 255, 0.6)";
  const cardShadow = isLight
    ? "0 8px 32px rgba(0,0,0,0.5), 0 2px 8px rgba(0,0,0,0.3)"
    : "0 8px 40px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)";

  return (
    <div
      data-no-paint="true"
      className="relative max-w-2xl mx-auto px-7 sm:px-12 py-9 rounded-3xl"
      style={{
        color: ink,
        background: cardBg,
        backdropFilter: "blur(24px) saturate(1.4)",
        WebkitBackdropFilter: "blur(24px) saturate(1.4)",
        boxShadow: cardShadow,
        border: `1px solid ${cardBorder}`,
      }}
    >
      {/* Top meta row */}
      <div className="flex items-center justify-between mb-6">
        <span
          className="text-[10px] uppercase tracking-[0.3em] font-medium"
          style={{ opacity: 0.55 }}
        >
          {dateLabel}
        </span>
        <span
          className="text-[10px] uppercase tracking-[0.3em] font-medium"
          style={{ opacity: 0.55 }}
        >
          {styleName}
        </span>
      </div>

      {/* Ornamental divider */}
      <div
        className="mb-6 flex items-center gap-3"
        style={{ opacity: 0.3 }}
      >
        <div className="flex-1 h-px" style={{ background: `linear-gradient(to right, transparent, ${ink})` }} />
        <span style={{ fontSize: 10 }}>✦</span>
        <div className="flex-1 h-px" style={{ background: `linear-gradient(to left, transparent, ${ink})` }} />
      </div>

      {/* Quote */}
      <blockquote
        key={lang + poem.es.slice(0, 12)}
        className="font-serif leading-relaxed italic poem-fade"
        style={{ fontSize: "clamp(1.1rem, 2.8vw, 1.6rem)", letterSpacing: "0.01em" }}
      >
        <span
          style={{
            position: "relative",
            display: "block",
          }}
        >
          <span
            className="absolute -left-4 -top-2 font-serif"
            style={{ fontSize: "3em", lineHeight: 1, opacity: 0.15 }}
            aria-hidden
          >
            "
          </span>
          {text}
          <span
            className="font-serif"
            style={{ fontSize: "1.4em", lineHeight: 1, opacity: 0.15, marginLeft: "0.1em" }}
            aria-hidden
          >
            "
          </span>
        </span>
      </blockquote>

      {/* Bottom ornamental divider */}
      <div
        className="mt-7 mb-5 flex items-center gap-3"
        style={{ opacity: 0.2 }}
      >
        <div className="flex-1 h-px" style={{ background: `linear-gradient(to right, transparent, ${ink})` }} />
        <span style={{ fontSize: 8 }}>◆</span>
        <div className="flex-1 h-px" style={{ background: `linear-gradient(to left, transparent, ${ink})` }} />
      </div>

      {/* Author + lang toggle */}
      <figcaption className="flex items-end justify-between gap-4">
        <cite className="not-italic">
          <div
            className="font-sans font-semibold tracking-wide"
            style={{ fontSize: "0.85rem", opacity: 0.9 }}
          >
            — {poem.author}
          </div>
          {poem.source && (
            <div
              className="font-serif italic mt-0.5"
              style={{ fontSize: "0.72rem", opacity: 0.55, letterSpacing: "0.05em" }}
            >
              {poem.source}
            </div>
          )}
        </cite>

        <button
          onClick={() => setLang((l) => (l === "es" ? "en" : "es"))}
          className="shrink-0 text-[10px] uppercase tracking-[0.25em] rounded-full px-4 py-1.5 transition-all duration-200 font-medium"
          style={{
            borderWidth: 1,
            borderStyle: "solid",
            borderColor: `${ink}40`,
            opacity: 0.75,
            background: `${ink}10`,
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.75")}
          aria-label="Cambiar idioma"
        >
          {lang === "es" ? "EN" : "ES"}
        </button>
      </figcaption>

      <style jsx>{`
        .poem-fade {
          animation: poemFadeIn 0.7s cubic-bezier(0.22, 1, 0.36, 1) both;
        }
        @keyframes poemFadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
            filter: blur(4px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
            filter: blur(0);
          }
        }
      `}</style>
    </div>
  );
}
