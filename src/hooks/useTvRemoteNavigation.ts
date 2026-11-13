import { useEffect } from "react";

type Direction = "up" | "down" | "left" | "right";

function getDirection(key: string): Direction | null {
  switch (key) {
    case "ArrowUp":
      return "up";
    case "ArrowDown":
      return "down";
    case "ArrowLeft":
      return "left";
    case "ArrowRight":
      return "right";
    default:
      return null;
  }
}

function isFocusable(element: HTMLElement): boolean {
  if (element.matches(":disabled, [aria-disabled='true'], [aria-hidden='true']")) return false;
  if (!element.getClientRects().length) return false;
  const style = window.getComputedStyle(element);
  return style.visibility !== "hidden" && style.display !== "none";
}

export function useTvRemoteNavigation() {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const direction = getDirection(event.key);
      if (!direction || event.altKey || event.ctrlKey || event.metaKey || event.defaultPrevented) return;
      if (document.querySelector('[aria-label="Close player"]')) return;

      const activeElement = document.activeElement;
      if (
        activeElement instanceof HTMLElement &&
        activeElement.matches("input, textarea, select, [contenteditable='true']")
      ) {
        return;
      }

      const candidates = Array.from(
        document.querySelectorAll<HTMLElement>(
          "a[href], button, input, select, textarea, [tabindex]:not([tabindex='-1'])",
        ),
      ).filter(isFocusable);

      if (!(activeElement instanceof HTMLElement) || !candidates.includes(activeElement)) {
        const firstCandidate = candidates.find((candidate) => candidate.matches(".tv-focus")) ?? candidates[0];
        if (firstCandidate) {
          event.preventDefault();
          firstCandidate.focus();
        }
        return;
      }

      const activeRect = activeElement.getBoundingClientRect();
      const activeX = activeRect.left + activeRect.width / 2;
      const activeY = activeRect.top + activeRect.height / 2;
      let nearest: HTMLElement | null = null;
      let nearestScore = Number.POSITIVE_INFINITY;

      for (const candidate of candidates) {
        if (candidate === activeElement) continue;
        const rect = candidate.getBoundingClientRect();
        const deltaX = rect.left + rect.width / 2 - activeX;
        const deltaY = rect.top + rect.height / 2 - activeY;
        const isInDirection =
          direction === "left" ? deltaX < -1 :
          direction === "right" ? deltaX > 1 :
          direction === "up" ? deltaY < -1 : deltaY > 1;
        if (!isInDirection) continue;

        const primaryDistance = direction === "left" || direction === "right"
          ? Math.abs(deltaX)
          : Math.abs(deltaY);
        const crossDistance = direction === "left" || direction === "right"
          ? Math.abs(deltaY)
          : Math.abs(deltaX);
        const score = primaryDistance + crossDistance * 1.5;
        if (score < nearestScore) {
          nearest = candidate;
          nearestScore = score;
        }
      }

      if (nearest) {
        event.preventDefault();
        nearest.focus();
        nearest.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" });
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);
}
