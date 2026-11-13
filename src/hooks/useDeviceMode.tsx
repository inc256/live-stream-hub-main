import { useEffect, useState } from "react";

export type DeviceMode = "mobile" | "desktop" | "tv";

export function useDeviceMode(): DeviceMode {
  const get = (): DeviceMode => {
    if (typeof window === "undefined") return "desktop";
    const w = window.innerWidth;
    const touch = "ontouchstart" in window || navigator.maxTouchPoints > 0;
    if (w >= 1200 && !touch) return "tv";
    if (w < 768 || touch) return w >= 1200 ? "tv" : "mobile";
    return "desktop";
  };
  const [mode, setMode] = useState<DeviceMode>(get);
  useEffect(() => {
    const onResize = () => setMode(get());
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  return mode;
}
