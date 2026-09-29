export function Loader({ size = 8, className = "" }) {
  return (
    <span
      className={`inline-block animate-spin rounded-full border-2 border-current border-r-transparent ${className}`}
      style={{ width: size * 4, height: size * 4 }}
      role="status"
      aria-label="Loading"
    />
  );
}

export default function PageLoader({ label = "Loading..." }) {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-gray-500">
      <Loader size={7} />
      <span className="text-sm">{label}</span>
    </div>
  );
}
