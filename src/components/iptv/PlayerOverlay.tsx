import { Channel } from "@/lib/iptv";
import { Tv } from "lucide-react";
import { useEffect, useState } from "react";

export function ChannelOverlay({ channel }: { channel: Channel | null }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    if (!channel) return;
    setShow(true);
    const t = setTimeout(() => setShow(false), 2600);
    return () => clearTimeout(t);
  }, [channel]);

  if (!channel || !show) return null;

  return (
    <div className="pointer-events-none absolute left-6 top-6 z-20 animate-overlay-fade">
      <div className="flex items-center gap-3 rounded-2xl border border-border bg-black/70 px-4 py-3 backdrop-blur-md">
        <div className="grid h-12 w-12 place-items-center overflow-hidden rounded-lg bg-secondary">
          {channel.logo ? (
            <img src={channel.logo} alt="" className="max-h-full max-w-full object-contain" />
          ) : (
            <Tv className="h-6 w-6 text-muted-foreground" />
          )}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="live-dot" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-white/80">Live</span>
          </div>
          <p className="text-base font-bold text-white">{channel.name}</p>
        </div>
      </div>
    </div>
  );
}
