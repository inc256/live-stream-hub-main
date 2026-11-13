import { Channel } from "@/lib/iptv";
import { ChannelCard } from "./ChannelCard";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

const CHANNELS_PER_BATCH = 20;

type Props = {
  title: string;
  emoji?: string;
  channels: Channel[];
  onSelect: (c: Channel) => void;
  focusedIndex?: number;
  size?: "sm" | "md" | "lg";
};

export function ChannelRail({ title, channels, onSelect, focusedIndex, size }: Props) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [visibleCount, setVisibleCount] = useState(CHANNELS_PER_BATCH);
  const [canScrollBackward, setCanScrollBackward] = useState(false);
  const [canScrollForward, setCanScrollForward] = useState(false);
  const previousVisibleCount = useRef(visibleCount);

  const updateScrollButtons = useCallback(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    setCanScrollBackward(scroller.scrollLeft > 1);
    setCanScrollForward(scroller.scrollLeft + scroller.clientWidth < scroller.scrollWidth - 1);
  }, []);

  const scrollRail = (direction: -1 | 1) => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    scroller.scrollBy({ left: direction * scroller.clientWidth * 0.8, behavior: "smooth" });
  };

  useEffect(() => {
    if (focusedIndex == null) return;
    const el = itemRefs.current[focusedIndex];
    el?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }, [focusedIndex]);

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    updateScrollButtons();
    scroller.addEventListener("scroll", updateScrollButtons, { passive: true });
    window.addEventListener("resize", updateScrollButtons);

    const handleWheel = (event: WheelEvent) => {
      if (scroller.scrollWidth <= scroller.clientWidth) return;
      if (Math.abs(event.deltaY) > Math.abs(event.deltaX)) {
        event.preventDefault();
        scroller.scrollLeft += event.deltaY;
      }
    };

    scroller.addEventListener("wheel", handleWheel, { passive: false });
    return () => {
      scroller.removeEventListener("scroll", updateScrollButtons);
      scroller.removeEventListener("wheel", handleWheel);
      window.removeEventListener("resize", updateScrollButtons);
    };
  }, [updateScrollButtons]);

  useEffect(() => {
    if (previousVisibleCount.current === visibleCount) return;
    previousVisibleCount.current = visibleCount;
    const scroller = scrollerRef.current;
    if (scroller) {
      requestAnimationFrame(() => {
        scroller.scrollTo({ left: scroller.scrollWidth, behavior: "smooth" });
      });
    }
  }, [visibleCount]);

  if (!channels.length) return null;
  const visibleChannels = channels.slice(0, visibleCount);
  const remainingCount = channels.length - visibleChannels.length;

  return (
    <section className="space-y-3">
      <h2 className="px-4 text-xl font-semibold tracking-tight md:px-8 md:text-2xl">
        {title}
        <span className="ml-3 text-sm font-medium text-muted-foreground">{channels.length}</span>
      </h2>
      <div className="group/rail relative">
        <div
          ref={scrollerRef}
          className="scrollbar-hide flex gap-3 overflow-x-auto overflow-y-hidden touch-pan-x overscroll-x-contain px-4 pb-3 md:gap-4 md:px-8 [-webkit-overflow-scrolling:touch] [scroll-behavior:smooth]"
        >
          {visibleChannels.map((c, i) => (
            <ChannelCard
              key={c.id}
              ref={(el) => (itemRefs.current[i] = el)}
              channel={c}
              size={size}
              focused={focusedIndex === i}
              onSelect={() => onSelect(c)}
            />
          ))}
          {remainingCount > 0 && (
            <button
              type="button"
              onClick={() => setVisibleCount((count) => count + CHANNELS_PER_BATCH)}
              className={`tv-focus grid shrink-0 place-items-center rounded-[18px] border border-dashed border-white/25 bg-white/[0.06] px-4 text-center text-sm font-semibold text-white/75 transition hover:border-white/50 hover:bg-white/[0.12] hover:text-white ${
                size === "sm" ? "aspect-[4/3] w-44" : size === "lg" ? "aspect-[4/3] w-64" : "aspect-[4/3] w-56"
              }`}
              aria-label={`Load ${Math.min(CHANNELS_PER_BATCH, remainingCount)} more channels in ${title}`}
            >
              <span>
                <ArrowRight className="mx-auto mb-2 h-5 w-5" />
                Load {Math.min(CHANNELS_PER_BATCH, remainingCount)} more
              </span>
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={() => scrollRail(-1)}
          disabled={!canScrollBackward}
          className="tv-focus absolute left-2 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 place-items-center rounded-full border border-white/15 bg-black/70 text-white opacity-0 shadow-xl backdrop-blur transition disabled:opacity-0 md:grid group-hover/rail:opacity-100"
          aria-label={`Scroll ${title} backward`}
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={() => scrollRail(1)}
          disabled={!canScrollForward}
          className="tv-focus absolute right-2 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 place-items-center rounded-full border border-white/15 bg-black/70 text-white opacity-0 shadow-xl backdrop-blur transition disabled:opacity-0 md:grid group-hover/rail:opacity-100"
          aria-label={`Scroll ${title} forward`}
        >
          <ArrowRight className="h-5 w-5" />
        </button>
      </div>
    </section>
  );
}
