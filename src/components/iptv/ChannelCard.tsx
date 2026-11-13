import { Channel } from "@/lib/iptv";
import { Tv } from "lucide-react";
import { forwardRef } from "react";

type Props = {
  channel: Channel;
  focused?: boolean;
  onSelect?: () => void;
  size?: "sm" | "md" | "lg";
  layout?: "rail" | "grid";
};

export const ChannelCard = forwardRef<HTMLButtonElement, Props>(
  ({ channel, focused, onSelect, size = "md", layout = "rail" }, ref) => {
    const dims =
      layout === "grid"
        ? "aspect-[4/3] w-full min-w-0"
        : {
            sm: "aspect-[4/3] w-44",
            md: "aspect-[4/3] w-56",
            lg: "aspect-[4/3] w-64",
          }[size];

    return (
      <button
        ref={ref}
        data-focused={focused ? "true" : "false"}
        onClick={onSelect}
        className={`tv-focus group relative isolate overflow-hidden rounded-[18px] border border-[rgba(255,200,80,0.35)] bg-[#1a1a1f] text-left shadow-[0_16px_34px_rgba(0,0,0,0.6),0_0_44px_rgba(255,200,80,0.08)] transition-[transform,box-shadow,border-color] duration-300 ease-out hover:-translate-y-1.5 hover:scale-[1.015] hover:border-[rgba(255,200,80,0.6)] hover:shadow-[0_28px_52px_rgba(0,0,0,0.75),0_0_70px_rgba(255,200,80,0.18)] ${layout === "rail" ? "shrink-0" : ""} ${dims}`}
      >
        {channel.logo ? (
          <img
            src={channel.logo}
            alt=""
            aria-hidden="true"
            loading="lazy"
            className="absolute inset-0 h-full w-full scale-105 object-cover transition-transform duration-700 ease-in-out group-hover:scale-[1.08]"
            onError={(event) => {
              event.currentTarget.style.display = "none";
            }}
          />
        ) : (
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_25%,rgba(94,92,230,0.24),transparent_55%),linear-gradient(135deg,#24242c,#111114)]" />
        )}
        <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(0,0,0,0.95)_0%,rgba(0,0,0,0.7)_30%,rgba(0,0,0,0.25)_60%,rgba(0,0,0,0.05)_80%,rgba(0,0,0,0.3)_100%)] transition-opacity duration-300 group-hover:opacity-[0.85]" />
        <span className="absolute right-3.5 top-3.5 z-10 rounded-full bg-[#ff3b30] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.06em] text-white shadow-[0_4px_12px_rgba(255,59,48,0.4)]">
          Live
        </span>
        <div className="relative z-10 flex h-full items-end p-4 sm:p-[22px]">
          <div className="flex min-w-0 items-center gap-3.5">
            <div className="relative grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-[14px] border border-white/[0.18] bg-white/[0.14] text-white shadow-[0_6px_16px_rgba(0,0,0,0.5)] backdrop-blur-xl transition-transform duration-300 ease-out group-hover:rotate-[-3deg] group-hover:scale-110 sm:h-[54px] sm:w-[54px]">
              <Tv className="h-6 w-6" />
              {channel.logo && (
                <img
                  src={channel.logo}
                  alt={channel.name}
                  loading="lazy"
                  className="absolute max-h-full max-w-full object-contain p-2"
                  onError={(event) => {
                    event.currentTarget.style.display = "none";
                  }}
                />
              )}
            </div>
            <div className="flex min-w-0 flex-col gap-0.5">
              <h3 className="truncate text-base font-bold tracking-[-0.025em] text-white [text-shadow:0_2px_10px_rgba(0,0,0,0.7)] sm:text-xl">
                {channel.name}
              </h3>
              <span className="truncate text-[10px] font-semibold uppercase tracking-[0.08em] text-white/70 [text-shadow:0_2px_8px_rgba(0,0,0,0.7)] sm:text-xs">
                {channel.group || channel.category}
              </span>
            </div>
          </div>
        </div>
      </button>
    );
  },
);

ChannelCard.displayName = "ChannelCard";
