"use client";

import { useEffect, useRef } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Rss } from "lucide-react";
import { apiGet } from "@/lib/api";
import { PageHeader } from "@/components/ui/empty-state";
import { CreatePost } from "@/components/posts/create-post";
import { PostCard, type Post } from "@/components/posts/post-card";

interface Page { items: Post[]; next_offset: number | null; }

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

  const posts = data?.pages.flatMap((p) => p.items) ?? [];

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6">
      <PageHeader icon={Rss} title="Feed" />
      <CreatePost />
      <div className="mt-4 flex flex-col gap-4">
        {isLoading ? (
          <p className="py-10 text-center text-sm text-white/40">Loading…</p>
        ) : posts.length === 0 ? (
          <p className="py-10 text-center text-sm text-white/40">No posts yet. Share the first one!</p>
        ) : (
          posts.map((p) => <PostCard key={p.id} post={p} />)
        )}
      </div>
      <div ref={sentinel} className="h-10" />
      {isFetchingNextPage && <p className="py-4 text-center text-sm text-white/40">Loading more…</p>}
    </div>
  );
}
