"use client";

import { useState } from "react";
import { User } from "lucide-react";

interface ImageWithFallbackProps {
  src: string | null | undefined;
  alt: string;
  className?: string;
}

export function ImageWithFallback({ src, alt, className }: ImageWithFallbackProps) {
  const [imgError, setImgError] = useState(false);

  if (!src || imgError) {
    return (
      <div className={`${className} flex items-center justify-center bg-gray-200`}>
        <User className="h-8 w-8 text-gray-400" />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => setImgError(true)}
    />
  );
}

