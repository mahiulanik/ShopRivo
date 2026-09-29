import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  BadgeCheck,
  Headphones,
  HeartHandshake,
  RefreshCw,
  ShieldCheck,
  Truck,
  Wallet,
} from "lucide-react";
import Breadcrumbs from "../../components/common/Breadcrumbs";
import { fetchProducts } from "../../api/productApi";

const features = [
  {
    icon: Truck,
    title: "Fast, free delivery",
    text: "Free shipping on every order over ৳3,000 — and quick dispatch on everything else.",
  },
  {
    icon: ShieldCheck,
    title: "Secure payments",
    text: "Pay safely with card via Stripe or choose cash on delivery. Your data stays protected.",
  },
  {
    icon: RefreshCw,
    title: "Easy returns",
    text: "Changed your mind? Track every order and reach our team anytime from your account.",
  },
  {
    icon: Headphones,
    title: "Real support",
    text: "Friendly humans answering your questions Monday to Saturday, 10:00 AM – 7:00 PM.",
  },
];

const values = [
  {
    icon: BadgeCheck,
    title: "Quality first",
    text: "Every product is reviewed before it reaches the catalog. No listings we wouldn't buy ourselves.",
  },
  {
    icon: Wallet,
    title: "Fair prices",
    text: "Honest pricing with regular deals — like 20% off your first order — instead of fake markdowns.",
  },
  {
    icon: HeartHandshake,
    title: "Customers over clicks",
    text: "Transparent policies, real reviews from verified buyers, and support that actually replies.",
  },
];

const stats = [
  { value: "10k+", label: "Happy customers" },
  { value: "50k+", label: "Orders delivered" },
  { value: "100+", label: "Top brands" },
  { value: "24/7", label: "Order tracking" },
];

export default function AboutPage() {
  const [productCount, setProductCount] = useState(null);

  useEffect(() => {
    fetchProducts({ page: 1 })
      .then((res) => setProductCount(res.totalProducts))
      .catch(() => setProductCount(null));
  }, []);

  return (
    <div className="container-x py-10">
      <Breadcrumbs items={[{ label: "About" }]} />

      {/* Hero */}
      <section className="rounded-2xl bg-gradient-to-br from-brand-700 via-brand-600 to-brand-800 px-8 py-12 text-white sm:px-12 sm:py-16">
        <p className="text-sm font-semibold uppercase tracking-widest text-brand-200">
          About ShopCart
        </p>
        <h1 className="mt-3 max-w-2xl text-3xl font-extrabold leading-tight sm:text-4xl">
          Gadgets you&apos;ll love. Prices you&apos;ll trust.
        </h1>
        <p className="mt-4 max-w-xl text-sm leading-relaxed text-brand-100 sm:text-base">
          ShopCart is a modern online store built to make shopping simple: curated
          electronics and accessories, transparent pricing, and a checkout that takes
          under a minute.
        </p>
        <div className="mt-7 flex flex-wrap gap-3">
          <Link to="/shop" className="btn bg-white text-brand-800 hover:bg-brand-50">
            Start shopping <ArrowRight size={15} />
          </Link>
          <Link
            to="/contact"
            className="btn border border-white/40 text-white transition hover:bg-white/10"
          >
            Talk to us
          </Link>
        </div>
      </section>

      {/* Stats */}
      <section className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { value: productCount != null ? `${productCount}+` : "100+", label: "Products listed" },
          ...stats.slice(0, 3),
        ].map((stat) => (
          <div key={stat.label} className="card p-5 text-center sm:p-6">
            <p className="text-2xl font-extrabold text-brand-700 sm:text-3xl">{stat.value}</p>
            <p className="mt-1 text-xs font-medium text-gray-500 sm:text-sm">{stat.label}</p>
          </div>
        ))}
      </section>

      {/* Story */}
      <section className="mt-14 grid gap-8 lg:grid-cols-2">
        <div>
          <h2 className="text-2xl font-bold">Our story</h2>
          <p className="mt-4 text-sm leading-relaxed text-gray-600 dark:text-gray-300">
            ShopCart started with a simple frustration: online shopping should not feel
            like a gamble. Product pages hid fees, reviews faked trust, and support was a
            black hole.
          </p>
          <p className="mt-3 text-sm leading-relaxed text-gray-600 dark:text-gray-300">
            We built a store where the numbers speak for themselves — live stock, honest
            ratings from real buyers, delivery costs shown up front, and an order history
            you can follow from placed to delivered. What began as a small catalog is now
            a growing marketplace of electronics, wearables, and everyday gadgets.
          </p>
        </div>
        <div className="card p-7">
          <h3 className="text-lg font-bold">What we promise</h3>
          <ul className="mt-4 space-y-3 text-sm text-gray-600 dark:text-gray-300">
            {[
              "Prices and shipping costs shown before you pay — no surprises at checkout.",
              "Every review comes from a verified purchase, never from a bot.",
              "Your order status updates at every step, cancellable while it's processing.",
              "Payments run through Stripe; we never see or store your card details.",
            ].map((line) => (
              <li key={line} className="flex gap-2.5">
                <BadgeCheck size={17} className="mt-0.5 shrink-0 text-brand-600" />
                {line}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Features */}
      <section className="mt-14">
        <h2 className="text-2xl font-bold">Why shop with us</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((item) => (
            <div key={item.title} className="card p-6">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-100 text-brand-700">
                <item.icon size={19} />
              </span>
              <h3 className="mt-4 text-sm font-semibold">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-500">{item.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Values */}
      <section className="mt-14">
        <h2 className="text-2xl font-bold">What we believe</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {values.map((item) => (
            <div key={item.title} className="card p-6">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-100 text-brand-700">
                <item.icon size={19} />
              </span>
              <h3 className="mt-4 text-sm font-semibold">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-500">{item.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mt-14 flex flex-col items-center gap-4 rounded-2xl bg-gray-950 px-8 py-10 text-center text-white">
        <h2 className="text-2xl font-bold">Ready to find your next favorite gadget?</h2>
        <p className="max-w-lg text-sm text-gray-400">
          Browse the full catalog, or reach out if you need a hand — we&apos;re happy to help.
        </p>
        <div className="mt-2 flex flex-wrap justify-center gap-3">
          <Link to="/shop" className="btn-primary">
            Shop now <ArrowRight size={15} />
          </Link>
          <Link to="/contact" className="btn border border-gray-700 bg-transparent text-white hover:bg-gray-900">
            Contact us
          </Link>
        </div>
      </section>
    </div>
  );
}
