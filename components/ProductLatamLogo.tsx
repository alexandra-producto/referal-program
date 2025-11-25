import React from "react";
import Image from "next/image";

interface ProductLatamLogoProps {
  className?: string;
  width?: number;
  height?: number;
  priority?: boolean;
  size?: "sm" | "md" | "lg" | "xl";
}

const sizeMap = {
  sm: { width: 120, height: 54 },
  md: { width: 192, height: 86 },
  lg: { width: 240, height: 108 },
  xl: { width: 320, height: 144 },
};

export function ProductLatamLogo({ 
  className = "", 
  width,
  height,
  priority = true,
  size = "lg"
}: ProductLatamLogoProps) {
  // Usar size si no se especifican width/height
  const dimensions = width && height 
    ? { width, height }
    : sizeMap[size];

  return (
    <div className={`flex items-center ${className}`}>
      <Image
        src="/images/product-latam-logo.png"
        alt="Product Latam Logo"
        width={dimensions.width}
        height={dimensions.height}
        className="object-contain"
        priority={priority}
        quality={100}
        style={{
          maxWidth: '100%',
          height: 'auto',
        }}
      />
    </div>
  );
}

