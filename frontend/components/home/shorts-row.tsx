"use client";

import Link from "next/link";
import { Clapperboard, Play } from "lucide-react";
import { fmtCount } from "@/lib/format";

export interface Reel { id: string; title: string; thumbnail_url: string | null; creator: { name: string }; like_count: number; }

export function ShortsRow({ reels }: { reels: Reel[] }) {
  if (!reels || reels.length === 0) return null;
  return (
    <section className="my-2">
      <div className="mb-3 flex items-center gap-2 px-1">
        <Clapperboard size={20} className="text-rose" />
        <h2 className="text-lg font-bold tracking-tight text-white">Reels</h2>
        <Link href="/reels" className="ml-auto text-sm text-white/40 hover:text-white">See all</Link>
      </div>
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
        {reels.slice(0, 6).map((r) => (
          <Link key={r.id} href={`/reels?v=${r.id}`} className="group relative aspect-[9/16] w-full overflow-hidden rounded-xl bg-elevated">
            {r.thumbnail_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={r.thumbnail_url} alt={r.title} className="h-full w-full object-cover transition-transform group-hover:scale-105" />
            ) : (
              <div className="flex h-full items-center justify-center"><Play size={28} className="text-white/40" /></div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
            <div className="absolute bottom-2 left-2 right-2">
              <p className="line-clamp-2 text-xs font-semibold text-white">{r.title}</p>
              <p className="mt-0.5 text-[11px] text-white/60">{fmtCount(r.like_count)} likes</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
