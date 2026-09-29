import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { CheckCircle2, Info, X, XCircle } from "lucide-react";

const ToastContext = createContext(null);

const icons = {
  success: <CheckCircle2 size={18} className="text-green-400" />,
  error: <XCircle size={18} className="text-red-400" />,
  info: <Info size={18} className="text-blue-400" />,
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const toast = useCallback(
    (message, type = "success", duration = 3200) => {
      let id;
      setToasts((prev) => {
        // Ignore duplicates: parallel requests failing at once (e.g. backend
        // down) would otherwise stack the same message on every render.
        if (prev.some((t) => t.message === message && t.type === type)) return prev;
        id = Date.now() + Math.random();
        // Keep at most 3 toasts visible.
        const next = [...prev, { id, message, type }];
        return next.length > 3 ? next.slice(next.length - 3) : next;
      });
      if (duration) setTimeout(() => removeToast(id), duration);
      return id;
    },
    [removeToast]
  );

  const value = useMemo(
    () => ({
      toast,
      success: (msg) => toast(msg, "success"),
      error: (msg) => toast(msg, "error"),
      info: (msg) => toast(msg, "info"),
    }),
    [toast]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed bottom-5 right-5 z-[100] flex w-[min(360px,90vw)] flex-col gap-2.5">
        {toasts.map((item) => (
          <div
            key={item.id}
            className="pointer-events-auto flex items-start gap-3 rounded-lg bg-gray-900 px-4 py-3 text-sm text-white shadow-2xl dark:bg-white dark:text-gray-900"
          >
            <span className="mt-0.5">{icons[item.type] || icons.info}</span>
            <span className="flex-1">{item.message}</span>
            <button
              onClick={() => removeToast(item.id)}
              className="opacity-60 transition hover:opacity-100"
              aria-label="Dismiss"
            >
              <X size={15} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
};
