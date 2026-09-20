"use client";

import { useQuery } from "@tanstack/react-query";
import { Heart } from "lucide-react";
import { useAuth } from "@/providers/auth-provider";
import { PageHeader, EmptyState } from "@/components/ui/empty-state";
import { apiGet } from "@/lib/api";
import { ContentCard } from "@/components/home/content-card";
import { Skeleton } from "@/components/ui/badges";
import type { ContentItem } from "@/lib/types";
import { PostCard, type Post } from "@/components/posts/post-card";

export default function LovedPage() {
  const { user, loading } = useAuth();
  const { data: posts } = useQuery({ queryKey: ["liked-posts"], queryFn: () => apiGet<Post[]>("/api/posts/liked"), enabled: !!user });
  const { data, isLoading } = useQuery({
    queryKey: ["liked"],
    queryFn: () => apiGet<ContentItem[]>("/api/content/liked"),
    enabled: !!user,
  });

  if (loading) return <div className="px-6 py-16 text-white/50">Loading…</div>;
  if (!user) return <div className="px-6 py-16 text-center text-white/60">Log in to see the videos you loved.</div>;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 md:px-8">
      <PageHeader icon={Heart} title="Loved" tint="text-rose" />
      {isLoading ? (
        <div className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="aspect-video" />)}
        </div>
      ) : !data || data.length === 0 ? (
        <EmptyState icon={Heart} title="Nothing loved yet" subtitle="Videos you like will show up here." />
      ) : (
        <div className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {data.map((item, i) => <ContentCard key={item.id} item={item} index={i} />)}
        </div>
      )}
      {posts && posts.length > 0 && (
        <div className="mt-10">
          <h2 className="mb-4 text-lg font-semibold text-white">Liked posts</h2>
          <div className="mx-auto flex max-w-2xl flex-col gap-4">
            {posts.map((p) => <PostCard key={p.id} post={p} />)}
          </div>
        </div>
      )}
    </div>
  );
}
