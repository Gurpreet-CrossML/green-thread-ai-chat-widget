/// <reference types="vite/client" />

interface ImportMetaEnv {
  /**
   * Store code to assume when the widget runs on localhost during development,
   * where the page hostname matches no real store domain. Ignored on any
   * non-local origin, so it can never influence a deployed store. See
   * `fetchStoreInfo`.
   */
  readonly VITE_STORE_CODE?: string;
  /**
   * Store Signal API base, e.g. `http://localhost:8000/api`. An embed's
   * `data-api-base` wins over it.
   */
  readonly VITE_API_BASE_URL?: string;
  /**
   * The store's widget key for local development (Django admin -> Store ->
   * Widget key). An embed's `data-widget-key` wins over it.
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
