/**
 * Thin fetch wrapper that attaches the widget key to every backend call, as
 * the Store Signal widget does. Use it only for the Store Signal backend
 * (`ENDPOINTS`), never for third-party URLs.
 */
import { getWidgetKey } from "./config";

export function apiFetch(
  input: string,
  init: RequestInit = {},
): Promise<Response> {
  const headers = new Headers(init.headers);
  const key = getWidgetKey();
  if (key) headers.set("X-Widget-Key", key);
  return fetch(input, { ...init, headers });
}
