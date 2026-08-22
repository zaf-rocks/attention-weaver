import type { Destination } from "./utility-types";

export type ActionResult = { ok: boolean; message: string };

export const canShare = () => typeof navigator !== "undefined" && typeof navigator.share === "function";
export const canClipboard = () =>
  typeof navigator !== "undefined" && Boolean(navigator.clipboard?.writeText);

/** Honest capability report: why a destination cannot run right now. */
export function destinationUnavailable(d: Destination): string | null {
  if (d.kind === "share" && !canShare()) return "This browser has no native share sheet.";
  if (d.kind === "clipboard" && !canClipboard()) return "Clipboard access is unavailable here.";
  if (d.kind === "custom" && !d.template?.includes("{text}"))
    return "Template needs a {text} placeholder.";
  return null;
}

export async function copyText(text: string): Promise<ActionResult> {
  if (!text.trim()) return { ok: false, message: "Nothing to copy." };
  try {
    await navigator.clipboard.writeText(text);
    return { ok: true, message: "Copied to clipboard." };
  } catch {
    return { ok: false, message: "Clipboard was blocked by the browser." };
  }
}

export async function runDestination(d: Destination, text: string): Promise<ActionResult> {
  const blocked = destinationUnavailable(d);
  if (blocked) return { ok: false, message: blocked };
  if (!text.trim()) return { ok: false, message: "Nothing to send." };

  switch (d.kind) {
    case "clipboard":
      return copyText(text);
    case "share":
      try {
        await navigator.share({ text });
        return { ok: true, message: "Handed to the system share sheet." };
      } catch (e) {
        const err = e as { name?: string };
        return err?.name === "AbortError"
          ? { ok: false, message: "Share cancelled." }
          : { ok: false, message: "Share failed." };
      }
    case "email":
      window.location.href = `mailto:?body=${encodeURIComponent(text)}`;
      return { ok: true, message: "Opened your mail handler (if one is configured)." };
    case "websearch":
      window.open(`https://duckduckgo.com/?q=${encodeURIComponent(text)}`, "_blank", "noopener");
      return { ok: true, message: "Opened a browser search tab." };
    case "custom": {
      const url = d.template!.replaceAll("{text}", encodeURIComponent(text));
      window.open(url, "_blank", "noopener");
      return { ok: true, message: `Opened ${d.label} (if a handler exists).` };
    }
    default:
      return { ok: false, message: "Unsupported destination." };
  }
}
