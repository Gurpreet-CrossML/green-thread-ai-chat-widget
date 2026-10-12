import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { CircleX, MonitorSmartphone, Paperclip, Send } from "lucide-react";
import { useChatbotContext } from "@/context/chatbotContext";
import { ACCEPT_MIME } from "../constants";

export function MessageInput() {
  const { t } = useTranslation();
  const {
    sendMessage,
    loading,
    generating,
    files,
    addFiles,
    removeFile,
    setShowQR,
  } = useChatbotContext();

  const [text, setText] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);
  const disabled = loading || generating;

  // Auto-grow the textarea.
  useEffect(() => {
    const ta = taRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = `${Math.min(ta.scrollHeight, 120)}px`;
  }, [text]);

  const handleSend = () => {
    if (disabled) return;
    if (!text.trim() && files.length === 0) return;
    sendMessage(text);
    setText("");
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) addFiles(e.target.files);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="rk-input-wrap">
      <div className="rk-input-box">
        {files.length > 0 && (
          <div className="rk-input-previews">
            {files.map((file, index) => (
              <div className="rk-input-preview" key={index}>
                <img src={URL.createObjectURL(file)} alt={file.name} />
                <button
                  onClick={() => removeFile(index)}
                  disabled={disabled}
                  aria-label="Remove image"
                >
                  <CircleX size={16} />
                </button>
              </div>
            ))}
          </div>
        )}

        <textarea
          ref={taRef}
          className="rk-textarea"
          placeholder={t("message_placeholder")}
          value={text}
          // Stays editable while a reply streams so the customer can compose;
          // sending is still guarded (handleSend + the send button below).
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          rows={1}
        />

        <div className="rk-input-row">
          <div className="rk-input-actions">
            <label className="rk-input-btn" title="Attach images">
              <input
                ref={fileInputRef}
                type="file"
                accept={ACCEPT_MIME}
                multiple
                hidden
                onChange={handleFileSelect}
                disabled={disabled}
              />
              <Paperclip size={18} />
            </label>
            <button
              className="rk-input-btn"
              onClick={() => setShowQR(true)}
              disabled={disabled}
              type="button"
              title="Upload via phone (QR)"
              aria-label="Upload via phone"
            >
              <MonitorSmartphone size={18} />
            </button>
          </div>

          <button
            className="rk-input-btn send"
            onClick={handleSend}
            disabled={disabled || (!text.trim() && files.length === 0)}
            aria-label="Send message"
            type="button"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
