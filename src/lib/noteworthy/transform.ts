/**
 * Selection transform constants + geometry helpers.
 *
 * Doctrine: move the object to center once (carrier), then rotate the object
 * (rotator). The stage is never transformed, the carrier is never rotated.
 */

export const ENTRANCE_ROTATION = 540; // 360 + 180 -> lands on the Information face
export const FACE_ROTATION = 180; // Information <-> third physical state
export const TRAVEL_MS = 1900;
export const FACE_MS = 900;
export const REDUCED_MS = 320;
export const STAGE_MARGIN = 12; // px breathing room around the centered object
export const MAX_OBJECT_WIDTH = 420;

export const TRAVEL_EASING = "cubic-bezier(0.5, 0.05, 0.15, 1)";

export type Rect = { left: number; top: number; width: number; height: number };

export const rectOf = (el: Element): Rect => {
  const r = el.getBoundingClientRect();
  return { left: r.left, top: r.top, width: r.width, height: r.height };
};

function safeInsets() {
  if (typeof window === "undefined") return { top: 0, bottom: 0 };
  const s = getComputedStyle(document.documentElement);
  const num = (v: string) => Number.parseFloat(v || "0") || 0;
  return {
    top: num(s.getPropertyValue("--nw-safe-top")),
    bottom: num(s.getPropertyValue("--nw-safe-bottom")),
  };
}

/**
 * Mathematically centered target rect derived from the *visual* viewport
 * (so mobile URL bars / keyboard insets can never push the object offscreen).
 */
export function centeredTargetRect(): Rect {
  if (typeof window === "undefined") {
    return { left: 0, top: 0, width: 320, height: 560 };
  }
  const vv = window.visualViewport;
  const vw = vv?.width ?? window.innerWidth;
  const vh = vv?.height ?? window.innerHeight;
  const ox = vv?.offsetLeft ?? 0;
  const oy = vv?.offsetTop ?? 0;
  const { top: safeTop, bottom: safeBottom } = safeInsets();

  const availW = Math.max(160, vw - STAGE_MARGIN * 2);
  const availH = Math.max(200, vh - safeTop - safeBottom - STAGE_MARGIN * 2);

  const width = Math.min(MAX_OBJECT_WIDTH, availW);
  const height = availH;

  return {
    left: ox + (vw - width) / 2,
    top: oy + safeTop + (vh - safeTop - safeBottom - height) / 2,
    width,
    height,
  };
}
