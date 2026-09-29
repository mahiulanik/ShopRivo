import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import ProductCard from "./ProductCard";

export default function ProductCarousel({ title, to, label = "See all", products = [] }) {
  const trackRef = useRef(null);
  const [edges, setEdges] = useState({ start: true, end: true });

  const syncEdges = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setEdges({
      start: el.scrollLeft <= 2,
      end: max <= 2 || el.scrollLeft >= max - 2,
    });
  }, []);

  useEffect(() => {
    syncEdges();
    const el = trackRef.current;
    if (!el) return undefined;
    const onScroll = () => syncEdges();
    el.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      el.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [syncEdges, products]);

  const scrollPage = (direction) => {
    const el = trackRef.current;
    if (!el) return;
    const card = el.firstElementChild;
    const styles = window.getComputedStyle(el);
    const gap = parseFloat(styles.columnGap || styles.gap) || 20;
    const step = card ? card.getBoundingClientRect().width + gap : el.clientWidth;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollBy({
      left: direction * step,
      behavior: reduced ? "auto" : "smooth",
    });
  };

  const scrollable = !(edges.start && edges.end);

  const arrowBtn =
    "absolute top-[38%] z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-gray-700 shadow-md transition hover:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none sm:h-10 sm:w-10 dark:bg-gray-800/90 dark:text-gray-200 dark:hover:bg-gray-800";

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-lg font-bold sm:text-xl">{title}</h2>
        <Link
          to={to}
          className="rounded-full border border-gray-200 px-4 py-1.5 text-sm font-medium transition hover:border-brand-600 hover:text-brand-700 dark:border-gray-700"
        >
          {label}
        </Link>
      </div>

      <div className="relative">
        <div
          ref={trackRef}
          className="scrollbar-none snap-x flex gap-5 overflow-x-auto pb-1"
        >
          {products.map((product) => (
            <div
              key={product.id}
              className="w-[72%] shrink-0 snap-start sm:w-[calc(50%-10px)] lg:w-[calc(33.333%-13.34px)] xl:w-[calc(25%-15px)]"
            >
              <ProductCard product={product} />
            </div>
          ))}
        </div>

        {scrollable ? (
          <>
            <button
              type="button"
              onClick={() => scrollPage(-1)}
              disabled={edges.start}
              aria-label={`Scroll ${title} products backwards`}
              className={`${arrowBtn} left-1 sm:left-2`}
            >
              <ChevronLeft size={20} />
            </button>
            <button
              type="button"
              onClick={() => scrollPage(1)}
              disabled={edges.end}
              aria-label={`Scroll ${title} products forwards`}
              className={`${arrowBtn} right-1 sm:right-2`}
            >
              <ChevronRight size={20} />
            </button>
          </>
        ) : null}
      </div>
    </div>
  );
}
