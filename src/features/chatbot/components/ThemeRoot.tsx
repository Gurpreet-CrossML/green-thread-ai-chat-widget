import type { CSSProperties, ReactNode } from "react";
import type { ChatbotConfig } from "../types";
import type { WidgetSettings } from "../services/chat";
import { darken, hexColor } from "@/lib/utils";

/**
 * Scopes the widget under `.renkaat-widget` and injects the brand theme
 * (green) as CSS custom properties consumed by `widget.css`.
 *
 * Colours set in the dashboard's Widget Customisation override it: the brand
 * colour (with a darker shade for the gradients), the bot bubble colour and
 * the surface colour. Anything not set keeps the built-in theme.
 */
export function ThemeRoot({
  config,
  settings,
  children,
}: {
  config: ChatbotConfig;
  settings?: WidgetSettings | null;
  children: ReactNode;
}) {
  const primary = hexColor(settings?.primary_color);
  const bubble = hexColor(settings?.secondary_color);
  const surface = hexColor(settings?.tertiary_color);
  const style = {
    "--rk-primary": primary ?? config.primary_color,
    "--rk-accent": primary ? darken(primary, 0.14) : config.accent_color,
    ...(bubble ? { "--rk-surface-2": bubble } : {}),
    ...(surface ? { "--rk-surface": surface } : {}),
    "--rk-radius": config.border_radius,
    fontFamily: config.font_family,
  } as CSSProperties;

  return (
    <div className="renkaat-widget" style={style}>
      {children}
    </div>
  );
}
