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
  /** Set on an "agent joined / left" notice row (live chat); text is empty. */
  notice?: HandlerEvent;
}

/** An agent joining or leaving a live chat (`handler_change` frame, history). */
export interface HandlerEvent {
  type?: "handler_event";
  /** `<assignment id>-<event>`, the same live and in history. */
  id?: string | number;
  event: "joined" | "left";
  /** takeover / reassign / release / closed; "release" hands back to the AI. */
  action?: string;
  /** The agent's display name. */
  agent_name?: string | null;
  created_at?: string;
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

/** The structured part of an assistant reply (a message's json_content). */
export interface ReplyJson {
  recommendations?: Product[];
  show_disclaimer?: boolean;
  answer_language?: string | null;
}

/** A stored thread message, as the history endpoint returns it. */
export interface ServerMessage {
  type?: "message";
  role: string;
  message?: string;
  message_type?: string;
  image_url?: unknown;
  created_at: string;
  messaged_by?: string | null;
  json_content?: ReplyJson | null;
}

/** A frame the chat socket sends (see the backend's chat.consumers). */
export interface SocketFrame {
  success?: boolean;
  action_type?: string;
  chat_handler?: string;
  /** `handler_change`: who joined / left, oldest first. */
  events?: HandlerEvent[] | null;
  /** `photo_uploaded`: the QR capture photo to download. */
  photo_id?: string;
  tool_text?: string;
  sender?: string;
  chunk?: string;
  final_update?: {
    message?: string;
    messaged_by?: string | null;
    json_content?: ReplyJson | null;
    is_active?: boolean | string;
  } | null;
}
