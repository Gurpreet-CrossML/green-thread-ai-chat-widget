export type MessageRole = "user" | "assistant" | "streaming";

/** EU tyre label markings. */
export interface EuLabel {
  wet_grip?: string;
  rolling_resistance?: string;
  noise_db?: string | number;
}

/** A recommended tyre product. */
export interface Product {
  brand?: string;
  model?: string;
  name?: string;
  description?: string;
  image_url?: string;
  image?: string; // fallback field name
  price?: number;
  availability?: boolean;
  in_stock?: number | null;
  is_premium?: boolean;
  size?: string;
  load_index?: string;
  speed_rating?: string;
  eu_label?: EuLabel | null;
  buy_link?: string;
}

/** An image attached to a message. */
export interface MessageImage {
  url: string;
  filename?: string;
  file_size?: number;
}

/** A single chat message. */
export interface Message {
  role: MessageRole;
  text: string;
  created_at: number;
  images?: MessageImage[];
  image?: { url?: string } | null;
  products?: Product[];
  show_disclaimer?: boolean;
  answer_language?: string | null;
  /** Set when a human agent wrote this reply from the dashboard (live chat). */
  agent_name?: string | null;
}

/** Static, brand-level config for the widget (single-tenant Renkaat). */
export interface ChatbotConfig {
  name: string;
  logo: string | null;
  theme: "light";
  primary_color: string;
  accent_color: string;
  font_family: string;
  border_radius: string;
}
