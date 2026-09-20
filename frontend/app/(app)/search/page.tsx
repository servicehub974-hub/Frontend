"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { SearchX, Search } from "lucide-react";
import { useState } from "react";
import { apiGet } from "@/lib/api";
import { ContentCard } from "@/components/home/content-card";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/badges";
import type { ContentItem } from "@/lib/types";
import { PostCard, type Post } from "@/components/posts/post-card";

interface Cat { id: string; name: string; slug: string; }

function Select({ value, onChange, children }: { value: string; onChange: (v: string) => void; children: React.ReactNode }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)}
      className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white outline-none focus:border-cyan/50">
      {children}
    </select>
  );
}

function SearchInner() {
  const sp = useSearchParams();
  const router = useRouter();
  const q = sp.get("q") ?? "";
  const type = sp.get("type") ?? "";
  const category = sp.get("category") ?? "";
  const free = sp.get("free") ?? "";
  const sort = sp.get("sort") ?? "relevance";

  const setParam = (k: string, v: string) => {
    const p = new URLSearchParams(sp.toString());
    if (v) p.set(k, v); else p.delete(k);
    router.replace(`/search?${p.toString()}`);
  };

  const { data: cats } = useQuery({ queryKey: ["categories"], queryFn: () => apiGet<Cat[]>("/api/categories") });
  const { data, isLoading } = useQuery({
    queryKey: ["search", q, type, category, free, sort],
    queryFn: () => apiGet<{ items: ContentItem[]; count: number; posts: Post[] }>(
      `/api/search?q=${encodeURIComponent(q)}&type=${type}&category=${category}&free=${free}&sort=${sort}`
    ),
    enabled: q.trim().length > 0,
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 md:px-8">
      <form
        onSubmit={(e) => { e.preventDefault(); const v = (e.currentTarget.elements.namedItem("mq") as HTMLInputElement).value; if (v.trim()) router.replace(`/search?q=${encodeURIComponent(v.trim())}`); }}
        className="mb-4 flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2.5 sm:hidden"
      >
        <Search size={16} className="text-white/40" />
        <input name="mq" defaultValue={q} placeholder="Search…" className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/30" />
      </form>
      <h1 className="mb-1 text-xl font-bold tracking-tight text-white">
        {q ? <>Results for “<span className="text-cyan">{q}</span>”</> : "Search"}
      </h1>
      {data && <p className="mb-5 text-sm text-white/40">{data.count} result{data.count === 1 ? "" : "s"}</p>}

      <div className="mb-6 flex flex-wrap gap-2">
        <Select value={type} onChange={(v) => setParam("type", v)}>
          <option value="">All types</option><option value="video">Videos</option>
          <option value="photo">Photos</option><option value="link">Links</option>
        </Select>
        <Select value={category} onChange={(v) => setParam("category", v)}>
          <option value="">All categories</option>
          {cats?.map((c) => <option key={c.id} value={c.slug}>{c.name}</option>)}
        </Select>
        <Select value={free} onChange={(v) => setParam("free", v)}>
          <option value="">Free & Premium</option><option value="free">Free</option><option value="premium">Premium</option>
        </Select>
        <Select value={sort} onChange={(v) => setParam("sort", v)}>
          <option value="relevance">Relevance</option><option value="newest">Newest</option>
          <option value="oldest">Oldest</option><option value="most_viewed">Most viewed</option>
          <option value="most_liked">Most liked</option><option value="most_discussed">Most discussed</option>
        </Select>
      </div>

      {!q.trim() ? (
        <EmptyState icon={SearchX} title="Search NEXUS" subtitle="Find videos, creators, tags and categories." />
      ) : isLoading ? (
        <div className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="aspect-video" />)}
        </div>
      ) : !data || data.items.length === 0 ? (
        <EmptyState icon={SearchX} title="No results" subtitle={`Nothing matched “${q}”. Try different words or fewer filters.`} />
      ) : (
        <div className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {data.items.map((item, i) => <ContentCard key={item.id} item={item} index={i} />)}
        </div>
      )}

      {data && data.posts && data.posts.length > 0 && (
        <div className="mt-10">
          <h2 className="mb-4 text-lg font-semibold text-white">Posts</h2>
          <div className="mx-auto flex max-w-2xl flex-col gap-4">
            {data.posts.map((p) => <PostCard key={p.id} post={p} />)}
          </div>
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="px-6 py-16 text-white/50">Loading…</div>}>
      <SearchInner />
    </Suspense>
  );
}
