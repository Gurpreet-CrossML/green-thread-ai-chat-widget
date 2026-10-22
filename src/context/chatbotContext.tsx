import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useTranslation } from "react-i18next";

import type { Message, Product, SocketFrame } from "@/features/chatbot/types";
import {
  ALLOWED_FORMATS,
  MAX_FILES,
  MAX_FILE_SIZE,
} from "@/features/chatbot/constants";
import { captureApiBase } from "@/features/chatbot/services/apis";
import {
  ChatSocket,
  createThread,
  extractStreamingMessage,
  fetchCaptureToken,
  fetchHistory,
  fetchStoreInfo,
  replyFields,
  SessionNotFoundError,
  StoreUnavailableError,
  uploadImages,
  type WidgetSettings,
} from "@/features/chatbot/services/chat";
import { base64ToFile, convertFileToBase64 } from "@/lib/utils";
import { CAPTURE_URL, type StoreConfig } from "@/lib/config";
import { FALLBACK_LANG, isSupportedLang, type Lang } from "@/i18n";

interface ChatbotContextValue {
  isOpen: boolean;
  setIsOpen: (v: boolean) => void;
  isExpanded: boolean;
  setIsExpanded: (v: boolean) => void;

  messages: Message[];
  sessionId: string;

  loading: boolean; // waiting for first token / running a tool
  generating: boolean; // streaming the answer
  toolText: string;
  storeLoading: boolean;
  store: StoreConfig | null;

  files: File[];
  addFiles: (files: FileList | File[]) => void;
  removeFile: (index: number) => void;
  clearFiles: () => void;

  showQR: boolean;
  setShowQR: (v: boolean) => void;
  /** Mobile capture page link for the QR codes; "" until it is ready. */
  captureLink: string;
  /** The store's look from the dashboard's Widget Customisation, once loaded. */
  widgetSettings: WidgetSettings | null;
  /** Whether the backend accepts this store; null until it has answered. */
  storeConfigured: boolean | null;

  sendMessage: (text: string) => Promise<void>;
}

const ChatbotContext = createContext<ChatbotContextValue | null>(null);

export const useChatbotContext = () => {
  const ctx = useContext(ChatbotContext);
  if (!ctx)
    throw new Error("useChatbotContext must be used inside <ChatbotProvider>");
  return ctx;
};

