import { Layout } from "@/components/iptv/Layout";
import { useState } from "react";
import { ArrowLeft, Trophy } from "lucide-react";

const LEAGUES = [
  { id: "premier", name: "Premier League", url: "https://sportslivetoday.com/live?sportType=football&currentTagId=4663840386660596064" },
  { id: "europa", name: "Europa League", url: "https://sportslivetoday.com/live?sportType=football&currentTagId=6121317816068372832" },
  { id: "bundesliga", name: "Bundesliga", url: "https://sportslivetoday.com/live?sportType=football&currentTagId=2628213355089131872" },
  { id: "laliga", name: "La Liga", url: "https://sportslivetoday.com/live?sportType=football&currentTagId=8879209637879380320" },
  { id: "ligue1", name: "Ligue 1", url: "https://sportslivetoday.com/live?sportType=football&currentTagId=2249910986390010208" },
  { id: "seriea", name: "Serie A", url: "https://sportslivetoday.com/live?sportType=football&currentTagId=4807955574736451936" },
];

const Football = () => {
  const [active, setActive] = useState<typeof LEAGUES[number] | null>(null);

  if (active) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-background">
        <div className="flex items-center gap-3 border-b border-border bg-black/80 px-4 py-3 backdrop-blur">
          <button
            onClick={() => setActive(null)}
            className="tv-focus grid h-10 w-10 place-items-center rounded-full bg-secondary text-foreground"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h2 className="text-base font-bold">{active.name}</h2>
        </div>
        <iframe
          src={active.url}
          className="h-full w-full flex-1 border-0"
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }

  return (
    <Layout>
      <div className="px-4 pt-8 md:px-8">
        <h1 className="flex items-center gap-3 text-3xl font-extrabold md:text-4xl">
          <Trophy className="h-8 w-8 text-primary" />
          Football
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">Live matches from top European leagues.</p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {LEAGUES.map((l) => (
            <button
              key={l.id}
              onClick={() => setActive(l)}
              className="tv-focus group relative flex h-40 flex-col justify-between overflow-hidden rounded-2xl border border-border bg-[var(--gradient-card)] p-5 text-left"
              style={{ boxShadow: "var(--shadow-tile)" }}
            >
              <span className="grid h-14 w-14 place-items-center rounded-2xl border border-white/10 bg-white/[0.06] text-primary">
                <Trophy className="h-7 w-7" />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <span className="live-dot" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-primary">Live</span>
                </div>
                <p className="mt-1 text-xl font-extrabold">{l.name}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default Football;
