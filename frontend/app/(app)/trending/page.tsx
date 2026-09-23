"use client";

import { useQuery } from "@tanstack/react-query";
import { Flame } from "lucide-react";
import { apiGet } from "@/lib/api";
import { ContentCard } from "@/components/home/content-card";
import { PageHeader, EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/badges";
import type { ContentItem } from "@/lib/types";

export default function TrendingPage() {
  const { data, isLoading } = useQuery({ queryKey: ["trending"], queryFn: () => apiGet<ContentItem[]>("/api/content/trending") });

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 md:px-8">
      <PageHeader icon={Flame} title="Trending" tint="text-rose" />
      {isLoading ? (
        <div className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="aspect-video" />)}
        </div>
      ) : !data || data.length === 0 ? (
        <EmptyState icon={Flame} title="Nothing trending yet" subtitle="Popular videos will show up here as they gain views, likes and comments." />
      ) : (
        <div className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {data.map((item, i) => <ContentCard key={item.id} item={item} index={i} />)}
        </div>
      )}
    </div>
  );
}