export const ChatbotProvider = ({ children }: { children: ReactNode }) => {
  const { t, i18n } = useTranslation();

  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState<Message[]>(() => [
    { role: "assistant", text: "", created_at: Date.now() },
  ]);
  const [sessionId, setSessionId] = useState("");
  const [loading, setLoading] = useState(false);
  const [storeLoading, setStoreLoading] = useState(true);
  const [store, setStore] = useState<StoreConfig | null>(null);
  const [generating, setGenerating] = useState(false);
  const [toolText, setToolText] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [showQR, setShowQR] = useState(false);
  const [captureLink, setCaptureLink] = useState("");
  const [widgetSettings, setWidgetSettings] = useState<WidgetSettings | null>(
    null,
  );
  const [storeConfigured, setStoreConfigured] = useState<boolean | null>(null);

  const storeRef = useRef<StoreConfig | null>(null);
  // Helper to update store state and ref
  const updateStore = (data: StoreConfig | null) => {
    setStore(data);
    storeRef.current = data;
  };

  // ── The store, its look (colours, logo, greeting) and whether the backend
  // accepts it, all from /store/info/ — the widget key identifies the store. ──
  useEffect(() => {
    let cancelled = false;
    fetchStoreInfo().then(({ store: info, configured, settings }) => {
      if (cancelled) return;
      updateStore(info);
      setStoreConfigured(configured);
      setWidgetSettings(settings);
      setStoreLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // The thread's chat socket (Store Signal's `/ws/chat/<thread>/`), the
  // thread id it is open for, and the in-flight thread creation.
  const socketRef = useRef<ChatSocket | null>(null);
  const sessionIdRef = useRef("");
  const creatingRef = useRef<Promise<string> | null>(null);
  // The streamed reply's raw JSON so far, and when that reply started.
  const streamBufferRef = useRef("");
  const streamStartedRef = useRef(false);
  const createdAtRef = useRef(Date.now());
  // Whether a human agent has taken the chat over (no AI reply follows).
  const agentConnectedRef = useRef(false);

  // Cache of tyre image by product page (buy_link). The backend returns
  // image_url=null on some follow-up responses, so we reuse the image first
  // seen for the same tyre to keep the carousel consistent.
  const imageCacheRef = useRef<Map<string, string>>(new Map());

  const enrichProductImages = (products?: Product[]): Product[] => {
    if (!products?.length) return [];
    const cache = imageCacheRef.current;
    return products.map((p) => {
      const key = p.buy_link;
      if (key && p.image_url) cache.set(key, p.image_url);
      if (key && !p.image_url && cache.has(key)) {
        return { ...p, image_url: cache.get(key) };
      }
      return p;
    });
  };

  // ── Language priority: ?lang= on the embed script tag, then the store's own
  // configured default, then the page's <html lang>, then the global fallback.
  // Each is validated against SUPPORTED_LANGS, so adding a language to i18n.ts is
  // all that is needed to make it selectable here.
  //
  // The store default deliberately outranks <html lang>: an Estonian store's
  // widget should greet in Estonian even when embedded on a page that declares
  // lang="fi". Only an explicit ?lang= on the embed overrides the store.
  //
  // Runs again once the store resolves (deps include `store`).
  useEffect(() => {
    const getTargetLang = (): Lang => {
      try {
        const script =
          (document.currentScript as HTMLScriptElement | null) ||
          document.querySelector<HTMLScriptElement>(
            'script[src*="chatbot.cjs"], script[src*="chatbot-widget"]',
          );
        if (script?.src) {
          const langParam = new URL(script.src).searchParams
            .get("lang")
            ?.replace(/['"]+/g, "")
            .trim()
            .toLowerCase();
          if (isSupportedLang(langParam)) return langParam;
        }
      } catch {
        /* ignore */
      }
      // Store's configured default wins over the page's <html lang>.
      const storeDefault = store?.defaultLang;
      if (isSupportedLang(storeDefault)) return storeDefault;

      // Accept region-tagged values such as `et-EE` by taking the base subtag.
      const htmlLang = document.documentElement.lang
        ?.split("-")[0]
        .toLowerCase();
      if (isSupportedLang(htmlLang)) return htmlLang;

      return FALLBACK_LANG;
    };

    const target = getTargetLang();
    if (i18n.language !== target) i18n.changeLanguage(target);
  }, [i18n, store]);

  // ── Keep the initial greeting in sync with the active language, or the
  // store's own greeting when one is set in the dashboard. ──
  useEffect(() => {
    const greeting = widgetSettings?.greeting_message?.trim() || t("greeting");
    setMessages((prev) => {
      if (prev.length === 1 && prev[0].role === "assistant") {
        return [
          {
            role: "assistant",
            text: greeting,
            created_at: prev[0].created_at || Date.now(),
          },
        ];
      }
      return prev;
    });
  }, [t, widgetSettings]);

  // ── Socket frames. ──
  const resetStream = () => {
    streamBufferRef.current = "";
    streamStartedRef.current = false;
  };

  const showError = (text: string) => {
    resetStream();
    setLoading(false);
    setGenerating(false);
    setToolText("");
    setMessages((prev) => [
      ...prev.filter((m) => m.role !== "streaming"),
      { role: "assistant", text, created_at: Date.now() },
    ]);
  };

  // Forget a thread the backend has closed, so the next message opens a new one.
  const dropSession = () => {
    socketRef.current?.close();
    socketRef.current = null;
    sessionIdRef.current = "";
    localStorage.removeItem("sessionId");
    setSessionId("");
    setCaptureLink("");
  };

  const handleFrame = (data: SocketFrame) => {
    if (!data?.success) return;

    switch (data.action_type) {
      case "connection":
      case "handler_change":
        agentConnectedRef.current = data.chat_handler === "human";
        if (agentConnectedRef.current) {
          setLoading(false);
          setToolText("");
        }
        return;

      case "photo_uploaded":
        // A photo taken on the QR capture page: becomes a pending attachment.
        if (data.image_url) {
          const file = base64ToFile(data.image_url, `camera_${Date.now()}.jpg`);
          setFiles((prev) => [...prev, file].slice(0, MAX_FILES));
        }
        return;

      case "tool":
        if (!streamStartedRef.current) setToolText(data.tool_text || "");
        return;

      case "reply_with_ai":
        setLoading(true);
        return;

      case "message":
        break;

      default:
        return;
    }

    // Our own message, echoed back to everyone on the thread.
    if (data.sender === "customer") return;

    // A streamed piece of the AI reply's JSON.
    if (data.chunk) {
      if (!streamStartedRef.current) {
        streamStartedRef.current = true;
        createdAtRef.current = Date.now();
        setLoading(false);
        setToolText("");
        setGenerating(true);
      }
      streamBufferRef.current += data.chunk;
      const text = extractStreamingMessage(streamBufferRef.current);
      if (text !== null) {
        setMessages((prev) => [
          ...prev.filter((m) => m.role !== "streaming"),
          {
            role: "streaming",
            text,
            products: [],
            created_at: createdAtRef.current,
          },
        ]);
      }
      return;
    }

    const final = data.final_update;
    if (!final || typeof final !== "object" || !final.message) return;
    const text = final.message;

    // A human agent writing from the dashboard (live chat).
    if (data.sender === "agent") {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text,
          agent_name: final.messaged_by || null,
          created_at: Date.now(),
        },
      ]);
      return;
    }

    // The AI reply (or a follow-up) is complete.
    const createdAt = streamStartedRef.current
      ? createdAtRef.current
      : Date.now();
    const { products, show_disclaimer, answer_language } = replyFields(
      final.json_content,
    );
    resetStream();
    setLoading(false);
    setGenerating(false);
    setToolText("");
    setMessages((prev) => [
      ...prev.filter((m) => m.role !== "streaming"),
      {
        role: "assistant",
        text,
        products: enrichProductImages(products),
        show_disclaimer,
        answer_language,
        created_at: createdAt,
      },
    ]);

    if (final.is_active === false || final.is_active === "false") {
      dropSession();
    }
  };

  // Always the latest handler, so the socket never calls a stale closure.
  const handleFrameRef = useRef(handleFrame);
  handleFrameRef.current = handleFrame;

  const connectSocket = (threadId: string) => {
    socketRef.current?.close();
    socketRef.current = new ChatSocket(threadId, {
      onMessage: (data) => handleFrameRef.current(data),
    });
  };

  // ── Restore the thread id from localStorage. ──
  useEffect(() => {
    if (sessionId) return;
    const saved = localStorage.getItem("sessionId");
    if (saved) setSessionId(saved);
  }, [sessionId]);

  // ── Load history once a thread is restored AND the store is resolved, then
  // open its socket. A thread the backend no longer knows (or has closed) is
  // dropped, so the next message starts a fresh one. ──
  useEffect(() => {
    if (!sessionId || !store || sessionIdRef.current === sessionId) return;
    sessionIdRef.current = sessionId;
    fetchHistory(sessionId)
      .then((history) => {
        connectSocket(sessionId);
        if (!history.length) return;
        // Enrich in chronological order so earlier images backfill later ones.
        const enriched = history.map((m) => ({
          ...m,
          products: enrichProductImages(m.products),
        }));
        setMessages((prev) => [...prev, ...enriched]);
      })
      .catch((err) => {
        if (err instanceof SessionNotFoundError) {
          dropSession();
        } else {
          connectSocket(sessionId);
        }
      });
  }, [sessionId, store]);

  // Close the socket when the widget unmounts.
  useEffect(() => () => socketRef.current?.close(), []);

  // ── The thread id, opening a new thread (and its socket) when there is none. ──
  const ensureSession = async (): Promise<string> => {
    if (sessionIdRef.current) return sessionIdRef.current;
    if (!creatingRef.current) {
      const storeCode = storeRef.current?.code;
      if (!storeCode) throw new StoreUnavailableError();
      creatingRef.current = createThread(storeCode)
        .then((threadId) => {
          sessionIdRef.current = threadId;
          localStorage.setItem("sessionId", threadId);
          setSessionId(threadId);
          connectSocket(threadId);
          return threadId;
        })
        .finally(() => {
          creatingRef.current = null;
        });
    }
    return creatingRef.current;
  };

  // ── QR capture link: needs a thread and a fresh capture token. ──
  useEffect(() => {
    if (showQR && !sessionId && store) {
      ensureSession().catch((err) =>
        console.error("Could not open a chat for the QR upload:", err),
      );
    }
    if (!sessionId) return;
    let cancelled = false;
    fetchCaptureToken(sessionId)
      .then((token) => {
        if (cancelled) return;
        setCaptureLink(
          `${CAPTURE_URL}?session=${encodeURIComponent(sessionId)}` +
            `&token=${encodeURIComponent(token)}` +
            `&api=${encodeURIComponent(captureApiBase)}`,
        );
      })
      .catch((err) => console.error("QR capture link unavailable:", err));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, showQR, store]);

  // ── File handling (jpg/png, ≤20 MB, max 4). ──
  const addFiles = (incoming: FileList | File[]) => {
    const list = Array.from(incoming);
    if (list.length === 0) return;

    const valid = list.filter((file) => {
      const ext = file.name.split(".").pop()?.toLowerCase() || "";
      return ALLOWED_FORMATS.includes(ext) && file.size <= MAX_FILE_SIZE;
    });

    setFiles((prev) => [...prev, ...valid].slice(0, MAX_FILES));
  };

  const removeFile = (index: number) =>
    setFiles((prev) => prev.filter((_, i) => i !== index));

  const clearFiles = () => setFiles([]);

  // ── Send a message over the chat socket; the reply streams back on it. ──
  const sendMessage = async (rawText: string) => {
    const text = rawText.trim();
    if ((!text && files.length === 0) || loading || generating) return;

    const attachments = [...files];
    // With a human agent on the chat no AI reply follows, so no loader.
    if (!agentConnectedRef.current) setLoading(true);

    try {
      const previews = await Promise.all(
        attachments.map(async (file) => ({
          url: await convertFileToBase64(file),
          filename: file.name,
          file_size: file.size,
        })),
      );

      // Optimistically render the user's message.
      setMessages((prev) => [
        ...prev,
        {
          role: "user",
          text,
          images: previews,
          image: previews[0] || {},
          created_at: Date.now(),
        },
      ]);
      clearFiles();
      resetStream();

      const threadId = await ensureSession();
      const imageUrls = await uploadImages(threadId, attachments);

      await socketRef.current?.send({
        message: text,
        image_url: imageUrls.length ? imageUrls : null,
        // The language the widget runs in; the backend answers in the
        // customer's language, falling back to this one.
        language: i18n.language?.split("-")[0] || FALLBACK_LANG,
      });
    } catch (error) {
      console.error("Error sending message:", error);
      // An unregistered store is not retryable, so show a distinct message
      // instead of the generic "try again later".
      showError(
        error instanceof StoreUnavailableError
          ? t("store_unavailable")
          : t("error_occurred"),
      );
    }
  };

  const value: ChatbotContextValue = {
    isOpen,
    setIsOpen,
    isExpanded,
    setIsExpanded,
    messages,
    sessionId,
    loading,
    storeLoading,
    store,
    generating,
    toolText,
    files,
    addFiles,
    removeFile,
    clearFiles,
    showQR,
    setShowQR,
    captureLink,
    widgetSettings,
    storeConfigured,
    sendMessage,
  };

  return (
    <ChatbotContext.Provider value={value}>{children}</ChatbotContext.Provider>
  );
};
