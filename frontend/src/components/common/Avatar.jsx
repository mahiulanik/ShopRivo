import { useState } from "react";

export default function Avatar({
  src,
  name = "",
  className = "h-9 w-9",
  shape = "rounded-full",
  fallbackClassName = "bg-brand-700 text-sm text-white",
  fallbackLetter,
}) {
  const [failedSrc, setFailedSrc] = useState(null);

  const letter = ((name && name.charAt(0)) || fallbackLetter || "U").toUpperCase();

  if (src && src !== failedSrc) {
    return (
      <img
        src={src}
        alt={name}
        onError={() => setFailedSrc(src)}
        className={`${className} ${shape} shrink-0 object-cover`}
      />
    );
  }

  return (
    <span
      className={`flex ${className} ${shape} shrink-0 items-center justify-center font-bold ${fallbackClassName}`}
    >
      {letter}
    </span>
  );
}
