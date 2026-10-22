import { useTranslation } from "react-i18next";

/**
 * Upload-guidance disclaimer with an inline QR code that opens the mobile
 * capture page for the current session. Shown when the backend sets
 * `show_disclaimer` on an assistant message.
 */
export function Disclaimer({
  captureLink,
  answerLanguage,
}: {
  captureLink: string;
  answerLanguage?: string | null;
}) {
  const { t, i18n } = useTranslation();
  const lng = answerLanguage || i18n.language;

  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(
    captureLink,
  )}`;

  return (
    <div className="rk-disclaimer">
      <p className="rk-disclaimer-text">
        <span className="rk-disclaimer-title">{t("disclaimer_title", { lng })}</span>
        {t("disclaimer_text", { lng })}
      </p>
      {captureLink && (
        <div className="rk-disclaimer-qr">
          <img src={qrSrc} alt="QR Code" />
          <span className="rk-disclaimer-qr-label">{t("upload_via_qr", { lng })}</span>
        </div>
      )}
    </div>
  );
}
