import { useState } from "react";
import { Clock, Mail, MapPin, Phone, Send } from "lucide-react";
import { useToast } from "../../context/ToastContext";

export default function ContactPage() {
  const toast = useToast();
  const [form, setForm] = useState({ name: "", email: "", message: "" });

  const submit = (e) => {
    e.preventDefault();
    setForm({ name: "", email: "", message: "" });
    toast.success("Thanks! Your message has been recorded.");
  };

  return (
    <div className="container-x py-10">
      <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
        <div className="card p-7">
          <h1 className="text-2xl font-bold">Contact Us</h1>
          <p className="mt-2 text-sm text-gray-500">
            Have a question about an order or a product? Send us a message and we&apos;ll get
            back to you.
          </p>
          <form onSubmit={submit} className="mt-6 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label">Name</label>
                <input
                  className="input"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Email</label>
                <input
                  type="email"
                  className="input"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
            </div>
            <div>
              <label className="label">Message</label>
              <textarea
                className="input min-h-[140px]"
                required
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
              />
            </div>
            <button type="submit" className="btn-primary">
              <Send size={15} /> Send Message
            </button>
          </form>
        </div>

        <div className="space-y-4">
          {[
            { icon: MapPin, title: "Visit Us", value: "Dhaka, Bangladesh" },
            { icon: Phone, title: "Call Us", value: "+12 958 648 597" },
            { icon: Mail, title: "Email Us", value: "shoprivo@gmail.com" },
            { icon: Clock, title: "Working Hours", value: "Mon - Sat: 10:00 AM - 7:00 PM" },
          ].map((item) => (
            <div key={item.title} className="card flex items-center gap-4 p-5">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-100 text-brand-700">
                <item.icon size={19} />
              </span>
              <div>
                <p className="text-sm font-semibold">{item.title}</p>
                <p className="text-sm text-gray-500">{item.value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
