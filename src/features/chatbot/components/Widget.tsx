import { AnimatePresence, motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { ChatbotProvider, useChatbotContext } from "@/context/chatbotContext";
import { cn } from "@/lib/utils";
import { DEFAULT_CHATBOT_CONFIG } from "../constants";
import { ThemeRoot } from "./ThemeRoot";
import { Header } from "./Header";
import { MessagesTab } from "./MessagesTab";
import { QRDialog } from "./QRDialog";
import { IconChat } from "./Icons";

function LauncherButton({ onClick }: { onClick: () => void }) {
  const { t } = useTranslation();
  return (
    <motion.button
      className="rk-launcher-pill"
      onClick={onClick}
      aria-label="Open chat"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
    >
      <div className="rk-launcher-pill-icon">
        <IconChat />
      </div>
      <div className="rk-launcher-pill-text">
        <span className="rk-launcher-pill-title">{t("launcher_title")}</span>
        <span className="rk-launcher-pill-subtitle">
          {t("launcher_subtitle")}
        </span>
      </div>
      <svg
        className="rk-launcher-pill-arrow"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2.5}
      >
        <path d="M9 5l7 7-7 7" />
      </svg>
    </motion.button>
  );
}

function Widget() {
  const { isOpen, setIsOpen, isExpanded, store, storeLoading, widgetSettings } =
    useChatbotContext();

  return (
    <ThemeRoot config={DEFAULT_CHATBOT_CONFIG} settings={widgetSettings}>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="panel"
            className={cn("rk-panel", isExpanded && "expanded")}
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.96 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            {storeLoading && !store ? (
              <div className="rk-loading-container">
                <div className="rk-spinner"></div>
                <p className="rk-loading-text">Initializing</p>
              </div>
            ) : !store ? (
              <div className="rk-no-store-container">
                <p className="rk-no-store-message">
                  Your store hasn't been registered for chat support yet.
                </p>
                <p className="rk-no-store-submessage">
                  Contact your store administrator or our support team to set up
                  chatbot support for your store.
                </p>
                <button
                  className="rk-close-btn"
                  onClick={() => setIsOpen(false)}
                >
                  Close
                </button>
              </div>
            ) : (
              <>
                <Header store={store} />
                <MessagesTab />
                <QRDialog />
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {!isOpen && <LauncherButton onClick={() => setIsOpen(true)} />}
    </ThemeRoot>
  );
}

export function ChatbotWidget() {
  return (
    <ChatbotProvider>
      <Widget />
    </ChatbotProvider>
  );
}
