import { ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";

export default function Breadcrumbs({ items = [] }) {
  return (
    <nav className="mb-4 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
      <Link to="/" className="transition hover:text-gray-900 dark:hover:text-white">
        Home
      </Link>
      {items.map((item, index) => (
        <span key={`${item.label}-${index}`} className="flex items-center gap-2">
          <ChevronRight size={14} />
          {item.to ? (
            <Link to={item.to} className="transition hover:text-gray-900 dark:hover:text-white">
              {item.label}
            </Link>
          ) : (
            <span className="text-gray-800 dark:text-gray-200">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
