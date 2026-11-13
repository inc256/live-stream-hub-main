import { useCallback, useEffect, useRef, useState } from "react";
import { Channel } from "@/lib/iptv";
import { ChevronLeft, ChevronRight, Play } from "lucide-react";

type Props = {
  channels: Channel[];
  onPlay: (c: Channel) => void;
};

export function HeroCarousel({ channels, onPlay }: Props) {
  const [index, setIndex] = useState(0);
  const [isHovering, setIsHovering] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const slides = channels.slice(0, 10);
  const slideCount = slides.length;

  const next = useCallback(() => {
    setIndex((current) => (slideCount ? (current + 1) % slideCount : 0));
  }, [slideCount]);
  const prev = useCallback(() => {
    setIndex((current) => (slideCount ? (current - 1 + slideCount) % slideCount : 0));
  }, [slideCount]);

  const handleTouchStart = (event: React.TouchEvent) => {
    touchStartX.current = event.touches[0].clientX;
  };

  const handleTouchEnd = (event: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const difference = touchStartX.current - event.changedTouches[0].clientX;
    if (Math.abs(difference) > 50) {
      if (difference > 0) next();
      else prev();
    }
    touchStartX.current = null;
  };

  useEffect(() => {
    if (slideCount < 2 || isHovering) return;
    const timer = window.setInterval(next, 5000);
    return () => window.clearInterval(timer);
  }, [slideCount, isHovering, next]);

  useEffect(() => {
    setIndex((current) => Math.min(current, Math.max(0, slideCount - 1)));
  }, [slideCount]);

  if (!slideCount) {
    return (
      <div className="mx-4 mt-4 flex h-[min(58vh,560px)] min-h-[360px] items-center justify-center overflow-hidden rounded-[22px] border border-white/[0.05] bg-[radial-gradient(circle_at_20%_10%,#1a1a1f_0%,#0b0b0e_100%)] text-center shadow-[0_30px_60px_rgba(0,0,0,0.7)] md:mx-8">
        <div>
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-white/10">
            <Play className="h-7 w-7 text-white" />
          </div>
          <h2 className="mt-4 text-2xl font-bold text-white">Sports</h2>
          <p className="mt-2 text-sm text-white/60">Loading sports channels...</p>
        </div>
      </div>
    );
  }

  const current = slides[index];

  return (
    <div
      className="w-full px-4 pt-4 md:px-8 md:pt-6"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <section
        className="relative isolate h-[min(58vh,560px)] min-h-[360px] overflow-hidden rounded-[18px] border border-white/[0.05] shadow-[0_30px_60px_rgba(0,0,0,0.7)] sm:rounded-[22px] lg:h-[min(66vh,680px)]"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        aria-label="Featured live channels"
      >
        {current.logo ? (
          <img
            key={current.id}
            src={current.logo}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 h-full w-full animate-[fadeIn_.9s_ease] scale-105 object-cover opacity-65"
            onError={(event) => {
              event.currentTarget.style.display = "none";
            }}
          />
        ) : (
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_35%,rgba(94,92,230,0.34),transparent_42%),linear-gradient(135deg,#24242c,#0b0b0e)]" />
        )}
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,0.94)_0%,rgba(0,0,0,0.78)_32%,rgba(0,0,0,0.35)_62%,rgba(0,0,0,0.05)_100%)]" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-black/60 to-transparent" />

        <div className="relative z-10 flex h-full max-w-[78%] flex-col justify-center gap-3 px-[22px] pb-10 sm:max-w-[62%] sm:gap-4 sm:px-8 lg:px-14">
          <span className="inline-flex w-fit items-center gap-2 rounded-full bg-[rgba(255,59,48,0.92)] px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.09em] text-white shadow-[0_6px_18px_rgba(255,59,48,0.4)]">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
            Sports
          </span>
          <h1 className="line-clamp-2 bg-gradient-to-br from-white to-[#cfcfd8] bg-clip-text text-[28px] font-extrabold leading-[1.02] tracking-[-0.06em] text-transparent [text-shadow:0_6px_30px_rgba(0,0,0,0.6)] sm:text-[38px] lg:text-[52px]">
            {current.name}
          </h1>
          <div className="flex flex-wrap items-center gap-2.5 text-xs font-medium text-white/85 [text-shadow:0_2px_10px_rgba(0,0,0,0.5)] sm:gap-3.5 sm:text-sm">
            <span className="max-w-full truncate">{current.group || current.category}</span>
          </div>
          <button
            onClick={() => onPlay(current)}
            className="tv-focus mt-1 inline-flex w-fit items-center gap-2.5 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold tracking-tight text-[#0b0b0e] shadow-[0_10px_28px_rgba(255,255,255,0.22)] transition hover:scale-[1.04] hover:bg-[#f0f0f5] hover:shadow-[0_14px_36px_rgba(255,255,255,0.32)] sm:px-7 sm:py-3 sm:text-[15px]"
          >
            <Play className="h-4 w-4 fill-current" />
            Watch Now
          </button>
        </div>

        <div className="absolute bottom-[18px] left-[22px] z-20 flex items-center gap-2 sm:bottom-[26px] sm:left-8 lg:left-14">
          {slides.map((slide, slideIndex) => (
            <button
              key={slide.id}
              onClick={() => setIndex(slideIndex)}
              className={`h-1 rounded-full transition-all duration-300 ${
                slideIndex === index
                  ? "w-5 bg-white shadow-[0_0_12px_rgba(255,255,255,0.5)] sm:w-7"
                  : "w-2 bg-white/30 hover:bg-white/55 sm:w-3"
              }`}
              aria-label={`Go to slide ${slideIndex + 1}`}
              aria-current={slideIndex === index ? "true" : undefined}
            />
          ))}
        </div>

        <div className="absolute bottom-[14px] right-4 z-20 flex gap-2.5 sm:bottom-[22px] sm:right-6">
          <button
            onClick={prev}
            className="tv-focus grid h-9 w-9 place-items-center rounded-full border border-white/[0.18] bg-white/[0.12] text-white backdrop-blur-xl transition hover:scale-105 hover:border-white/40 hover:bg-white/[0.28] sm:h-[42px] sm:w-[42px]"
            aria-label="Previous featured channel"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={next}
            className="tv-focus grid h-9 w-9 place-items-center rounded-full border border-white/[0.18] bg-white/[0.12] text-white backdrop-blur-xl transition hover:scale-105 hover:border-white/40 hover:bg-white/[0.28] sm:h-[42px] sm:w-[42px]"
            aria-label="Next featured channel"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </section>
    </div>
  );
}
