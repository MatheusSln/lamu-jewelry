"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

type Banner = { id: number; imageUrl: string; linkUrl: string };

export function BannerCarousel({ banners }: { banners: Banner[] }) {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    if (banners.length < 2) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % banners.length), 5000);
    return () => clearInterval(t);
  }, [banners.length]);

  if (banners.length === 0) return null;
  const banner = banners[index];
  const img = (
    <Image src={banner.imageUrl} alt="" fill sizes="100vw" className="object-cover" priority />
  );
  return (
    <div className="relative w-full aspect-[21/8] bg-cream-dark">
      {banner.linkUrl ? <Link href={banner.linkUrl}>{img}</Link> : img}
      {banners.length > 1 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
          {banners.map((b, i) => (
            <button
              key={b.id}
              aria-label={`Banner ${i + 1}`}
              onClick={() => setIndex(i)}
              className={`w-2 h-2 rounded-full ${i === index ? "bg-gold" : "bg-cream/70"}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
