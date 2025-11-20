import React from "react";
import Image from "next/image";

export function ProductLatamLogo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center ${className}`}>
      <Image
        src="/images/product-latam-logo.png"
        alt="Product Latam Logo"
        width={192}
        height={86}
        className="object-contain"
        priority
        unoptimized={false}
      />
    </div>
  );
}

