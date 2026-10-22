# Renkaat247 — AI Tyre Selection Chatbot Widget

An embeddable chat widget for **Renkaat247** that helps customers find the right
tyres for their vehicle. It talks to the **Store Signal** backend over the same
chat WebSocket as the Store Signal widget, and renders as an isolated Shadow DOM
widget that can be dropped onto any website.

This is a redesigned build: it keeps **Renkaat's backend, APIs and functionality
exactly** while adopting a cleaner, structured, TypeScript codebase and a polished
UI (in the spirit of the StoreSignal widget). The brand theme is **green**.

## Features

- 💬 Streaming chat over the Renkaat HTTP streaming protocol (`[---SPLIT---]`,
  `[---TOOL---]`, `[---METADATA---]`).
- 🖼️ Multi-image upload (JPG/PNG, up to 4, ≤20 MB).
- 📱 **QR / mobile capture** — scan a QR code to upload photos from your phone;
  images stream back into the chat live over WebSocket.
- 🛞 **Tyre product carousel** with price, stock, EU label and buy links.
- 🌍 Finnish (default) + English, auto-detected from `?lang=` or `<html lang>`.
- 🎨 Shadow DOM isolation so host-page CSS never interferes.

## Architecture

```
src/
├── widget-entry.ts                 # window.Chatbot global (script-tag embed)
├── main.tsx                        # dev entry (npm run dev)
├── i18n.ts                         # fi / en translations
├── lib/
│   ├── config.ts                   # enabled stores, CAPTURE_URL
│   └── utils.ts                    # cn, time/file helpers
├── context/
│   └── chatbotContext.tsx          # session, streaming, files, WebSocket, i18n
└── features/chatbot/
    ├── mount.tsx                   # Shadow DOM mounting
    ├── types/ · constants/         # shared types & config (green theme)
    ├── services/
    │   ├── apis.ts                 # endpoints
    │   └── chat.ts                 # streaming parser + history
    ├── components/                 # Widget, Header, Messages, Input, …
    │   ├── ProductCarousel.tsx     # Embla tyre carousel
    │   ├── ProductCard.tsx         # tyre card
    │   ├── Disclaimer.tsx          # upload guidance + inline QR
    │   └── QRDialog.tsx            # full QR modal
    └── styles/widget.css           # scoped, green-themed design system

public/src/capture/                     # mobile photo-upload page (used as-is)
```

The mobile **capture page** (`public/src/capture/`) is the original Renkaat upload
page, kept verbatim.

## Quick start

```bash
npm install
npm run dev          # dev preview at http://localhost:5173
```

## Build & serve

```bash
npm run build        # → dist/widget/chatbot.cjs.js (+ /src/capture)
npm run preview      # serve the built widget on http://localhost:4173
```

`vite preview` serves the build output (`dist/widget`) at the server root, so the
bundle is available at `/chatbot.cjs.js` and the capture page at `/src/capture/`.

Embed on any page:

```html
<script
  src="https://chatbot.renkaat247.fi/chatbot.cjs.js"
  data-widget-key="<the store's widget key from the Store Signal dashboard>"
  data-api-base="https://<your-backend-host>/api"
></script>
```

`data-widget-key` is required. `data-api-base` is required too unless the
build set `VITE_API_BASE_URL`; there is no built-in default backend. Both can also be set as
`window.CHATBOT_CONFIG = { widgetKey, apiBase }` before the script loads.

Or auto-initialise (and optionally set language):

```html
<script src=".../chatbot.cjs.js?lang=fi"></script>
```

API: `window.Chatbot.init()` / `window.Chatbot.destroy()`.

## Deployment

Same method as the original Renkaat app — Docker image → AWS ECR → EC2:

- [`Dockerfile`](Dockerfile): `node:22-alpine`, `npm install` → `npm run build` →
  `npm run preview` (serves on **port 4173**).
- [`.github/workflows/ci.yml`](.github/workflows/ci.yml): on push to **`beta`**,
  builds and pushes the image to ECR (`ai-tyer-selection-dev-frontend-ecr`), then
  SSHes into EC2, pulls the image and restarts the container
  (`--network host -p 4173:4173`).

Requires the same repository/environment secrets as the old project:
`AWS_REGION`, `AWS_ACCOUNT_ID`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`,
`EC2_USER`, `EC2_HOST`, `EC2_SSH_KEY`.

## Configuration

The backend (Store Signal) is set by the embed — see
[`src/features/chatbot/services/config.ts`](src/features/chatbot/services/config.ts).
[`src/lib/config.ts`](src/lib/config.ts) holds the enabled stores and the
`CAPTURE_URL` the QR code points to. The green theme is defined
in [`src/features/chatbot/constants/index.ts`](src/features/chatbot/constants/index.ts)
and applied as CSS variables in `widget.css`.
