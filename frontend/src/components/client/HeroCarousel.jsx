import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";

const SLIDES = [
  {
    id: "appliances",
    src: "/banner/appliances-banner.webp",
    alt: "Upgrade your home with smart appliances built for everyday convenience",
    category: "Appliances",
    position: "sm:object-center",
  },
  {
    id: "gadgets",
    src: "/banner/gadgets-banner.webp",
    alt: "Explore the latest gadgets - innovative tech for a smarter lifestyle",
    category: "Gadgets",
    position: "sm:object-center",
  },
  {
    id: "phones",
    src: "/banner/phones-banner.webp",
    alt: "Stay connected with the latest phones - powerful smartphones for a brighter tomorrow",
    category: "Phones",
    position: "sm:object-[center_57%]",
  },
  {
    id: "watches",
    src: "/banner/watches-banner.webp",
    alt: "Time for a better you - watches with classic designs and modern performance",
    category: "Watches",
    position: "sm:object-center",
  },
];

const AUTOPLAY_MS = 3000;
const SWIPE_THRESHOLD = 45;

function useMediaQuery(query) {
  const [matches, setMatches] = useState(() =>
    typeof window !== "undefined" && window.matchMedia
      ? window.matchMedia(query).matches
      : false
  );

  useEffect(() => {
    const media = window.matchMedia(query);
    const update = () => setMatches(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, [query]);

  return matches;
}

export default function HeroCarousel() {
  const [index, setIndex] = useState(0);
  const touchStartX = useRef(null);
  const count = SLIDES.length;
  const reducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");

  const go = useCallback(
    (step) => setIndex((current) => (current + step + count) % count),
    [count]
  );

  useEffect(() => {
    const timer = setInterval(() => setIndex((i) => (i + 1) % count), AUTOPLAY_MS);
    return () => clearInterval(timer);
  }, [count]);

  // Warm up the next slide so lazily-loaded banners never appear blank.
  useEffect(() => {
    const next = new Image();
    next.src = SLIDES[(index + 1) % count].src;
    return () => {
      next.onload = null;
      next.onerror = null;
    };
  }, [index, count]);

  const onTouchStart = (event) => {
    touchStartX.current = event.touches[0].clientX;
  };

  const onTouchEnd = (event) => {
    if (touchStartX.current === null) return;
    const delta = event.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(delta) < SWIPE_THRESHOLD) return;
    go(delta < 0 ? 1 : -1);
  };

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Featured offers"
      className="relative overflow-hidden rounded-2xl bg-gray-100 dark:bg-gray-900"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <div
        className={`flex aspect-[2/1] sm:aspect-[5/2] lg:aspect-[16/5] ${
          reducedMotion ? "" : "transition-transform duration-500 ease-out"
        }`}
        style={{ transform: `translate3d(-${index * 100}%, 0, 0)` }}
      >
        {SLIDES.map((slide, i) => (
          <div
            key={slide.id}
            role="group"
            aria-roledescription="slide"
            aria-label={`${i + 1} of ${count}`}
            aria-hidden={i !== index}
            className="h-full w-full shrink-0"
          >
            <Link
              to={`/?category=${encodeURIComponent(slide.category)}`}
              tabIndex={i === index ? 0 : -1}
              className="relative block h-full w-full"
              aria-label={`Shop ${slide.category}`}
            >
              <img
                src={slide.src}
                alt={slide.alt}
                draggable={false}
                loading={i === 0 ? "eager" : "lazy"}
                fetchpriority={i === 0 ? "high" : undefined}
                decoding="async"
                className={`relative h-full w-full select-none object-cover object-left ${slide.position}`}
              />
            </Link>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={() => go(-1)}
        aria-label="Previous banner"
        className="absolute left-3 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 text-gray-700 shadow-md transition hover:bg-white focus:outline-none focus:ring-2 focus:ring-white/70 sm:flex"
      >
        <ChevronLeft size={20} />
      </button>
      <button
        type="button"
        onClick={() => go(1)}
        aria-label="Next banner"
        className="absolute right-3 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 text-gray-700 shadow-md transition hover:bg-white focus:outline-none focus:ring-2 focus:ring-white/70 sm:flex"
      >
        <ChevronRight size={20} />
      </button>

      <div className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 items-center gap-2 rounded-full bg-gray-900/40 px-2.5 py-1.5 backdrop-blur-sm sm:bottom-4">
        {SLIDES.map((slide, i) => (
          <button
            key={slide.id}
            type="button"
            onClick={() => setIndex(i)}
            aria-label={`Go to ${slide.category} banner`}
            aria-current={i === index}
            className={`h-2 rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-white/70 ${
              i === index ? "w-6 bg-white" : "w-2 bg-white/50 hover:bg-white/80"
            }`}
          />
        ))}
      </div>
    </section>
  );
}
