/**
 * Widget entry point.
 *
 * The widget auto-mounts as soon as the script loads — just drop in the tag:
 *
 *   <script src="https://cdn.example.com/chatbot-widget.js?lang=fi"></script>
 *
 * `window.Chatbot.init()` / `window.Chatbot.destroy()` remain available for
 * manual control (init is idempotent, so calling it again is a no-op). Add
 * `data-chatbot-no-autostart` to the script tag to opt out of auto-mounting.
 */
import { mountWidget, type MountedWidget } from "./features/chatbot/mount";

interface ChatbotInstance {
  init: () => void;
  destroy: () => void;
}

class Chatbot implements ChatbotInstance {
  private widget: MountedWidget | null = null;

  init(): void {
    if (this.widget) {
      console.warn("Renkaat Chatbot is already initialized");
      return;
    }
    try {
      this.widget = mountWidget();
    } catch (error) {
      console.error("Error initializing Renkaat chatbot:", error);
    }
  }

  destroy(): void {
    this.widget?.unmount();
    this.widget = null;
  }
}

declare global {
  interface Window {
    Chatbot: ChatbotInstance;
  }
}

const chatbot = new Chatbot();
window.Chatbot = chatbot;

// Auto-mount on load (like the original Renkaat widget), unless the embed
// script opts out with `data-chatbot-no-autostart`.
const autoMount = () => {
  if (document.querySelector("script[data-chatbot-no-autostart]")) return;
  chatbot.init();
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", autoMount);
} else {
  autoMount();
}
