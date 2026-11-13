import { useEffect, useRef, useState } from "react";
import Hls from "hls.js";
import { Channel, markBroken } from "@/lib/iptv";
import { Loader2, AlertTriangle } from "lucide-react";

type Props = {
  channel: Channel | null;
  autoPlay?: boolean;
  onError?: () => void;
  onVideoElement?: (video: HTMLVideoElement | null) => void;
};

export function VideoPlayer({ channel, autoPlay = true, onError, onVideoElement }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const retried = useRef(0);

  useEffect(() => {
    onVideoElement?.(videoRef.current);
    return () => onVideoElement?.(null);
  }, [onVideoElement]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !channel) return;

    setError(false);
    setLoading(true);
    retried.current = 0;

    const cleanup = () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };

    const load = () => {
      cleanup();
      const url = channel.url;
      const isHls = /\.m3u8(\?|$)/i.test(url);

      if (isHls && Hls.isSupported()) {
        const hls = new Hls({ enableWorker: true, lowLatencyMode: true });
        hlsRef.current = hls;
        hls.loadSource(url);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          setLoading(false);
          if (autoPlay) video.play().catch(() => {});
        });
        hls.on(Hls.Events.ERROR, (_e, data) => {
          if (data.fatal) {
            if (retried.current < 1) {
              retried.current++;
              setTimeout(load, 800);
            } else {
              markBroken(channel.id);
              setLoading(false);
              setError(true);
              onError?.();
            }
          }
        });
      } else {
        video.src = url;
        const onCanPlay = () => {
          setLoading(false);
          if (autoPlay) video.play().catch(() => {});
        };
        const onErr = () => {
          if (retried.current < 1) {
            retried.current++;
            setTimeout(load, 800);
          } else {
            markBroken(channel.id);
            setLoading(false);
            setError(true);
            onError?.();
          }
        };
        video.addEventListener("canplay", onCanPlay, { once: true });
        video.addEventListener("error", onErr, { once: true });
      }
    };

    load();
    return cleanup;
  }, [channel, autoPlay, onError]);

  return (
    <div className="relative h-full w-full bg-black">
      <video
        ref={videoRef}
        className="h-full w-full object-contain bg-black"
        playsInline
        controls={false}
        autoPlay={autoPlay}
      />
      {loading && (
        <div className="absolute inset-0 grid place-items-center bg-black/40">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      )}
      {error && (
        <div className="absolute inset-0 grid place-items-center bg-black/70 text-center px-6">
          <div className="flex flex-col items-center gap-3">
            <AlertTriangle className="h-10 w-10 text-destructive" />
            <p className="text-sm text-muted-foreground">Stream unavailable. Try switching channel.</p>
          </div>
        </div>
      )}
    </div>
  );
}
