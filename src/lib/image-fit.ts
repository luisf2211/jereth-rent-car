import type { ImageFit, ImageFits } from "@/types/vehicle";

/** Default framing: centered, no zoom. */
export const DEFAULT_FIT: ImageFit = { x: 50, y: 50, zoom: 1 };

/**
 * Retrieve the ImageFit for a specific key from an ImageFits map.
 * Returns DEFAULT_FIT when the map is null/undefined or the key is missing.
 */
export function getFit(fits: ImageFits | null | undefined, key: string): ImageFit {
  if (!fits || !(key in fits)) return DEFAULT_FIT;
  const f = fits[key];
  return {
    x: f.x ?? 50,
    y: f.y ?? 50,
    zoom: f.zoom ?? 1,
  };
}

/**
 * Convert an ImageFit into CSS properties that implement the framing.
 *
 * Strategy: the `<img>` is placed inside a container with `overflow: hidden`.
 * We scale the image by `zoom` and shift its center to (x%, y%) using
 * `transform`. This avoids touching `object-position` (which only works with
 * `object-fit: cover`) and works regardless of container aspect ratio.
 *
 * Usage:
 *   <div style={{ position: "relative", overflow: "hidden", aspectRatio: "4/3" }}>
 *     <img src={url} alt="" style={{ ...fitToStyle(fit), position: "absolute", inset: 0, width: "100%", height: "100%" }} />
 *   </div>
 */
export function fitToStyle(fit: ImageFit): React.CSSProperties {
  const { x, y, zoom } = fit;
  // Translate so the focal point (x%, y%) ends up at the center of the container.
  // At zoom=1 with center (50,50) the transform is simply scale(1) — no shift needed.
  // Formula: translateX = (50 - x)%, translateY = (50 - y)%
  // These % are relative to the element itself (100% = full width/height).
  const tx = 50 - x;
  const ty = 50 - y;
  return {
    objectFit: "cover" as const,
    objectPosition: `${x}% ${y}%`,
    transform: zoom !== 1 ? `scale(${zoom}) translate(${tx / zoom}%, ${ty / zoom}%)` : undefined,
    transformOrigin: "center center",
    transition: "transform 0.2s ease",
  };
}

/**
 * Simpler variant that only uses object-position (no zoom transform).
 * Suitable when zoom is always 1 or when the element is not absolutely positioned.
 */
export function fitToObjectPosition(fit: ImageFit): { objectFit: "cover"; objectPosition: string } {
  return {
    objectFit: "cover",
    objectPosition: `${fit.x}% ${fit.y}%`,
  };
}
