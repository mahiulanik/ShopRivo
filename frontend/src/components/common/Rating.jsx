import { Star } from "lucide-react";

export default function Rating({
  value = 0,
  size = 14,
  className = "",
  showValue = false,
  count,
}) {
  const rating = Number(value) || 0;
  const stars = [1, 2, 3, 4, 5];

  return (
    <span className={`inline-flex items-center gap-1 ${className}`}>
      <span className="inline-flex items-center gap-0.5">
        {stars.map((star) => (
          <Star
            key={star}
            size={size}
            className={
              star <= Math.round(rating)
                ? "fill-amber-400 text-amber-400"
                : "fill-gray-200 text-gray-200 dark:fill-gray-700 dark:text-gray-700"
            }
          />
        ))}
      </span>
      {showValue ? <span className="text-xs font-medium">{rating.toFixed(1)}</span> : null}
      {count !== undefined ? <span className="text-xs text-gray-500">({count})</span> : null}
    </span>
  );
}
