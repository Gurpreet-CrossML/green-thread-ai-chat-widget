// The chat backend (Store Signal) is configured at runtime from the embed;
// see `features/chatbot/services/config.ts`.

// Mobile photo-upload (QR) page, served with this widget (public/src/capture).
// The QR code resolves to `${CAPTURE_URL}?session=<thread>&token=<capture
// token>&api=<Store Signal API base>`; the page posts the photos there.
// Set with VITE_CAPTURE_URL (e.g. in .env.development, a URL your phone can
// reach on the local network); defaults to the deployed page.
export const CAPTURE_URL =
  import.meta.env.VITE_CAPTURE_URL ||
  "https://chatbot.renkaat247.fi/src/capture/";

// The store the widget runs for, as the backend describes it
// (`/api/store/info/`, resolved from the widget key).
export type StoreConfig = {
  code: string;
  name: string;
  /**
   * Language to use when the page indicates none — no `?lang=` on the embed
   * script and no `<html lang>`. The backend's `Store.default_language`.
   */
  defaultLang: string | null;
};
