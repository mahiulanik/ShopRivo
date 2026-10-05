import { useState } from "react";
import { Link } from "react-router-dom";
import { Clock, Facebook, Github, Instagram, Linkedin, Mail, MapPin, Phone, Twitter, Youtube } from "lucide-react";
import { useToast } from "../../context/ToastContext";

const quickLinks = [
  { to: "/shop", label: "About us" },
  { to: "/contact", label: "Contact us" },
  { to: "/contact", label: "Terms & Conditions" },
  { to: "/contact", label: "Privacy Policy" },
  { to: "/contact", label: "FAQs" },
];

const categories = ["Appliances", "Gadgets", "Phones", "Watches"];

const socials = [Youtube, Twitter, Linkedin, Facebook, Instagram, Github];

export default function Footer() {
  const toast = useToast();
  const [email, setEmail] = useState("");

  const subscribe = (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setEmail("");
    toast.success("Thanks for subscribing to our newsletter!");
  };

  return (
    <footer className="mt-16 border-t border-gray-100 bg-white dark:border-gray-800 dark:bg-gray-950">
      <div className="container-x grid gap-8 py-10 sm:grid-cols-2 lg:grid-cols-4">
        <div className="flex gap-3">
          <MapPin className="mt-1 shrink-0 text-brand-700" size={20} />
          <div>
            <p className="font-semibold">Visit Us</p>
            <p className="text-sm text-gray-500">Dhaka, Bangladesh</p>
          </div>
        </div>
        <div className="flex gap-3">
          <Phone className="mt-1 shrink-0 text-brand-700" size={20} />
          <div>
            <p className="font-semibold">Call Us</p>
            <p className="text-sm text-gray-500">+12 958 648 597</p>
          </div>
        </div>
        <div className="flex gap-3">
          <Clock className="mt-1 shrink-0 text-brand-700" size={20} />
          <div>
            <p className="font-semibold">Working Hours</p>
            <p className="text-sm text-gray-500">Mon - Sat: 10:00 AM - 7:00 PM</p>
          </div>
        </div>
        <div className="flex gap-3">
          <Mail className="mt-1 shrink-0 text-brand-700" size={20} />
          <div>
            <p className="font-semibold">Email Us</p>
            <p className="text-sm text-gray-500">shoprivo@gmail.com</p>
          </div>
        </div>
      </div>

      <div className="container-x grid gap-10 border-t border-gray-100 py-10 sm:grid-cols-2 lg:grid-cols-4 dark:border-gray-800">
        <div>
          <p className="text-xl font-extrabold">
            <span className="text-gray-900 dark:text-white">Shop</span>
            <span className="text-brand-700">Rivo</span>
          </p>
          <p className="mt-3 max-w-xs text-sm leading-6 text-gray-500">
            Discover curated collections at ShopRivo, blending style and comfort to elevate your
            living spaces.
          </p>
          <div className="mt-4 flex gap-2.5">
            {socials.map((Icon, i) => (
              <span
                key={i}
                className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-gray-200 text-gray-500 transition hover:border-brand-600 hover:text-brand-700 dark:border-gray-700"
              >
                <Icon size={15} />
              </span>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-4 font-semibold">Quick Links</p>
          <ul className="space-y-2.5 text-sm text-gray-500">
            {quickLinks.map((link, i) => (
              <li key={i}>
                <Link to={link.to} className="transition hover:text-brand-700">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="mb-4 font-semibold">Categories</p>
          <ul className="space-y-2.5 text-sm text-gray-500">
            {categories.map((cat) => (
              <li key={cat}>
                <Link
                  to={`/?category=${encodeURIComponent(cat)}`}
                  className="transition hover:text-brand-700"
                >
                  {cat}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="mb-4 font-semibold">Newsletter</p>
          <p className="mb-3 text-sm text-gray-500">
            Subscribe to our newsletter to receive updates and exclusive offers.
          </p>
          <form onSubmit={subscribe} className="space-y-2.5">
            <input
              type="email"
              required
              className="input"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <button type="submit" className="btn-dark w-full">
              Subscribe
            </button>
          </form>
        </div>
      </div>

      <div className="border-t border-gray-100 py-5 text-center text-sm text-gray-500 dark:border-gray-800">
        © {new Date().getFullYear()} <span className="font-bold text-gray-800 dark:text-gray-200">ShopRivo</span>. All rights reserved.
      </div>
    </footer>
  );
}
