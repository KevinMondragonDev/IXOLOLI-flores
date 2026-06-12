import { rngForDate, todayKey } from "@/lib/seed";
import { generateField } from "@/lib/flowers";
import { PALETTES } from "@/lib/palettes";
import { poemForSeed } from "@/lib/poems";
import { styleForDate } from "@/lib/styles";
import { FlowerField } from "@/components/FlowerField";
import { PoemCard } from "@/components/PoemCard";

export const dynamic = "force-dynamic";

export default function HomePage() {
  const now = new Date();
  const dateKey = todayKey(now);
  const rng = rngForDate(dateKey);
  const style = styleForDate(now);
  const palette = PALETTES[style.id];
  const count = 40 + Math.floor(rng() * 30);
  const flowers = generateField(rng, count, palette);
  const poem = poemForSeed(rng);

  const dateLabelEs = new Intl.DateTimeFormat("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(now);

  return (
    <main
      className="relative min-h-screen w-full overflow-hidden"
      style={{ background: style.background, color: style.ink }}
    >
      <FlowerField
        flowers={flowers}
        styleId={style.id}
        ink={style.ink}
        reduceMotion={false}
      />

      <div className="relative z-10 flex flex-col min-h-screen">
        <header className="px-6 sm:px-10 pt-8 flex items-center justify-between">
          <div className="font-serif text-xl tracking-wide opacity-80">
            IXOLOLI<span className="opacity-60"> · campo de poetas</span>
          </div>
          <div className="text-xs uppercase tracking-[0.25em] opacity-60">
            {dateLabelEs}
          </div>
        </header>

        <div className="flex-1" />

        <section className="px-4 sm:px-8 pb-10 sm:pb-16">
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
    </main>
  );
}
