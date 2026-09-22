"use client";

import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import { apiGet } from "@/lib/api";
import { useAuth } from "@/providers/auth-provider";
import { CheckCircle, Image as ImageIcon, Crown } from "lucide-react";
import { TierBadge } from "@/components/ui/badges";
import type { ContentItem } from "@/lib/types";

// YouTube-style card: thumbnail on top, then avatar + title + channel + views·time.
// One tap opens it (no hover overlays → no mobile double-tap). On PC hover the
// whole card lifts slightly.
export function ContentCard({ item, index }: { item: ContentItem; index: number }) {
  const qc = useQueryClient();
  const { user } = useAuth();
  const prefetch = () =>
    qc.prefetchQuery({
      queryKey: ["content", item.id, user?.id ?? "anon"],
      queryFn: () => apiGet(`/api/content/${item.id}`),
      staleTime: 60_000,
    });

  return (
    <Link
      href={item.is_short ? `/reels?v=${item.id}` : `/content/${item.id}`}
      onMouseEnter={prefetch}
      onTouchStart={prefetch}
      className="group relative flex animate-reveal flex-col transition-transform duration-200 hover:z-10 sm:hover:scale-[1.03]"
      style={{ animationDelay: `${(index % 12) * 0.05}s` }}
    >
      <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-[#111] shadow-sm transition-shadow duration-200 group-hover:shadow-[0_12px_40px_-12px_rgba(0,0,0,0.9)]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={item.thumbnail} alt={item.title} loading="lazy" className="h-full w-full object-cover" />

        {item.tier !== "free" && (
          <div className="absolute left-2 top-2 z-10">
            <TierBadge tier={item.tier} priceGems={item.price_gems} />
          </div>
        )}

        <div className="absolute bottom-2 right-2 rounded-md bg-black/80 px-1.5 py-0.5 text-[11px] font-medium text-white">
          {item.is_video ? item.duration : <ImageIcon size={12} />}
        </div>
      </div>

      <div className="mt-3 flex gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={item.creator.avatar}
          alt={item.creator.name}
          loading="lazy"
          className="h-9 w-9 shrink-0 rounded-full object-cover"
        />
        <div className="min-w-0 flex-1">
          <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-white">{item.title}</h3>
          <div className="mt-1 flex items-center gap-1 text-xs text-white/50">
            <span className="truncate">{item.creator.name}</span>
            {item.creator.verified && <CheckCircle size={12} className="shrink-0 text-white/40" />}
            {item.creator.vip_tier && <Crown size={12} className="shrink-0 text-fuchsia" />}
          </div>
          <div className="text-xs text-white/50">
            {item.views} views • {item.time_ago}
          </div>
        </div>
      </div>
    </Link>
  );
}
