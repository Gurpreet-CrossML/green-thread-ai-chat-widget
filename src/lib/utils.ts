import { clsx, type ClassValue } from "clsx";

/** Conditional className joiner. */
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

/** Format a timestamp as a short local time, e.g. "02:47 PM". */
export function formatTime(timestamp: number | string | Date): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

/** A valid `#rrggbb` colour, or null. */
export function hexColor(value?: string | null): string | null {
  const v = (value ?? "").trim();
  return /^#[0-9a-fA-F]{6}$/.test(v) ? v.toLowerCase() : null;
}

/** Darken a `#rrggbb` colour by `amount` (0–1). */
export function darken(hex: string, amount: number): string {
  const n = parseInt(hex.slice(1), 16);
  const channel = (shift: number) =>
    Math.max(0, Math.round(((n >> shift) & 255) * (1 - amount)));
  return (
    "#" +
    [16, 8, 0].map((s) => channel(s).toString(16).padStart(2, "0")).join("")
  );
}

/** Read a File as a base64 data-URL. */
export function convertFileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
