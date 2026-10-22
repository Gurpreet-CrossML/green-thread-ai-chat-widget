/**
 * Runtime config for the embedded widget — read the same way the Store Signal
 * widget reads it.
 *
 * The embed carries the store's widget key (from the Store Signal dashboard):
 *   <script src=".../chatbot-widget.js?lang=fi" data-widget-key="gAAAA..."></script>
 *
 * The widget reads that key (and an optional API base, `data-api-base`) from
 * its own <script> tag — or from `window.CHATBOT_CONFIG = { widgetKey, apiBase }`
 * set before the script loads — and sends the key as the `X-Widget-Key` header
 * on every backend call and as `?key=` on the chat socket. The key is an opaque
 * bearer token: the widget never decodes it.
 */

const DEFAULT_API_BASE =
  import.meta.env.VITE_API_BASE_URL || "https://store-signal-api.crossml.in/api";

// For local development (`npm run dev`): the widget key from
// `.env.development`, used only when the page has no `data-widget-key` and no
// `window.CHATBOT_CONFIG`. A production embed always passes its own key.
const DEV_WIDGET_KEY = import.meta.env.VITE_WIDGET_KEY || "";

interface RuntimeConfig {
  widgetKey: string;
  apiBase: string;
  wsBase: string;
}

let cached: RuntimeConfig | null = null;

function readScriptAttr(attr: string): string {
  if (typeof document === "undefined") return "";
  const el = document.querySelector(`script[${attr}]`);
  return el?.getAttribute(attr)?.trim() ?? "";
}

/** The chat socket base for an API base: same host, `/ws/chat/`. */
function deriveWsBase(apiBase: string): string {
  try {
    const u = new URL(apiBase);
    const proto = u.protocol === "https:" ? "wss:" : "ws:";
    return `${proto}//${u.host}/ws/chat/`;
  } catch {
    return "wss://store-signal-api.crossml.in/ws/chat/";
  }
}

function overrides(): { widgetKey?: string; apiBase?: string } {
  if (typeof window === "undefined") return {};
  return (
    (
      window as unknown as {
        CHATBOT_CONFIG?: { widgetKey?: string; apiBase?: string };
      }
    ).CHATBOT_CONFIG ?? {}
  );
}

function resolve(): RuntimeConfig {
  const o = overrides();
  const widgetKey =
    o.widgetKey || readScriptAttr("data-widget-key") || DEV_WIDGET_KEY;
  const apiBase = (
    o.apiBase ||
    readScriptAttr("data-api-base") ||
    DEFAULT_API_BASE
  ).replace(/\/$/, "");
  return { widgetKey, apiBase, wsBase: deriveWsBase(apiBase) };
}

function cfg(): RuntimeConfig {
  if (!cached) cached = resolve();
  return cached;
}

export const getWidgetKey = (): string => cfg().widgetKey;
export const getApiBase = (): string => cfg().apiBase;
export const getWsBase = (): string => cfg().wsBase;
