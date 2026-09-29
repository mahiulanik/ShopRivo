import { useMemo } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { Check, Package } from "lucide-react";

const CONFETTI_COLORS = [
  "#f43f5e", "#f59e0b", "#10b981", "#3b82f6",
  "#8b5cf6", "#ec4899", "#eab308", "#06b6d4", "#22c55e",
];

export default function OrderSuccessPage() {
  const { orderId } = useParams();
  const location = useLocation();
  const isOnline = location.state?.paymentType === "Online";

  const confetti = useMemo(
    () =>
      Array.from({ length: 80 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        delay: Math.random() * 4,
        duration: 4 + Math.random() * 4,
        width: 6 + Math.random() * 7,
        height: 8 + Math.random() * 8,
        round: Math.random() > 0.5,
      })),
    []
  );

  return (
    <div className="relative overflow-hidden py-10">
      {/* Celebration confetti */}
      <div aria-hidden="true">
        {confetti.map((piece) => (
          <span
            key={piece.id}
            className="confetti-piece"
            style={{
              left: `${piece.left}%`,
              width: `${piece.width}px`,
              height: `${piece.height}px`,
              background: piece.color,
              borderRadius: piece.round ? "50%" : "2px",
              animationDelay: `${piece.delay}s`,
              animationDuration: `${piece.duration}s`,
            }}
          />
        ))}
      </div>

      <div className="container-x">
        <div className="relative z-50 mx-auto max-w-xl rounded-2xl border border-gray-100 bg-white p-8 text-center shadow-card dark:border-gray-800 dark:bg-gray-900">
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-600 text-white shadow-lg ring-4 ring-green-100 dark:ring-green-950">
            <Check size={34} strokeWidth={3} />
          </span>

          <h1 className="mt-5 text-3xl font-bold">
            {isOnline ? "Payment Successful 🎉" : "Order Confirmed! 🎉"}
          </h1>

          <p className="mt-3 text-sm leading-6 text-gray-500">
            {isOnline
              ? "Thank you for your purchase. Your order has been placed successfully!"
              : "Thank you for your purchase. We're processing your order and will ship it soon. A confirmation email with your order details will be sent to your inbox shortly."}
          </p>

          <p className="mt-5 text-sm text-gray-500">
            Order Number: <span className="font-bold text-gray-900 dark:text-white">{orderId}</span>
          </p>

          <Link to="/orders" className="btn-primary mx-auto mt-5 inline-flex px-8 py-3">
            <Package size={16} /> Track Orders
          </Link>

          {isOnline ? (
            <p className="mt-4 text-xs text-gray-400">
              Your online payment may take a few seconds to reflect in your order list.
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
