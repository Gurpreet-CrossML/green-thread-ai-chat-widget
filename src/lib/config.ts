// Type-only import: erased at compile time, so this adds no runtime dependency
// on i18n (and cannot trigger its side effects).
import type { Lang } from "@/i18n";

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

// Store configuration for the tyre-selection assistant.
export type StoreConfig = {
  /**
   * Language to use when the page indicates none — no `?lang=` on the embed
   * script and no `<html lang>`. Per store, because a global default would show
   * an Estonian storefront's customers a Finnish interface. Mirrors
   * `default_language` on the backend's `Store` record.
   */
  defaultLang: Lang;
  urls: string | string[];
  name: string;
  logo: string;
  code: string;
};

// Enabled stores for the tyre-selection assistant.
export const ENABLED_STORES: Record<string, StoreConfig> = {
  renkaat247: {
    defaultLang: "fi",
    urls: ["https://renkaat247.fi/", "http://renkaat.staging.rehvid.we.ee/"],
    name: "Renkaat247",
    logo: "https://renkaat247.fi/wp-content/uploads/2022/09/logo.svg",
    code: "renkaat247",
  },
  rehvid: {
    defaultLang: "et",
    urls: ["https://rehvid.com/", "https://rehvid.we.ee/"],
    name: "Rehvid",
    logo: "https://rehvid.com/bundles/app/img/base/rehvid/logo.svg",
    code: "rehvid",
  },
};

// Look up a store directly by its code. Used only by the localhost development
// override (see `fetchStoreInfo`); production resolves the store from the page
// hostname via `getStoreConfig`.
export const getStoreByCode = (code: string): StoreConfig | null => {
  const normalized = code.trim().toLowerCase();
  return ENABLED_STORES[normalized] ?? null;
};

// Normalize a hostname for comparison: lowercase, drop a trailing FQDN dot
// ("renkaat247.fi." -> "renkaat247.fi"), and strip a single leading "www."
// label. Any other subdomain labels are preserved on purpose.
const normalizeHost = (host: string): string =>
  host
    .toLowerCase()
    .replace(/\.$/, "")
    .replace(/^www\./, "");

// Extract the registrable hostname from either a full URL/origin (what
// `window.location.origin` gives us) or a bare host string like
// "renkaat247.fi". Returns "" when nothing usable can be parsed.
//
// Using the WHATWG URL parser is deliberate: it resolves hostile inputs
// correctly. "https://renkaat247.fi@evil.com/" parses to host "evil.com",
// and "javascript:alert(1)" has no host — both yield a non-matching value
// instead of a false positive that a substring check would produce.
const extractHostname = (input: string): string => {
  if (!input || typeof input !== "string") return "";
  const tryParse = (candidate: string): string | null => {
    try {
      return new URL(candidate).hostname;
    } catch {
      return null;
    }
  };
  // Primary path: a full URL/origin. Fallback: a bare host with no scheme.
  const host = tryParse(input) ?? tryParse(`https://${input}`);
  return host ? normalizeHost(host) : "";
};

// True when `pageHost` is exactly `allowed`, or a subdomain of it. The
// leading "." in the suffix check is the whole point: it enforces a label
// boundary, so "shop.renkaat247.fi" matches "renkaat247.fi" while
// "evilrenkaat247.fi" and "renkaat247.fi.evil.com" do NOT.
const hostMatches = (pageHost: string, allowed: string): boolean =>
  pageHost === allowed || pageHost.endsWith(`.${allowed}`);

// Resolve the store for the current page URL, or null if the page is not an
// enabled store. Matching is by hostname (exact or subdomain), case- and
// scheme-insensitive, and independent of `ENABLED_STORES` ordering.
//
// When a host matches more than one store's configured domains (e.g. a store
// whose staging site is nested under another store's domain), the MOST
// SPECIFIC — longest — matching domain wins. If two different stores tie on
// an equally specific host, the config is ambiguous and this returns null
// rather than guessing.
//
// Examples:
//   https://renkaat247.fi/some/path          -> renkaat247
//   https://www.renkaat247.fi/               -> renkaat247
//   https://shop.renkaat247.fi/              -> renkaat247 (subdomain)
//   http://renkaat.staging.rehvid.we.ee/     -> renkaat247 (nested under rehvid's domain; longest match wins)
//   https://rehvid.we.ee/                    -> rehvid
//   https://foo.rehvid.we.ee/                -> rehvid     (rehvid's own subdomain)
//   https://evilrenkaat247.fi/               -> null       (no label boundary)
//   https://renkaat247.fi.evil.com/          -> null       (suffix injection)
//   https://renkaat247.fi@evil.com/          -> null       (real host is evil.com)
//   https://example.com/                     -> null
export const getStoreConfig = (url: string): StoreConfig | null => {
  const pageHost = extractHostname(url);
  if (!pageHost) return null;

  let best: { key: string; config: StoreConfig; length: number } | null = null;
  let ambiguous = false;

  for (const storeKey in ENABLED_STORES) {
    const storeConfig = ENABLED_STORES[storeKey];
    const urls = Array.isArray(storeConfig.urls)
      ? storeConfig.urls
      : [storeConfig.urls];
    for (const storeUrl of urls) {
      const allowed = extractHostname(storeUrl);
      if (!allowed || !hostMatches(pageHost, allowed)) continue;

      if (!best || allowed.length > best.length) {
        best = { key: storeKey, config: storeConfig, length: allowed.length };
        ambiguous = false;
      } else if (allowed.length === best.length && storeKey !== best.key) {
        // Two different stores claim an equally specific host — refuse to guess.
        ambiguous = true;
      }
    }
  }

  if (!best || ambiguous) {
    if (ambiguous)
      console.error(
        `getStoreConfig: ambiguous store match for host "${pageHost}" — check ENABLED_STORES for overlapping domains.`,
      );
    return null;
  }
  return best.config;
};
