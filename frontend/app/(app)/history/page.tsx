"use client";

import { useQuery } from "@tanstack/react-query";
import { Clock } from "lucide-react";
import { useAuth } from "@/providers/auth-provider";
import { PageHeader, EmptyState } from "@/components/ui/empty-state";
import { apiGet } from "@/lib/api";
import { ContentCard } from "@/components/home/content-card";
import { Skeleton } from "@/components/ui/badges";
import type { ContentItem } from "@/lib/types";

export default function HistoryPage() {
  const { user, loading } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ["history"],
    queryFn: () => apiGet<ContentItem[]>("/api/content/history"),
    enabled: !!user,
  });

  if (loading) return <div className="px-6 py-16 text-white/50">Loading…</div>;
  if (!user)
    return <div className="px-6 py-16 text-center text-white/60">Log in to see your watch history.</div>;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 md:px-8">
      <PageHeader icon={Clock} title="Timeline" />
      {isLoading ? (
        <div className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="aspect-video" />)}
        </div>
      ) : !data || data.length === 0 ? (
        <EmptyState icon={Clock} title="Nothing watched yet" subtitle="Videos you watch will appear here." />
      ) : (
        <div className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {data.map((item, i) => <ContentCard key={item.id} item={item} index={i} />)}
        </div>
      )}
    </div>
  );
}
