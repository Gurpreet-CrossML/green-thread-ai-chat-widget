import { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import type { EmblaCarouselType } from "embla-carousel";
import { ProductCard } from "./ProductCard";
import type { Product } from "../types";

export function ProductCarousel({ products }: { products: Product[] }) {
  // align "start" → one main card on the left with a peek of the next; snap
  // stepping (no dragFree) → "next" advances exactly one card (1 → 2 → 3 …).
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "start",
    loop: false,
  });

  const [prevDisabled, setPrevDisabled] = useState(true);
  const [nextDisabled, setNextDisabled] = useState(true);
  const [selected, setSelected] = useState(0);
  const [snapCount, setSnapCount] = useState(0);

  const onSelect = useCallback((api: EmblaCarouselType) => {
    setPrevDisabled(!api.canScrollPrev());
    setNextDisabled(!api.canScrollNext());
    setSelected(api.selectedScrollSnap());
    setSnapCount(api.scrollSnapList().length);
  }, []);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect(emblaApi);
    emblaApi.on("select", onSelect).on("reInit", onSelect);
  }, [emblaApi, onSelect]);

  // Re-measure when a tyre image finishes loading, in case it shifts layout.
  const handleImageLoad = useCallback(() => emblaApi?.reInit(), [emblaApi]);

  if (!products || products.length === 0) return null;

  return (
    <div className="rk-embla">
      <div className="rk-embla__viewport" ref={emblaRef}>
        <div className="rk-embla__container">
          {products.map((product, index) => (
            <div className="rk-embla__slide" key={index}>
              <ProductCard product={product} onImageLoad={handleImageLoad} />
            </div>
          ))}
        </div>
      </div>

      <div className="rk-embla__controls">
        <div
          className="rk-embla__buttons"
          style={{
            visibility: prevDisabled && nextDisabled ? "hidden" : "visible",
          }}
        >
          <button
            className="rk-embla__btn"
            onClick={() => emblaApi?.scrollPrev()}
            disabled={prevDisabled}
            aria-label="Previous"
            type="button"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.2}
            >
              <path
                d="m15 18-6-6 6-6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <button
            className="rk-embla__btn"
            onClick={() => emblaApi?.scrollNext()}
            disabled={nextDisabled}
            aria-label="Next"
            type="button"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.2}
            >
              <path
                d="m9 18 6-6-6-6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>

        {snapCount > 1 && (
          <div className="rk-embla__count">
            {selected + 1} / {snapCount}
          </div>
        )}
      </div>
    </div>
  );
}
