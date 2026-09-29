import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Sparkles, X } from "lucide-react";
import { aiSearch, fetchProducts } from "../../api/productApi";
import { getErrorMessage } from "../../api/client";
import { useToast } from "../../context/ToastContext";
import PageLoader from "../../components/common/Loader";
import Pagination from "../../components/common/Pagination";
import ProductCard from "../../components/client/ProductCard";
import { AVAILABILITY_FILTERS, CURRENCY, RATING_FILTERS } from "../../utils/constants";
import { truncate } from "../../utils/format";

function FilterGroup({ title, items, selected, onToggle, onReset }) {
  return (
    <div className="border-b border-gray-100 py-5 dark:border-gray-800">
      <h3 className="mb-3 font-semibold">{title}</h3>
      <div className="space-y-2">
        {items.map((item) => (
          <label key={item.value} className="flex cursor-pointer items-center gap-2.5 text-sm">
            <input
              type="checkbox"
              checked={selected === item.value}
              onChange={() => onToggle(item.value)}
              className="h-4 w-4 rounded border-gray-300 text-brand-700 focus:ring-brand-600"
            />
            <span className={selected === item.value ? "font-semibold text-brand-700" : "text-gray-600 dark:text-gray-300"}>
              {item.label}
            </span>
          </label>
        ))}
      </div>
      <button
        onClick={onReset}
        className="mt-3 text-xs font-medium text-gray-500 underline underline-offset-2 hover:text-brand-700"
      >
        Reset selection
      </button>
    </div>
  );
}

const PRICE_MIN = 0;
const PRICE_MAX_FALLBACK = 200000;
const PRICE_STEP = 100;

const parsePriceParam = (value, maxPrice = PRICE_MAX_FALLBACK) => {
  const [min, max] = String(value || "").split("-").map(Number);
  const clamp = (n) =>
    Number.isFinite(n) ? Math.min(Math.max(n, PRICE_MIN), maxPrice) : null;
  const lo = clamp(min);
  const hi = clamp(max);
  if (lo == null || hi == null) return [PRICE_MIN, maxPrice];
  return [Math.min(lo, hi), Math.max(lo, hi)];
};

const priceLabel = (value) => `${CURRENCY}${Number(value).toLocaleString("en-IN")}`;

function PriceFilter({ value, maxPrice = PRICE_MAX_FALLBACK, onApply, onReset }) {
  const [range, setRange] = useState(() => parsePriceParam(value, maxPrice));
  const dirtyRef = useRef(false);

  // Re-sync when the URL is changed externally (e.g. "Reset Filters")
  // or when the real maximum price arrives from the API.
  useEffect(() => {
    setRange(parsePriceParam(value, maxPrice));
  }, [value, maxPrice]);

  // Commit to the URL once the user stops moving the slider (drag or keyboard).
  useEffect(() => {
    if (!dirtyRef.current) return;
    const timer = setTimeout(() => {
      dirtyRef.current = false;
      const [lo, hi] = range;
      onApply(lo <= PRICE_MIN && hi >= maxPrice ? "" : `${lo}-${hi}`);
    }, 450);
    return () => clearTimeout(timer);
  }, [range]); // eslint-disable-line react-hooks/exhaustive-deps

  const [lo, hi] = range;
  const toPct = (v) => ((v - PRICE_MIN) / (maxPrice - PRICE_MIN || 1)) * 100;

  const setLow = (v) => {
    dirtyRef.current = true;
    setRange([Math.min(Number(v), hi), hi]);
  };
  const setHigh = (v) => {
    dirtyRef.current = true;
    setRange([lo, Math.max(Number(v), lo)]);
  };

  const reset = () => {
    dirtyRef.current = false;
    setRange([PRICE_MIN, maxPrice]);
    onReset();
  };

  return (
    <div className="border-b border-gray-100 py-5 dark:border-gray-800">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-semibold">Price</h3>
        <button
          onClick={reset}
          className="text-xs font-medium text-gray-500 underline underline-offset-2 hover:text-brand-700"
        >
          Reset
        </button>
      </div>

      <div className="mb-3 flex items-center justify-between gap-2 text-sm">
        <span className="rounded-md bg-gray-100 px-2 py-1 font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-300">
          {priceLabel(lo)}
        </span>
        <span className="text-xs text-gray-400">to</span>
        <span className="rounded-md bg-gray-100 px-2 py-1 font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-300">
          {priceLabel(hi)}
        </span>
      </div>

      <div className="range-slider">
        <span className="range-track" />
        <span
          className="range-track-active"
          style={{ left: `${toPct(lo)}%`, width: `${toPct(hi) - toPct(lo)}%` }}
        />
        <input
          type="range"
          className="range-input"
          min={PRICE_MIN}
          max={maxPrice}
          step={PRICE_STEP}
          value={lo}
          onChange={(e) => setLow(e.target.value)}
          aria-label="Minimum price"
        />
        <input
          type="range"
          className="range-input"
          min={PRICE_MIN}
          max={maxPrice}
          step={PRICE_STEP}
          value={hi}
          onChange={(e) => setHigh(e.target.value)}
          aria-label="Maximum price"
        />
      </div>

      <div className="mt-1.5 flex justify-between text-[11px] text-gray-400">
        <span>{priceLabel(PRICE_MIN)}</span>
        <span>{priceLabel(maxPrice)}</span>
      </div>
    </div>
  );
}

