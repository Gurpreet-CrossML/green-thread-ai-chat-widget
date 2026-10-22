/// <reference types="vite/client" />

interface ImportMetaEnv {
  /**
   * Backend API base, e.g. `http://localhost:8000/api`. An embed's
   * `data-api-base` wins over it.
   */
  readonly VITE_API_BASE_URL?: string;
  /**
   * The store's widget key for local development (dashboard -> Settings ->
   * Stores -> Get widget script). It also selects the store: the backend
   * resolves the store from the key. An embed's `data-widget-key` wins.
   */
  readonly VITE_WIDGET_KEY?: string;
  /**
   * Where the QR code sends the phone: the mobile photo capture page
   * (`public/src/capture/`). Defaults to the deployed page.
   */
  readonly VITE_CAPTURE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
