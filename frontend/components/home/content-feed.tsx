"use client";

import { useEffect, useMemo, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Sparkles } from "lucide-react";
import { useContentFeed } from "@/hooks/use-content-feed";
import { ContentCard } from "./content-card";
import { Skeleton } from "@/components/ui/badges";
import { ShortsRow, type Reel } from "./shorts-row";
import { apiGet } from "@/lib/api";

export function ContentFeed({ category }: { category: string }) {
  const {
    data,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useContentFeed(category);

  const sentinel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = sentinel.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { rootMargin: "400px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  const items = data?.pages.flatMap((p) => p.items) ?? [];

  const { data: reelsData } = useQuery({
    queryKey: ["shorts-batch"],
    queryFn: () => apiGet<{ items: Reel[] }>("/api/reels?limit=30"),
    enabled: category === "",
  });
  const reelChunks = useMemo(() => {
    const rs = reelsData?.items ?? [];
    const chunks: Reel[][] = [];
    for (let i = 0; i < rs.length; i += 6) chunks.push(rs.slice(i, i + 6));
    return chunks;
  }, [reelsData]);
  // random insertion points (after item N), stable per mount
  const insertAfter = useMemo(() => {
    const pts: number[] = [];
    let pos = 6 + Math.floor(Math.random() * 5);      // first reels row after ~6-10 videos
    for (let k = 0; k < 12; k++) { pts.push(pos); pos += 8 + Math.floor(Math.random() * 24); } // random gaps
    return pts;
  }, []);

  const grid: React.ReactNode[] = [];
  let chunkIdx = 0;
  items.forEach((item, i) => {
    grid.push(<ContentCard key={item.id} item={item} index={i} />);
    if (category === "" && insertAfter.includes(i + 1) && chunkIdx < reelChunks.length) {
      grid.push(<div key={`reels-${chunkIdx}`} className="col-span-full"><ShortsRow reels={reelChunks[chunkIdx]} /></div>);
      chunkIdx++;
    }
  });

  return (
    <>
      <div className="mb-6 mt-4 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-xl font-bold tracking-tight text-white">
          <Sparkles size={20} className="text-cyan" /> Curated for you
        </h2>
      </div>

      {isError && (
        <div className="rounded-xl border border-rose/20 bg-rose/5 p-6 text-sm text-white/70">
          Couldn&apos;t load the feed. Check that the API is running and
          NEXT_PUBLIC_API_URL points to it.
        </div>
      )}

      <div className="grid grid-cols-1 gap-x-4 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
        {grid}

        {(isLoading || isFetchingNextPage) &&
          Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={`sk-${i}`} className="aspect-video" />
          ))}
      </div>

      {!isLoading && !isError && items.length === 0 && (
        <div className="glass-panel mt-2 rounded-xl p-12 text-center">
          <p className="text-white/60">No content yet.</p>
          <p className="mt-1 text-sm text-white/40">
            Be the first — creators can publish from the Upload page.
          </p>
        </div>
      )}

      <div ref={sentinel} className="flex h-32 w-full items-center justify-center py-12">
        {isFetchingNextPage ? (
          <div className="flex items-center gap-2 text-sm font-medium text-white/40">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
            Decrypting signals…
          </div>
        ) : !hasNextPage && items.length > 0 ? (
          <p className="text-sm font-bold uppercase tracking-widest text-white/20">
            You&apos;ve reached the end
          </p>
        ) : null}
      </div>
    </>
  );
}