export default function ShopPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const toast = useToast();

  const [data, setData] = useState({ products: [], totalProducts: 0, totalPages: 1, currentPage: 1 });
  const [categories, setCategories] = useState([]);
  const [maxPrice, setMaxPrice] = useState(PRICE_MAX_FALLBACK);
  const [loading, setLoading] = useState(true);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResults, setAiResults] = useState(null);

  const search = searchParams.get("search") || "";
  const category = searchParams.get("category") || "";
  const price = searchParams.get("price") || "";
  const availability = searchParams.get("availability") || "";
  const ratings = searchParams.get("ratings") || "";
  const page = Number(searchParams.get("page") || 1);

  const setParam = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    if (key !== "page") next.delete("page");
    setSearchParams(next);
  };

  const resetFilters = () => setSearchParams(search ? { search } : {});

  useEffect(() => {
    let active = true;
    setLoading(true);
    const params = { page };
    if (search) params.search = search;
    if (category) params.category = category;
    if (price) params.price = price;
    if (availability) params.availability = availability;
    if (ratings) params.ratings = ratings;

    fetchProducts(params)
      .then((res) => {
        if (!active) return;
        setData(res);
        const highest = Number(res.maxPrice);
        if (Number.isFinite(highest) && highest > 0) {
          setMaxPrice(Math.ceil(highest / PRICE_STEP) * PRICE_STEP);
        }
        setCategories((prev) => {
          const seen = new Set(prev);
          const collect = (list = []) =>
            list.forEach((p) => p.category && seen.add(p.category));
          collect(res.products);
          collect(res.newProducts);
          collect(res.topRatedProducts);
          return Array.from(seen);
        });
      })
      .catch((err) => toast.error(getErrorMessage(err, "Failed to load products")))
      .finally(() => active && setLoading(false));

    return () => {
      active = false;
    };
  }, [search, category, price, availability, ratings, page, toast]);

  const runAiSearch = async (e) => {
    e.preventDefault();
    if (!aiPrompt.trim()) return;
    setAiLoading(true);
    try {
      const res = await aiSearch(aiPrompt.trim());
      setAiResults(res.products);
      if (!res.products?.length) toast.info(res.message);
      else toast.success(res.message);
    } catch (err) {
      toast.error(getErrorMessage(err, "AI search failed"));
    } finally {
      setAiLoading(false);
    }
  };

  const categoryItems = categories.map((c) => ({ label: c, value: c }));
  const hasFilters = Boolean(category || price || availability || ratings || search);

  return (
    <div className="container-x py-8">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold uppercase tracking-wide">
          Get the products as your needs
        </h1>
        {hasFilters ? (
          <button onClick={resetFilters} className="text-sm font-medium underline hover:text-brand-700">
            Reset Filters
          </button>
        ) : null}
      </div>

      <form onSubmit={runAiSearch} className="mb-6 flex flex-wrap gap-2">
        <input
          className="input max-w-xl"
          placeholder="Try AI search: 'a gift for a photographer under ৳5000'"
          value={aiPrompt}
          onChange={(e) => setAiPrompt(e.target.value)}
        />
        <button type="submit" disabled={aiLoading} className="btn-primary">
          <Sparkles size={15} /> {aiLoading ? "Searching..." : "AI Search"}
        </button>
        {aiResults ? (
          <button type="button" onClick={() => setAiResults(null)} className="btn-outline">
            <X size={15} /> Clear AI results
          </button>
        ) : null}
      </form>

      <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
        <aside className="h-max rounded-xl border border-gray-100 px-4 dark:border-gray-800">
          <FilterGroup
            title="Category"
            items={categoryItems}
            selected={category}
            onToggle={(value) => setParam("category", category === value ? "" : value)}
            onReset={() => setParam("category", "")}
          />
          <PriceFilter
            value={price}
            maxPrice={maxPrice}
            onApply={(value) => setParam("price", value)}
            onReset={() => setParam("price", "")}
          />
          <FilterGroup
            title="Availability"
            items={AVAILABILITY_FILTERS}
            selected={availability}
            onToggle={(value) => setParam("availability", availability === value ? "" : value)}
            onReset={() => setParam("availability", "")}
          />
          <FilterGroup
            title="Ratings"
            items={RATING_FILTERS}
            selected={ratings}
            onToggle={(value) => setParam("ratings", ratings === value ? "" : value)}
            onReset={() => setParam("ratings", "")}
          />
        </aside>

        <section>
          {aiResults ? (
            <div className="mb-6 rounded-xl border border-accent-200 bg-accent-50 p-4 dark:border-accent-900 dark:bg-accent-950/40">
              <p className="mb-3 text-sm font-semibold text-accent-700 dark:text-accent-300">
                AI recommendations for &ldquo;{aiPrompt}&rdquo; ({aiResults.length})
              </p>
              {aiResults.length > 0 ? (
                <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                  {aiResults.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-accent-300 py-12 text-center text-sm text-accent-700 dark:border-accent-800 dark:text-accent-300">
                  No products matched your AI search. Try describing what you&apos;re
                  looking for differently.
                </div>
              )}
            </div>
          ) : loading ? (
            <PageLoader label="Loading products..." />
          ) : data.products.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-200 py-20 text-center text-gray-500 dark:border-gray-700">
              No products found matching your filters.
            </div>
          ) : (
            <>
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {data.products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
              <Pagination
                currentPage={data.currentPage}
                totalPages={data.totalPages}
                onChange={(p) => setParam("page", String(p))}
              />
            </>
          )}
        </section>
      </div>
    </div>
  );
}
