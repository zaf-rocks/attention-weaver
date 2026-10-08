import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";

/**
 * Compact bottom sheet for focused color work. Portaled to <body> so it sits
 * outside the 3D facet stack; the facet preview above stays visible.
 */
export function ColorDrawer({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [onClose]);
  if (typeof document === "undefined") return null;
  return createPortal(
    <div className="fixed inset-x-0 bottom-0 z-[80] flex justify-center p-2" data-testid="nw-color-drawer">
      <div
        role="dialog"
        aria-label={title}
        className="nw-drawer w-full max-w-md rounded-2xl border border-border/70 bg-card/95 p-3 shadow-2xl"
      >
        <div className="mb-2 flex items-center">
          <span className="nw-label">{title}</span>
          <button
            onClick={onClose}
            className="ml-auto rounded-lg border border-border px-2 py-0.5 text-xs hover:bg-accent/25"
          >
            Done
          </button>
        </div>
        <div className="nw-scroll max-h-[44dvh]">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
