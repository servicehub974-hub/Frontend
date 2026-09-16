"use client";

import { useEffect, useRef } from "react";
import { Sparkles } from "lucide-react";
import { useContentFeed } from "@/hooks/use-content-feed";
import { ContentCard } from "./content-card";
import { Skeleton } from "@/components/ui/badges";

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
        {items.map((item, i) => (
          <ContentCard key={item.id} item={item} index={i} />
        ))}

        {(isLoading || isFetchingNextPage) &&
          Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={`sk-${i}`} className="aspect-[4/5] sm:aspect-video" />
          ))}
      </div>

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
