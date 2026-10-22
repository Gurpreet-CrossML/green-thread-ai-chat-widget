import { ENDPOINTS, chatSocketUrl } from "./apis";
import { getWidgetKey } from "./config";
import { apiFetch } from "./http";
import type {
  Message,
  MessageImage,
  Product,
  ReplyJson,
  ServerMessage,
  SocketFrame,
} from "../types";

/**
 * Thrown when the backend refuses to open a thread for this store (unknown
 * store code, or the store is not fully configured). Not transient, so the
 * caller shows a "contact support" message rather than the generic one.
 */
export class StoreUnavailableError extends Error {
  constructor() {
    super("Store not initialized");
    this.name = "StoreUnavailableError";
  }
}

/**
 * Thrown by `fetchHistory` when the stored thread is unknown or closed. The
 * caller drops the id so the next message starts a fresh thread.
 */
export class SessionNotFoundError extends Error {
  constructor() {
    super("Session not found");
    this.name = "SessionNotFoundError";
  }
}

/**
 * The store's widget settings from the Store Signal dashboard (Settings →
 * Widget Customisation). Every field is optional: anything not set keeps the
 * widget's built-in look.
 */
export interface WidgetSettings {
  /** The store's name, shown in the header. */
  name?: string | null;
  /** Brand colour: header, the customer's bubbles, buttons. */
  primary_color?: string | null;
  /** The bot's message bubbles. */
  secondary_color?: string | null;
  /** Light surfaces, e.g. the message input. */
  tertiary_color?: string | null;
  /** Header logo URL. */
  logo?: string | null;
  /** The bot's first message; empty uses the built-in, translated greeting. */
  greeting_message?: string | null;
}

/** Fetch the store's widget settings; null when they cannot be loaded. */
export async function fetchWidgetSettings(): Promise<WidgetSettings | null> {
  try {
    const res = await apiFetch(ENDPOINTS.storeInfo);
    const json = await res.json().catch(() => null);
    if (!res.ok || json?.status !== "success") return null;
    return { name: json?.data?.name ?? null, ...(json?.data?.widget ?? {}) };
  } catch (err) {
    console.error("Widget settings unavailable:", err);
    return null;
  }
}

/** Open a new chat thread for the store; returns its id. */
export async function createThread(storeCode: string): Promise<string> {
  const res = await apiFetch(ENDPOINTS.newThread, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ store_code: storeCode, customer_id: null }),
  });
  const json = await res.json().catch(() => null);
  const threadId = json?.status === "success" ? json?.data?.thread_id : null;
  if (!threadId) throw new StoreUnavailableError();
  return String(threadId);
}

/** The image URL(s) a stored message carries, as the widget's image list. */
function toImages(imageUrl: unknown): MessageImage[] {
  const urls = Array.isArray(imageUrl) ? imageUrl : imageUrl ? [imageUrl] : [];
  return urls
    .filter((url): url is string => typeof url === "string" && url !== "")
    .map((url) => ({ url }));
}

/** The reply fields the tyre assistant stores in a message's json_content. */
export function replyFields(jsonContent: ReplyJson | null | undefined): {
  products: Product[];
  show_disclaimer: boolean;
  answer_language: string | null;
} {
  return {
    products: Array.isArray(jsonContent?.recommendations)
      ? jsonContent.recommendations
      : [],
    show_disclaimer: Boolean(jsonContent?.show_disclaimer),
    answer_language: jsonContent?.answer_language || null,
  };
}

/** Map a stored thread message into the widget's Message shape. */
export function mapHistoryMessage(msg: ServerMessage): Message {
  const images = toImages(msg?.image_url);
  return {
    role: msg.role === "user" ? "user" : "assistant",
    text: msg.message || "",
    images,
    image: images[0] || {},
    created_at: Date.parse(msg.created_at) || Date.now(),
    agent_name: msg.role === "assistant" ? msg.messaged_by || null : null,
    ...replyFields(msg.json_content),
  };
}

/** Fetch the thread's prior conversation. */
export async function fetchHistory(threadId: string): Promise<Message[]> {
  const res = await apiFetch(ENDPOINTS.threadMessages(threadId));
  if (res.status === 404) throw new SessionNotFoundError();
  if (!res.ok) {
    // Transient failure — keep the thread id and let it be retried later.
    console.error("Error fetching chat history:", res.statusText);
    return [];
  }
  const json = await res.json();
  if (json?.data?.is_closed) throw new SessionNotFoundError();
  const history: ServerMessage[] = json?.data?.history ?? [];
  return history
    .filter(
      (msg) =>
        (msg?.role === "user" || msg?.role === "assistant") &&
        msg?.message_type !== "internal" &&
        msg?.message_type !== "ai_action",
    )
    .map(mapHistoryMessage);
}

