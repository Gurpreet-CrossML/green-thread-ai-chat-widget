import type { ChatbotConfig } from "../types";

// ── Renkaat247 brand theme (green) ──
export const PRIMARY_COLOR = "#03A800";
export const ACCENT_COLOR = "#019034";

export const DEFAULT_CHATBOT_CONFIG: ChatbotConfig = {
  name: "Renkaat247",
  logo: null,
  theme: "light",
  primary_color: PRIMARY_COLOR,
  accent_color: ACCENT_COLOR,
  font_family: "'Inter', system-ui, -apple-system, sans-serif",
  border_radius: "1rem",
};

// ── Image upload constraints (mirrors Renkaat backend limits) ──
export const MAX_FILES = 4;
export const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB
export const ALLOWED_FORMATS = ["jpg", "jpeg", "png"];
export const ACCEPT_MIME = "image/png, image/jpeg";
