export default function StatusBadge({ status, className = "" }) {
  const map = {
    Processing: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400",
    Shipped: "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400",
    Delivered: "bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400",
    Cancelled: "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400",
    Paid: "bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400",
    Pending: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400",
    Failed: "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400",
    Canceled: "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400",
    Refunded: "bg-gray-100 text-gray-700 dark:bg-gray-500/15 dark:text-gray-300",
    Admin: "bg-purple-100 text-purple-700 dark:bg-purple-500/15 dark:text-purple-400",
    Uploader: "bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-400",
    User: "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-400",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
        map[status] || "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300"
      } ${className}`}
    >
      {status || "--"}
    </span>
  );
}
