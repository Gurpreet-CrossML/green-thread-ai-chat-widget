/**
 * Shadow DOM mount helper for embedding the Renkaat widget on any host page.
 *
 *   <script src="https://cdn.example.com/chatbot-widget.js"></script>
 *   <script>window.Chatbot.init()</script>
 *
 * The widget renders inside an open Shadow DOM so host-page CSS cannot bleed in
 * (and vice versa).
 */
import { createRoot, type Root } from "react-dom/client";
import { ChatbotWidget } from "./components/Widget";
import "@/i18n";
import widgetCss from "./styles/widget.css?inline";

export interface MountedWidget {
  unmount: () => void;
}

// Exposed globally so portalled UI (QR dialog) can target the shadow root.
declare global {
  interface Window {
    renkaatShadowRoot?: ShadowRoot;
  }
}

export function mountWidget(): MountedWidget {
  const host = document.createElement("div");
  host.id = "renkaat-widget-host";
  host.style.cssText =
    "all: initial; position: fixed; inset: auto 0 0 auto; z-index: 2147483647;";
  document.body.appendChild(host);

  const shadow = host.attachShadow({ mode: "open" });
  window.renkaatShadowRoot = shadow;

  const styleEl = document.createElement("style");
  styleEl.textContent = widgetCss;
  shadow.appendChild(styleEl);

  const mountPoint = document.createElement("div");
  shadow.appendChild(mountPoint);

  const root: Root = createRoot(mountPoint);
  root.render(<ChatbotWidget />);

  return {
    unmount: () => {
      root.unmount();
      host.remove();
      window.renkaatShadowRoot = undefined;
    },
  };
}
