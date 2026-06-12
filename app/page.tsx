import { todayKey } from "@/lib/seed";
import { Experience } from "@/components/Experience";

export const dynamic = "force-dynamic";

export default function HomePage() {
  const now = new Date();
  const dateKey = todayKey(now);
  const dayOfWeek = now.getDay();
  const dateLabelEs = new Intl.DateTimeFormat("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(now);

  return (
    <Experience
      dateKey={dateKey}
      dayOfWeek={dayOfWeek}
      dateLabelEs={dateLabelEs}
    />
  );
}
