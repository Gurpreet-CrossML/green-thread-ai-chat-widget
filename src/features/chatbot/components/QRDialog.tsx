import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { useTranslation } from "react-i18next";
import { X } from "lucide-react";
import { useChatbotContext } from "@/context/chatbotContext";

/** Modal showing a large QR code that opens the mobile capture page. */
export function QRDialog() {
  const { t } = useTranslation();
  const { showQR, setShowQR, captureLink } = useChatbotContext();
  const [dataUrl, setDataUrl] = useState("");

  useEffect(() => {
    if (!showQR || !captureLink) return;
    QRCode.toDataURL(captureLink, { width: 300, margin: 2 })
      .then(setDataUrl)
      .catch((err) => console.error("QR generation error:", err));
  }, [showQR, captureLink]);

  if (!showQR) return null;

  return (
    <div className="rk-modal-overlay" onClick={() => setShowQR(false)}>
      <div className="rk-modal" onClick={(e) => e.stopPropagation()}>
        <div className="rk-modal-head">
          <h3>{t("scan_to_upload")}</h3>
          <button
            className="rk-icon-btn"
            onClick={() => setShowQR(false)}
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>
        <p className="rk-modal-desc">{t("scan_to_upload_desc")}</p>
        {dataUrl && <img className="rk-modal-qr" src={dataUrl} alt="QR Code" />}
      </div>
    </div>
  );
}
