import { useTranslation } from "react-i18next";
import { Disc, Gauge, RulerDimensionLine, Weight } from "lucide-react";
import type { Product } from "../types";

export function ProductCard({
  product,
  onImageLoad,
}: {
  product: Product;
  onImageLoad?: () => void;
}) {
  const { t } = useTranslation();
  const eu = product.eu_label;
  const imageUrl = product.image_url || product.image;
  const hasEuLabel =
    !!eu && (eu.wet_grip || eu.noise_db || eu.rolling_resistance);

  const lowStock =
    product.in_stock !== undefined &&
    product.in_stock !== null &&
    product.in_stock <= 4;

  return (
    <div className="rk-tyre-card">
      {product.is_premium && (
        <div className="rk-tyre-premium">⭐ PREMIUM</div>
      )}

      {imageUrl ? (
        <img
          className="rk-tyre-image"
          src={imageUrl}
          alt={product.model || product.name || "Tyre"}
          onLoad={onImageLoad}
          onError={onImageLoad}
        />
      ) : (
        <div className="rk-tyre-image rk-tyre-image-placeholder" aria-hidden>
          <Disc />
        </div>
      )}

      <div className="rk-tyre-brand">{product.brand}</div>
      <div className="rk-tyre-model">{product.model}</div>
      {product.name && <div className="rk-tyre-name">{product.name}</div>}

      {/* Price & availability */}
      <div className="rk-tyre-price-block">
        <div className="rk-tyre-price">
          {typeof product.price === "number"
            ? `€${product.price.toFixed(2)}`
            : t("price_not_available")}
        </div>
        {product.availability ? (
          <div>
            <div className="rk-tyre-instock">{t("in_stock")}</div>
            {product.in_stock !== undefined && product.in_stock !== null && (
              <div className={`rk-tyre-stockcount${lowStock ? " low" : ""}`}>
                {lowStock
                  ? t("only_left", { count: product.in_stock })
                  : t("count_in_stock", { count: product.in_stock })}
              </div>
            )}
          </div>
        ) : (
          <div className="rk-tyre-outstock">{t("out_of_stock")}</div>
        )}
      </div>

      {/* EU label */}
      {hasEuLabel && (
        <div className="rk-tyre-eu">
          <div className="rk-tyre-eu-title">{t("eu_label")}:</div>
          <div className="rk-tyre-eu-row">
            {eu!.wet_grip && (
              <span>
                <small>{t("wet_grip")}</small>
                <strong>{eu!.wet_grip}</strong>
              </span>
            )}
            {eu!.rolling_resistance && (
              <span>
                <small>{t("rolling_resistance")}</small>
                <strong>{eu!.rolling_resistance}</strong>
              </span>
            )}
            {eu!.noise_db && (
              <span>
                <small>{t("noise")}</small>
                <strong>{eu!.noise_db} dB</strong>
              </span>
            )}
          </div>
        </div>
      )}

      {/* Specs */}
      <div className="rk-tyre-specs">
        {product.size && (
          <span>
            <RulerDimensionLine className="rk-tyre-spec-icon" />
            {product.size}
          </span>
        )}
        {product.load_index && (
          <span>
            <Weight className="rk-tyre-spec-icon" />
            {product.load_index}
          </span>
        )}
        {product.speed_rating && (
          <span>
            <Gauge className="rk-tyre-spec-icon" />
            {product.speed_rating}
          </span>
        )}
      </div>

      {product.buy_link && (
        <button
          className="rk-tyre-buy"
          onClick={() => window.open(product.buy_link, "_blank")}
        >
          {t("view_and_buy")}
        </button>
      )}
    </div>
  );
}
