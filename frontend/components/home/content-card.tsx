"use client";

import { useState } from "react";
import { Play, Heart, Bookmark, Image as ImageIcon } from "lucide-react";
import { TierBadge } from "@/components/ui/badges";
import type { ContentItem } from "@/lib/types";

export function ContentCard({ item, index }: { item: ContentItem; index: number }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className="group relative flex animate-reveal cursor-pointer flex-col"
      style={{ animationDelay: `${(index % 12) * 0.05}s` }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="relative aspect-[4/5] w-full overflow-hidden rounded-xl border border-white/5 bg-[#111] transition-all duration-500 group-hover:border-white/20 group-hover:shadow-[0_10px_40px_-10px_rgba(0,0,0,0.8)] sm:aspect-video">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={item.thumbnail}
          alt={item.title}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-1000 ease-out group-hover:scale-105"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/0 to-black/20 opacity-60 transition-opacity duration-300 group-hover:opacity-80" />

        {item.tier !== "free" && (
          <div className="absolute left-3 top-3 z-10">
            <TierBadge tier={item.tier} priceGems={item.price_gems} />
          </div>
        )}

        <div className="absolute right-3 top-3 z-10 flex items-center gap-1 rounded-md glass-pill px-2 py-1 text-[10px] font-medium text-white/90">
          {item.is_video ? (
            <>
              <Play size={10} className="fill-white" /> {item.duration}
            </>
          ) : (
            <ImageIcon size={12} />
          )}
        </div>

        <div
          className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ${
            hovered ? "opacity-100" : "scale-90 opacity-0"
          }`}
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white shadow-[0_0_20px_rgba(255,255,255,0.1)] backdrop-blur-md transition-transform duration-300 group-hover:scale-110">
            <Play size={20} className="ml-1 fill-white drop-shadow-md" />
          </div>
        </div>

        <div
          className={`absolute bottom-2 left-2 right-2 rounded-xl p-3 transition-all duration-300 ${
            hovered
              ? "translate-y-0 border border-white/10 bg-black/60 backdrop-blur-xl"
              : "translate-y-2 border-transparent bg-transparent"
          }`}
        >
          <h3 className="mb-1 line-clamp-2 text-sm font-semibold leading-snug text-white drop-shadow-md">
            {item.title}
          </h3>

          <div
            className={`flex items-center justify-between transition-opacity duration-300 ${
              hovered ? "opacity-100" : "opacity-80"
            }`}
          >
            <div className="flex items-center gap-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.creator.avatar}
                className="h-5 w-5 rounded-full border border-white/20"
                alt={item.creator.name}
              />
              <span className="max-w-[80px] truncate text-[11px] font-medium text-white/80 drop-shadow-sm">
                {item.creator.name}
              </span>
            </div>

            {hovered ? (
              <div className="flex gap-1.5">
                <button
                  className="rounded-md p-1.5 text-white transition-colors hover:bg-white/20"
                  onClick={(e) => e.preventDefault()}
                  aria-label="Like"
                >
                  <Heart size={14} />
                </button>
                <button
                  className="rounded-md p-1.5 text-white transition-colors hover:bg-white/20"
                  onClick={(e) => e.preventDefault()}
                  aria-label="Save"
                >
                  <Bookmark size={14} />
                </button>
              </div>
            ) : (
              <div className="text-[10px] font-medium text-white/60 drop-shadow-sm">
                {item.views} • {item.time_ago}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
