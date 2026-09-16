"use client";

import { use } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Eye, Clock, Lock, ExternalLink, CheckCircle } from "lucide-react";
import { apiGet } from "@/lib/api";
import { TierBadge } from "@/components/ui/badges";
import { Button } from "@/components/ui/button";

interface Detail {
  id: string;
  title: string;
  description: string | null;
  content_type: string;
  media_url: string | null;
  thumbnail_url: string | null;
  duration: string | null;
  is_premium: boolean;
  price_gems: number | null;
  tier: string;
  views_display: string;
  time_ago: string;
  creator: { name: string; avatar: string; verified: boolean };
  category: { name: string; slug: string } | null;
  tags: string[];
}

function youtubeEmbed(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]{11})/);
  return m ? `https://www.youtube.com/embed/${m[1]}` : null;
}

function Media({ d }: { d: Detail }) {
  if (!d.media_url) {
    return <div className="flex aspect-video items-center justify-center rounded-xl bg-elevated text-white/40">No media</div>;
  }
  if (d.content_type === "photo") {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={d.media_url} alt={d.title} className="w-full rounded-xl object-contain" />;
  }
  if (d.content_type === "link") {
    return (
      <a href={d.media_url} target="_blank" rel="noreferrer"
        className="flex aspect-video items-center justify-center rounded-xl border border-white/10 bg-elevated text-cyan hover:bg-white/5">
        <ExternalLink size={20} className="mr-2" /> Open external link
      </a>
    );
  }
  // video
  const yt = youtubeEmbed(d.media_url);
  if (yt) {
    return <iframe src={yt} className="aspect-video w-full rounded-xl" allowFullScreen title={d.title} />;
  }
  return (
    // eslint-disable-next-line jsx-a11y/media-has-caption
    <video src={d.media_url} controls poster={d.thumbnail_url ?? undefined} className="aspect-video w-full rounded-xl bg-black" />
  );
}

export default function ContentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: d, isLoading, isError } = useQuery({
    queryKey: ["content", id],
    queryFn: () => apiGet<Detail>(`/api/content/${id}`),
    retry: false,
  });

  if (isLoading) {
    return <div className="mx-auto max-w-4xl px-4 py-8"><div className="skeleton aspect-video rounded-xl" /></div>;
  }
  if (isError || !d) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-white">Content not found</h1>
        <Link href="/"><Button className="mt-6">Back to feed</Button></Link>
      </div>
    );
  }

  const locked = d.is_premium; // gem unlock lands in Phase 7

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
      {locked ? (
        <div className="relative flex aspect-video items-center justify-center overflow-hidden rounded-xl border border-fuchsia/20 bg-elevated">
          {d.thumbnail_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={d.thumbnail_url} alt={d.title} className="absolute inset-0 h-full w-full object-cover opacity-30" />
          )}
          <div className="relative z-10 text-center">
            <Lock size={28} className="mx-auto mb-3 text-fuchsia" />
            <p className="font-semibold text-white">Premium content</p>
            <p className="mt-1 text-sm text-white/50">Unlock for {d.price_gems} gems (coming soon)</p>
          </div>
        </div>
      ) : (
        <Media d={d} />
      )}

      <div className="mt-5 flex items-start justify-between gap-4">
        <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl">{d.title}</h1>
        <TierBadge tier={d.tier as "free" | "gems" | "vip"} priceGems={d.price_gems} />
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-white/50">
        <span className="flex items-center gap-1.5"><Eye size={14} /> {d.views_display} views</span>
        <span className="flex items-center gap-1.5"><Clock size={14} /> {d.time_ago}</span>
        {d.category && (
          <Link href={`/?category=${d.category.slug}`} className="rounded-full bg-white/5 px-3 py-1 text-white/70 hover:bg-white/10">
            {d.category.name}
          </Link>
        )}
      </div>

      <div className="mt-4 flex items-center gap-3 border-y border-white/5 py-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={d.creator.avatar} alt={d.creator.name} className="h-10 w-10 rounded-full border border-white/15 object-cover" />
        <div className="flex items-center gap-1.5">
          <span className="font-semibold text-white">{d.creator.name}</span>
          {d.creator.verified && <CheckCircle size={14} className="text-cyan" />}
        </div>
      </div>

      {d.description && (
        <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-white/70">{d.description}</p>
      )}

      {d.tags.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {d.tags.map((t) => (
            <span key={t} className="rounded-full bg-white/5 px-3 py-1 text-xs text-white/50">#{t}</span>
          ))}
        </div>
      )}
    </div>
  );
}
