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

  return (
    <div
      data-no-paint="true"
      className="relative max-w-2xl mx-auto px-6 sm:px-10 py-8 rounded-2xl backdrop-blur-md"
      style={{
        color: ink,
        background: "rgba(255, 252, 245, 0.55)",
        boxShadow: "0 10px 40px rgba(0,0,0,0.08)",
        border: "1px solid rgba(255,255,255,0.5)",
      }}
    >
      <div className="flex items-center justify-between text-xs uppercase tracking-[0.25em] opacity-70 mb-4">
        <span>{dateLabel}</span>
        <span>{styleName}</span>
      </div>

      <blockquote className="font-serif text-2xl sm:text-3xl leading-snug italic">
        <span
          key={lang + poem.es.slice(0, 10)}
          className="inline-block animate-[fadein_500ms_ease-out]"
        >
          “{text}”
        </span>
      </blockquote>

      <figcaption className="mt-5 flex items-center justify-between text-sm">
        <cite className="not-italic font-medium opacity-80">
          — {poem.author}
          {poem.source ? <span className="opacity-60">, {poem.source}</span> : null}
        </cite>
        <button
          onClick={() => setLang((l) => (l === "es" ? "en" : "es"))}
          className="text-xs uppercase tracking-widest border rounded-full px-3 py-1 transition hover:opacity-100 opacity-80"
          style={{ borderColor: ink + "55" }}
          aria-label="Toggle language"
        >
          {lang === "es" ? "EN" : "ES"}
        </button>
      </figcaption>

      <style jsx>{`
        @keyframes fadein {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
