"use client";

import { useQuery } from "@tanstack/react-query";
import { Heart } from "lucide-react";
import { useAuth } from "@/providers/auth-provider";
import { apiGet } from "@/lib/api";
import { ContentCard } from "@/components/home/content-card";
import { Skeleton } from "@/components/ui/badges";
import type { ContentItem } from "@/lib/types";

export default function LovedPage() {
  const { user, loading } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ["liked"],
    queryFn: () => apiGet<ContentItem[]>("/api/content/liked"),
    enabled: !!user,
  });

  if (loading) return <div className="px-6 py-16 text-white/50">Loading…</div>;
  if (!user) return <div className="px-6 py-16 text-center text-white/60">Log in to see the videos you loved.</div>;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 md:px-8">
      <div className="mb-6 flex items-center gap-3">
        <Heart size={24} className="text-rose" />
        <h1 className="text-2xl font-bold tracking-tight text-white">Loved</h1>
      </div>
      {isLoading ? (
        <div className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="aspect-video" />)}
        </div>
      ) : !data || data.length === 0 ? (
        <p className="text-sm text-white/40">You haven&apos;t liked anything yet.</p>
      ) : (
        <div className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {data.map((item, i) => <ContentCard key={item.id} item={item} index={i} />)}
        </div>
      )}
    </div>
  );
}
