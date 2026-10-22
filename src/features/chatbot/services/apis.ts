import { getApiBase, getWsBase } from "./config";

const BASE_URL = getApiBase();

/** Store Signal backend endpoints the widget calls. */
export const ENDPOINTS = {
  storeInfo: `${BASE_URL}/store/info/`,
  newThread: `${BASE_URL}/chat/threads/create/`,
  threadMessages: (threadId: string) =>
    `${BASE_URL}/chat/chat-messages/list/${threadId}/`,
  uploadImages: `${BASE_URL}/support/attachments/upload/`,
  captureToken: (threadId: string) =>
    `${BASE_URL}/chat/threads/${threadId}/capture-token/`,
};

/** The thread's chat socket (the same socket as the Store Signal widget). */
export const chatSocketUrl = (threadId: string, widgetKey: string) =>
  `${getWsBase()}${threadId}/` +
  (widgetKey
    ? `?key=${encodeURIComponent(widgetKey)}&role=customer`
    : "?role=customer");

/** API base handed to the mobile capture page through the QR link. */
export const captureApiBase = BASE_URL;
