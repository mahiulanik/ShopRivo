import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Headphones, Laptop, Smartphone, Watch, Zap } from "lucide-react";
import { fetchCategories, fetchProducts } from "../../api/productApi";
import { getErrorMessage } from "../../api/client";
import { useToast } from "../../context/ToastContext";
import PageLoader from "../../components/common/Loader";
import HeroCarousel from "../../components/client/HeroCarousel";
import ProductCarousel from "../../components/client/ProductCarousel";

function GrinderIcon({ size = 24 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M7.5 3h9" />
      <path d="M8.5 3 9.5 12h5L15.5 3" />
      <rect x="5" y="13" width="14" height="8" rx="2" />
      <path d="M9.5 17h5" />
    </svg>
  );
}

const categoryIcons = {
  Gadget: Laptop,
  Gadgets: Headphones,
  Appliances: GrinderIcon,
  Refrigerators: Zap,
  Smartphones: Smartphone,
  Phones: Smartphone,
  Watches: Watch,
  Headphones: Headphones,
};

export default function HomePage() {
  const toast = useToast();
  const [searchParams] = useSearchParams();
  const activeCategory = searchParams.get("category") || "";
  const [data, setData] = useState(null);
  const [categories, setCategories] = useState([]);
  const [categoryProducts, setCategoryProducts] = useState({});
  const [loading, setLoading] = useState(true);
  const rowRefs = useRef({});

  const scrollToCategory = (name) => {
    const el = rowRefs.current[name];
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        const [productsRes, categoriesRes] = await Promise.all([
          fetchProducts({ page: 1 }),
          fetchCategories().catch(() => ({ categories: [] })),
        ]);
        if (!active) return;

        const categoryList = categoriesRes.categories || [];
        setData(productsRes);
        setCategories(categoryList);

        const rows = await Promise.all(
          categoryList.map(async (cat) => {
            try {
              const res = await fetchProducts({ category: cat.name, page: 1 });
              return [cat.name, res.products || []];
            } catch {
              return [cat.name, []];
            }
          })
        );
        if (!active) return;

        setCategoryProducts(Object.fromEntries(rows));
      } catch (err) {
        if (active) toast.error(getErrorMessage(err, "Failed to load products"));
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [toast]);

  useEffect(() => {
    if (loading || !activeCategory) return undefined;
    const timer = setTimeout(() => scrollToCategory(activeCategory), 80);
    return () => clearTimeout(timer);
  }, [loading, activeCategory]);

  return (
    <div>
      {/* Hero */}
      <section className="container-x pt-4">
        <HeroCarousel />
      </section>

      {/* Categories */}
      {categories.length > 0 ? (
        <section className="container-x mt-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-3">
              {categories.map((cat) => {
                const iconKey = Object.keys(categoryIcons).find(
                  (key) => key.toLowerCase() === (cat.name || "").toLowerCase()
                );
                const Icon = iconKey ? categoryIcons[iconKey] : Zap;
                const isActive = activeCategory === cat.name;
                return (
                  <Link
                    key={cat.id || cat.name}
                    to={`/?category=${encodeURIComponent(cat.name)}`}
                    onClick={() => scrollToCategory(cat.name)}
                    className={`flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition ${
                      isActive
                        ? "bg-brand-700 text-white hover:bg-brand-800"
                        : "bg-gray-100 text-gray-700 hover:bg-brand-700 hover:text-white dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-brand-700"
                    }`}
                  >
                    <Icon size={15} /> {cat.name}
                  </Link>
                );
              })}
            </div>
            <Link
              to="/shop"
              className="rounded-full border border-gray-200 px-5 py-2 text-sm font-medium hover:border-brand-600 hover:text-brand-700 dark:border-gray-700"
            >
              See all
            </Link>
          </div>
        </section>
      ) : null}

      {/* New arrivals */}
      {loading ? (
        <section className="container-x mt-8">
          <PageLoader label="Loading the store..." />
        </section>
      ) : (
        <>
          {data?.newProducts?.length ? (
            <section className="container-x mt-8">
              <ProductCarousel title="New Arrivals" to="/shop" products={data.newProducts} />
            </section>
          ) : null}

          {/* Top rated */}
          {data?.topRatedProducts?.length ? (
            <section className="container-x mt-12">
              <ProductCarousel title="Top Rated" to="/shop" products={data.topRatedProducts} />
            </section>
          ) : null}

          {/* One row per category */}
          {categories.map((cat) => {
            const items = categoryProducts[cat.name] || [];
            if (!items.length) return null;
            return (
              <section
                key={cat.id || cat.name}
                ref={(el) => {
                  rowRefs.current[cat.name] = el;
                }}
                className="container-x mt-12 scroll-mt-24"
              >
                <ProductCarousel
                  title={cat.name}
                  to={`/shop?category=${encodeURIComponent(cat.name)}`}
                  products={items}
                />
              </section>
            );
          })}
        </>
      )}

      {/* Value props */}
      <section className="container-x mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { title: "Free Shipping", desc: "On orders above ৳3,000" },
          { title: "Secure Payments", desc: "Stripe powered checkout" },
          { title: "24/7 Support", desc: "We are always here to help" },
          { title: "Quality Products", desc: "Hand picked by our team" },
        ].map((item) => (
          <div key={item.title} className="card p-5">
            <p className="font-semibold">{item.title}</p>
            <p className="mt-1 text-sm text-gray-500">{item.desc}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
