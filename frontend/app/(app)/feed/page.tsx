"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Rss, CheckCircle } from "lucide-react";
import { apiGet } from "@/lib/api";
import { PageHeader } from "@/components/ui/empty-state";
import { CreatePost } from "@/components/posts/create-post";
import { PostCard, type Post } from "@/components/posts/post-card";
import type { ContentItem } from "@/lib/types";

type FeedItem = { type: "post"; post: Post } | { type: "video"; video: ContentItem };
interface Page { items: FeedItem[]; next_offset: number | null; }

function FeedVideoCard({ v }: { v: ContentItem }) {
  return (
    <Link href={`/content/${v.id}`} className="glass-panel flex gap-3 rounded-2xl p-3 transition-colors hover:bg-white/[0.05]">
      <div className="relative aspect-video w-40 shrink-0 overflow-hidden rounded-lg bg-elevated sm:w-52">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={v.thumbnail} alt="" className="h-full w-full object-cover" />
        {v.duration && <span className="absolute bottom-1 right-1 rounded bg-black/80 px-1 text-[10px] text-white">{v.duration}</span>}
      </div>
      <div className="min-w-0 flex-1">
        <span className="mb-1 inline-block rounded bg-cyan/15 px-1.5 py-0.5 text-[10px] font-medium text-cyan">Video</span>
        <h3 className="line-clamp-2 text-sm font-semibold text-white">{v.title}</h3>
        <p className="mt-1 flex items-center gap-1 text-xs text-white/50">{v.creator.name} {v.creator.verified && <CheckCircle size={11} />}</p>
        <p className="text-xs text-white/40">{v.views} • {v.time_ago}</p>
      </div>
    </Link>
  );
}

export default function FeedPage() {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useInfiniteQuery({
    queryKey: ["feed"],
    queryFn: ({ pageParam }) => apiGet<Page>(`/api/feed?offset=${pageParam}`),
    initialPageParam: 0,
    getNextPageParam: (last) => last.next_offset ?? undefined,
    staleTime: 0,
  });

  const sentinel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = sentinel.current; if (!el) return;
    const io = new IntersectionObserver((e) => { if (e[0].isIntersecting && hasNextPage && !isFetchingNextPage) fetchNextPage(); });
    io.observe(el); return () => io.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const items = data?.pages.flatMap((p) => p.items) ?? [];

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6">
      <PageHeader icon={Rss} title="Feed" />
      <CreatePost />
      <div className="mt-4 flex flex-col gap-4">
        {isLoading ? (
          <p className="py-10 text-center text-sm text-white/40">Loading…</p>
        ) : items.length === 0 ? (
          <p className="py-10 text-center text-sm text-white/40">Nothing here yet. Share the first post!</p>
        ) : (
          items.map((it, i) => it.type === "post"
            ? <PostCard key={`p-${it.post.id}`} post={it.post} />
            : <FeedVideoCard key={`v-${it.video.id}-${i}`} v={it.video} />)
        )}
      </div>
      <div ref={sentinel} className="h-10" />
      {isFetchingNextPage && <p className="py-4 text-center text-sm text-white/40">Loading more…</p>}
    </div>
  );
}
