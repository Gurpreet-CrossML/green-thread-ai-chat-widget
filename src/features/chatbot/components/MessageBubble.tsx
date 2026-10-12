import { Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useTranslation } from "react-i18next";
import { useChatbotContext } from "@/context/chatbotContext";
import { cn, formatTime } from "@/lib/utils";
import type { Message } from "../types";
import { Disclaimer } from "./Disclaimer";
import { ProductCarousel } from "./ProductCarousel";

export function MessageBubble({
  message,
  isLast,
}: {
  message: Message;
  isLast: boolean;
}) {
  const { t } = useTranslation();
  const { captureLink, generating } = useChatbotContext();

  const isUser = message.role === "user";
  const images =
    message.images && message.images.length > 0
      ? message.images
      : message.image?.url
        ? [{ url: message.image.url }]
        : [];

  return (
    <motion.div
      className={cn("rk-msg", isUser ? "user" : "assistant")}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      {images.length > 0 && (
        <div className="rk-msg-images">
          {images.map((img, i) => (
            <img key={i} src={img.url} alt="Attached" />
          ))}
        </div>
      )}

      {message.text && (
        <div className="rk-bubble">
          {isUser ? (
            message.text
          ) : (
            <>
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {message.text}
              </ReactMarkdown>

              {message.show_disclaimer && (
                <Disclaimer
                  captureLink={captureLink}
                  answerLanguage={message.answer_language}
                />
              )}

              {isLast && generating && (
                <Loader2 className="rk-stream-loader" />
              )}
            </>
          )}
        </div>
      )}

      {/* Product carousel — rendered outside (below) the bubble */}
      {!isUser && message.products && message.products.length > 0 && (
        <ProductCarousel products={message.products} />
      )}

      <div className="rk-msg-time">
        {isUser
          ? `${formatTime(message.created_at)} • ${t("user")}`
          : `${message.agent_name || t("ai_agent")} • ${formatTime(message.created_at)}`}
      </div>
    </motion.div>
  );
}
