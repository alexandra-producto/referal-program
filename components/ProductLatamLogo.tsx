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
  sm: { width: 83, height: 37 },
  md: { width: 132, height: 59 },
  lg: { width: 166, height: 75 },
  xl: { width: 221, height: 99 },
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