/** Upload the attached photos for a thread; returns their public URLs. */
export async function uploadImages(
  threadId: string,
  files: File[],
): Promise<string[]> {
  if (!files.length) return [];
  const form = new FormData();
  form.append("thread_id", threadId);
  files.forEach((file) => form.append("images", file));
  const res = await apiFetch(ENDPOINTS.uploadImages, {
    method: "POST",
    body: form,
  });
  const json = await res.json().catch(() => null);
  if (!res.ok || json?.status !== "success") {
    throw new Error("Image upload failed.");
  }
  return (json?.data ?? []).map((item: { url: string }) => item.url);
}

/** A short-lived token that lets the mobile capture page send photos here. */
export async function fetchCaptureToken(threadId: string): Promise<string> {
  const res = await apiFetch(ENDPOINTS.captureToken(threadId), {
    method: "POST",
  });
  const json = await res.json().catch(() => null);
  const token = json?.data?.capture_token;
  if (!res.ok || !token) throw new Error("Capture token unavailable.");
  return token;
}

/**
 * Extract the `"message"` value from a reply's partial JSON as it streams in.
 * Returns null until the key has arrived.
 */
export function extractStreamingMessage(raw: string): string | null {
  const match = raw.match(/"message"\s*:\s*"((?:\\.|[^"\\])*)/);
  if (!match) return null;
  return match[1]
    .replace(/\\"/g, '"')
    .replace(/\\n/g, "\n")
    .replace(/\\\\/g, "\\");
}

export type ConnectionStatus = "connecting" | "open" | "closed";

type ChatSocketOptions = {
  onMessage: (data: SocketFrame) => void;
  onStatusChange?: (status: ConnectionStatus) => void;
};

/**
 * The thread's chat socket, reconnecting with exponential backoff (1s up to
 * 30s) like the Store Signal widget. `send` waits for the socket to be open.
 */
export class ChatSocket {
  private socket: WebSocket | null = null;
  private retryAttempt = 0;
  private retryTimer: number | null = null;
  private closed = false;
  private openWaiters: Array<() => void> = [];

  constructor(
    private readonly threadId: string,
    private readonly options: ChatSocketOptions,
  ) {
    this.connect();
  }

  private connect(): void {
    this.options.onStatusChange?.("connecting");
    const ws = new WebSocket(chatSocketUrl(this.threadId, getWidgetKey()));
    this.socket = ws;

    ws.onopen = () => {
      this.retryAttempt = 0;
      this.options.onStatusChange?.("open");
      const waiters = this.openWaiters;
      this.openWaiters = [];
      waiters.forEach((resolve) => resolve());
    };

    ws.onmessage = (event) => {
      try {
        this.options.onMessage(JSON.parse(event.data));
      } catch (err) {
        console.error("Failed to handle chat socket frame:", err);
      }
    };

    ws.onerror = (error) => console.error("WebSocket error:", error);

    ws.onclose = (event) => {
      this.options.onStatusChange?.("closed");
      // 2000: the thread was ended server-side; do not reconnect to it.
      if (this.closed || event.code === 2000 || this.retryTimer) return;
      const delay = Math.min(1000 * 2 ** this.retryAttempt, 30000);
      this.retryTimer = window.setTimeout(() => {
        this.retryTimer = null;
        this.retryAttempt += 1;
        if (!this.closed) this.connect();
      }, delay);
    };
  }

  /** Resolves once the socket is open (immediately if it already is). */
  waitOpen(timeoutMs = 10000): Promise<void> {
    if (this.socket?.readyState === WebSocket.OPEN) return Promise.resolve();
    return new Promise((resolve, reject) => {
      const timer = window.setTimeout(
        () => reject(new Error("Chat connection timed out.")),
        timeoutMs,
      );
      this.openWaiters.push(() => {
        window.clearTimeout(timer);
        resolve();
      });
    });
  }

  /** Send a JSON frame once the socket is open. */
  async send(data: unknown): Promise<void> {
    await this.waitOpen();
    this.socket?.send(JSON.stringify(data));
  }

  close(): void {
    this.closed = true;
    if (this.retryTimer) window.clearTimeout(this.retryTimer);
    this.retryTimer = null;
    if (this.socket) {
      this.socket.onclose = null;
      this.socket.onmessage = null;
      this.socket.close();
      this.socket = null;
    }
  }
}
