"use client";

import Image from "next/image";
import { useState } from "react";

export function ProductGallery({ photos, alt }: { photos: string[]; alt: string }) {
  const [selected, setSelected] = useState(0);
  if (photos.length === 0) {
    return <div className="aspect-square bg-cream-dark" />;
  }
  return (
    <div>
      <div className="relative aspect-square bg-card border border-gold-light/30">
        <Image
          src={photos[selected]}
          alt={alt}
          fill
          sizes="(max-width: 768px) 100vw, 50vw"
          className="object-cover"
          priority
        />
      </div>
      {photos.length > 1 && (
        <div className="flex gap-2 mt-2">
          {photos.map((p, i) => (
            <button
              key={p}
              onClick={() => setSelected(i)}
              aria-label={`Foto ${i + 1}`}
              className={`relative w-16 h-16 border ${i === selected ? "border-gold" : "border-gold-light/40"}`}
            >
              <Image src={p} alt="" fill sizes="64px" className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
