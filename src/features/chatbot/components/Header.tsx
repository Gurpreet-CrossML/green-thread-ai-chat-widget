import { useTranslation } from "react-i18next";
import { useChatbotContext } from "@/context/chatbotContext";
import { DEFAULT_CHATBOT_CONFIG } from "../constants";
import { IconClose, IconExpand, IconMinimize } from "./Icons";
import { StoreConfig } from "@/lib/config";

export function Header({ store }: { store: StoreConfig | null }) {
  const { t } = useTranslation();
  const { isExpanded, setIsExpanded, setIsOpen, widgetSettings } =
    useChatbotContext();
  // The logo uploaded in the dashboard's Widget Customisation, if any.
  const logo = widgetSettings?.logo || DEFAULT_CHATBOT_CONFIG.logo;
  const name = store ? store.name : DEFAULT_CHATBOT_CONFIG.name;

  return (
    <header className="rk-header">
      <div className="rk-header-left">
        <div className="rk-logo" aria-hidden>
          {logo ? <img src={logo} alt="" /> : <span>{name.charAt(0)}</span>}
        </div>
        <div className="rk-header-title-wrap">
          <div className="rk-title">
            {store ? store.name : t("header_title")}
          </div>
          <div className="rk-status">{t("support_agent")}</div>
        </div>
      </div>

      <div className="rk-header-right">
        <button
          className="rk-icon-btn"
          onClick={() => setIsExpanded(!isExpanded)}
          aria-label={isExpanded ? "Minimize" : "Expand"}
          title={isExpanded ? "Minimize" : "Expand"}
        >
          {isExpanded ? <IconMinimize /> : <IconExpand />}
        </button>
        <button
          className="rk-icon-btn"
          onClick={() => setIsOpen(false)}
          aria-label="Close"
          title="Close"
        >
          <IconClose />
        </button>
      </div>
    </header>
  );
}
