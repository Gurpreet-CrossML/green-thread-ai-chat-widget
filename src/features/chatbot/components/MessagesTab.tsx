import { useEffect, useRef } from "react";
import { Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useChatbotContext } from "@/context/chatbotContext";
import { MessageBubble } from "./MessageBubble";
import { MessageInput } from "./MessageInput";

export function MessagesTab() {
  const { messages, loading, generating, toolText, isOpen } =
    useChatbotContext();

  const containerRef = useRef<HTMLDivElement | null>(null);
  const endRef = useRef<HTMLDivElement | null>(null);
  const shouldAutoScroll = useRef(true);

  const isNearBottom = () => {
    const el = containerRef.current;
    if (!el) return true;
    return el.scrollHeight - el.scrollTop - el.clientHeight <= 80;
  };

  const scrollToBottom = (behavior: ScrollBehavior = "smooth") =>
    endRef.current?.scrollIntoView({ behavior });

  // Snap to bottom when the panel opens.
  useEffect(() => {
    if (!isOpen) return;
    shouldAutoScroll.current = true;
    scrollToBottom("auto");
  }, [isOpen]);

  // Track whether the user is following the conversation.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onScroll = () => {
      shouldAutoScroll.current = isNearBottom();
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  // Auto-scroll on new content while the user is near the bottom.
  useEffect(() => {
    if (!shouldAutoScroll.current) return;
    const behavior = loading || generating ? "auto" : "smooth";
    requestAnimationFrame(() => scrollToBottom(behavior));
  }, [messages, loading, generating, toolText]);

  // Always follow the user's own messages.
  useEffect(() => {
    if (messages[messages.length - 1]?.role !== "user") return;
    shouldAutoScroll.current = true;
    requestAnimationFrame(() => scrollToBottom("smooth"));
  }, [messages]);

  return (
    <>
      <div className="rk-content" ref={containerRef}>
        <div className="rk-messages">
          {messages.map((message, index) => (
            <MessageBubble
              key={index}
              message={message}
              isLast={index === messages.length - 1}
            />
          ))}

          {/* Tool / progress status */}
          {loading && toolText !== "" && (
            <div className="rk-msg assistant">
              <div className="rk-bubble rk-tool">
                <Loader2 className="rk-stream-loader" />
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {toolText}
                </ReactMarkdown>
              </div>
            </div>
          )}

          {/* Typing indicator */}
          {loading && toolText === "" && (
            <div className="rk-msg assistant">
              <div className="rk-bubble rk-typing">
                <span />
                <span />
                <span />
              </div>
            </div>
          )}

          <div ref={endRef} />
        </div>
      </div>

      <MessageInput />
    </>
  );
}
