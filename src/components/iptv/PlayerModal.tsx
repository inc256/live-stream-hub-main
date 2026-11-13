import { useCallback, useEffect, useRef, useState } from "react";
import { useChannels } from "@/hooks/useChannelStore";
import { VideoPlayer } from "./VideoPlayer";
import {
  ListVideo,
  Maximize,
  Pause,
  Play,
  RotateCcw,
  RotateCw,
  Tv,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import { toast } from "sonner";

export function PlayerModal() {
  const { current, playlist, setCurrent, next, prev } = useChannels();
  const [video, setVideo] = useState<HTMLVideoElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [isChannelsOpen, setIsChannelsOpen] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const touchStart = useRef<number | null>(null);
  const playerRef = useRef<HTMLDivElement>(null);
  const hideControlsTimer = useRef<number | null>(null);
  const setVideoElement = useCallback((element: HTMLVideoElement | null) => setVideo(element), []);

  const wakeControls = useCallback(() => {
    setControlsVisible(true);
    if (hideControlsTimer.current !== null) {
      window.clearTimeout(hideControlsTimer.current);
    }
    if (!isChannelsOpen) {
      hideControlsTimer.current = window.setTimeout(() => setControlsVisible(false), 3000);
    }
  }, [isChannelsOpen]);

  useEffect(() => {
    if (!current) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (isChannelsOpen) setIsChannelsOpen(false);
        else setCurrent(null);
      } else if (event.key === "ArrowRight") next();
      else if (event.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [current, isChannelsOpen, next, prev, setCurrent]);

  useEffect(() => {
    if (!video) return;
    const syncPlayback = () => setIsPlaying(!video.paused);
    const syncVolume = () => setIsMuted(video.muted);
    video.addEventListener("play", syncPlayback);
    video.addEventListener("pause", syncPlayback);
    video.addEventListener("volumechange", syncVolume);
    syncPlayback();
    setIsMuted(video.muted);
    return () => {
      video.removeEventListener("play", syncPlayback);
      video.removeEventListener("pause", syncPlayback);
      video.removeEventListener("volumechange", syncVolume);
    };
  }, [video]);

  useEffect(() => {
    setIsChannelsOpen(false);
    setIsPlaying(true);
    setControlsVisible(true);
  }, [current]);

  useEffect(() => {
    if (hideControlsTimer.current !== null) {
      window.clearTimeout(hideControlsTimer.current);
    }
    if (!current || isChannelsOpen) return;
    hideControlsTimer.current = window.setTimeout(() => setControlsVisible(false), 3000);
    return () => {
      if (hideControlsTimer.current !== null) {
        window.clearTimeout(hideControlsTimer.current);
      }
    };
  }, [current, isChannelsOpen]);

  if (!current) return null;

  const togglePlayback = async () => {
    if (!video) return;
    if (video.paused) {
      try {
        await video.play();
      } catch {
        toast.error("Playback could not be started.");
      }
    } else {
      video.pause();
    }
  };

  const skip = (seconds: number) => {
    if (!video) return;
    const seekable = video.seekable;
    if (seekable.length) {
      const start = seekable.start(seekable.length - 1);
      const end = seekable.end(seekable.length - 1);
      video.currentTime = Math.max(start, Math.min(end, video.currentTime + seconds));
    } else if (Number.isFinite(video.duration)) {
      video.currentTime = Math.max(0, Math.min(video.duration, video.currentTime + seconds));
    } else {
      toast.info("Seeking is not available for this live channel.");
    }
  };

  const toggleFullscreen = async () => {
    const player = playerRef.current;
    if (!player) return;
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await player.requestFullscreen();
    } catch {
      toast.error("Fullscreen is not available in this browser.");
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black"
      onPointerMove={wakeControls}
      onPointerDown={wakeControls}
      onPointerDownCapture={wakeControls}
      onClick={wakeControls}
      onTouchStart={(event) => {
        touchStart.current = event.touches[0].clientX;
        wakeControls();
      }}
      onTouchEnd={(event) => {
        if (touchStart.current == null) return;
        const difference = event.changedTouches[0].clientX - touchStart.current;
        if (Math.abs(difference) > 60) (difference < 0 ? next : prev)();
        touchStart.current = null;
      }}
    >
      <div
        ref={playerRef}
        className="absolute inset-0 isolate h-full w-full overflow-hidden rounded-none bg-black shadow-none"
      >
        <VideoPlayer channel={current} onVideoElement={setVideoElement} />

        <div className={`pointer-events-none absolute inset-0 z-10 bg-[linear-gradient(to_bottom,rgba(0,0,0,0.6)_0%,transparent_20%,transparent_70%,rgba(0,0,0,0.85)_100%)] transition-opacity duration-300 ${controlsVisible ? "opacity-100" : "opacity-0"}`} />

        <div className={`absolute inset-x-0 top-0 z-20 flex items-center justify-between gap-3 p-3 transition-all duration-300 sm:gap-5 sm:p-6 lg:p-7 ${controlsVisible ? "translate-y-0 opacity-100" : "-translate-y-3 opacity-0"}`}>
          <div className="flex min-w-0 items-center overflow-hidden rounded-xl border border-white/10 bg-[rgba(50,50,50,0.65)] backdrop-blur-2xl sm:rounded-2xl">
            <button
              onClick={() => setCurrent(null)}
              className="tv-focus relative grid h-10 w-10 shrink-0 place-items-center text-white/90 after:absolute after:right-0 after:top-1/4 after:h-1/2 after:w-px after:bg-white/15 hover:bg-white/15 active:bg-white/25 sm:h-14 sm:w-14"
              aria-label="Close player"
            >
              <X className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
            <div className="flex h-10 min-w-0 items-center gap-2 px-2.5 sm:h-14 sm:gap-3 sm:px-4 sm:pr-5">
              <div className="grid h-6 w-6 shrink-0 place-items-center overflow-hidden rounded-md bg-gradient-to-br from-[#3a3a8e] to-[#5e5ce6] sm:h-8 sm:w-8 sm:rounded-lg">
                {current.logo ? (
                  <img src={current.logo} alt="" className="max-h-full max-w-full object-contain p-1" />
                ) : (
                  <Tv className="h-4 w-4 text-white" />
                )}
              </div>
              <div className="flex min-w-0 flex-col">
                <span className="truncate text-[11px] font-bold tracking-tight text-white sm:text-sm">SupaMax Live</span>
                <span className="max-w-[35vw] truncate text-[9px] font-medium text-white/60 sm:text-[11px]">
                  {current.name}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              if (!video) return;
              video.muted = !video.muted;
              setIsMuted(video.muted);
            }}
            className="tv-focus grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-white/10 bg-[rgba(50,50,50,0.65)] text-white/90 backdrop-blur-2xl hover:bg-white/15 sm:h-14 sm:w-14 sm:rounded-2xl"
            aria-label={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted ? <VolumeX className="h-4 w-4 sm:h-5 sm:w-5" /> : <Volume2 className="h-4 w-4 sm:h-5 sm:w-5" />}
          </button>
        </div>

        {isChannelsOpen && (
          <div className="absolute bottom-20 left-3 right-3 z-30 max-h-[55%] overflow-y-auto rounded-2xl border border-white/10 bg-[rgba(25,25,25,0.88)] p-2 shadow-2xl backdrop-blur-2xl sm:bottom-28 sm:left-8 sm:right-auto sm:w-[min(360px,calc(100%-4rem))]">
            <p className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-white/50">Channels</p>
            {(playlist.length ? playlist : [current]).map((channel) => (
              <button
                key={channel.id}
                onClick={() => {
                  setCurrent(channel);
                  setIsChannelsOpen(false);
                }}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${
                  channel.id === current.id ? "bg-white text-black" : "text-white/85 hover:bg-white/10"
                }`}
              >
                <div className="grid h-8 w-8 shrink-0 place-items-center overflow-hidden rounded-lg bg-white/10">
                  {channel.logo ? (
                    <img src={channel.logo} alt="" className="max-h-full max-w-full object-contain p-1" />
                  ) : (
                    <Tv className="h-4 w-4" />
                  )}
                </div>
                <span className="truncate text-sm font-medium">{channel.name}</span>
              </button>
            ))}
          </div>
        )}

        <div className={`absolute bottom-3 left-3 right-3 z-20 flex items-center justify-between rounded-2xl border border-white/[0.08] bg-[rgba(40,40,40,0.7)] px-2 py-2 shadow-[0_10px_30px_rgba(0,0,0,0.5)] backdrop-blur-2xl transition-all duration-300 sm:bottom-6 sm:left-6 sm:right-6 sm:px-4 sm:py-3 lg:bottom-8 lg:left-8 lg:right-8 lg:px-6 lg:py-4 ${controlsVisible ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"}`}>
          <div className="flex flex-1 items-center">
            <button
              onClick={() => setIsChannelsOpen((open) => !open)}
              className="tv-focus flex h-9 items-center gap-2 rounded-xl border border-white/5 bg-white/[0.08] px-2 text-xs font-semibold text-white/90 hover:border-white/15 hover:bg-white/[0.18] sm:h-12 sm:px-4 sm:text-[15px]"
              aria-label="Open channel list"
              aria-expanded={isChannelsOpen}
            >
              <ListVideo className="h-4 w-4" />
              <span className="hidden sm:inline">Channels</span>
            </button>
          </div>

          <div className="flex flex-1 items-center justify-center gap-1 sm:gap-4 lg:gap-7">
            <button
              onClick={() => skip(-15)}
              className="tv-focus relative grid h-9 w-9 place-items-center rounded-full text-white/90 hover:bg-white/15 sm:h-11 sm:w-11"
              aria-label="Rewind 15 seconds"
            >
              <RotateCcw className="h-5 w-5 sm:h-6 sm:w-6" />
              <span className="absolute left-1/2 top-[56%] -translate-x-1/2 text-[8px] font-bold text-white sm:text-[9px]">15</span>
            </button>
            <button
              onClick={togglePlayback}
              className="tv-focus grid h-11 w-11 place-items-center rounded-full text-white hover:bg-white/15 sm:h-14 sm:w-14"
              aria-label={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? <Pause className="h-5 w-5 fill-current sm:h-7 sm:w-7" /> : <Play className="h-5 w-5 fill-current sm:h-7 sm:w-7" />}
            </button>
            <button
              onClick={() => skip(15)}
              className="tv-focus relative grid h-9 w-9 place-items-center rounded-full text-white/90 hover:bg-white/15 sm:h-11 sm:w-11"
              aria-label="Forward 15 seconds"
            >
              <RotateCw className="h-5 w-5 sm:h-6 sm:w-6" />
              <span className="absolute left-1/2 top-[56%] -translate-x-1/2 text-[8px] font-bold text-white sm:text-[9px]">15</span>
            </button>
          </div>

          <div className="flex flex-1 items-center justify-end">
            <button
              onClick={toggleFullscreen}
              className="tv-focus flex h-9 items-center gap-2 rounded-xl border border-white/5 bg-white/[0.08] px-2 text-xs font-semibold text-white/90 hover:border-white/15 hover:bg-white/[0.18] sm:h-12 sm:px-4 sm:text-[15px]"
              aria-label="Toggle fullscreen"
            >
              <Maximize className="h-4 w-4" />
              <span className="hidden sm:inline">Fullscreen</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
