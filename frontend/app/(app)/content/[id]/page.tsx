"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  ThumbsUp, ThumbsDown, Share2, Bookmark, Download, Lock,
  ExternalLink, CheckCircle,
} from "lucide-react";
import { api, apiGet } from "@/lib/api";
import { useAuth } from "@/providers/auth-provider";
import type { FeedPage } from "@/lib/types";
import { Comments } from "@/components/content/comments";

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
  creator_id: string;
  category: { name: string; slug: string } | null;
  tags: string[];
  like_count: number;
  is_liked: boolean;
  follower_count: number;
  is_following: boolean;
  comment_count: number;
}

function youtubeEmbed(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]{11})/);
  return m ? `https://www.youtube.com/embed/${m[1]}` : null;
}

function Media({ d }: { d: Detail }) {
  const cls = "aspect-video w-full bg-black sm:rounded-xl";
  if (!d.media_url)
    return <div className={`${cls} flex items-center justify-center text-white/40`}>No media</div>;
  if (d.content_type === "photo")
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={d.media_url} alt={d.title} className={`${cls} object-contain`} />;
  if (d.content_type === "link")
    return (
      <a href={d.media_url} target="_blank" rel="noreferrer"
        className={`${cls} flex items-center justify-center text-cyan hover:bg-white/5`}>
        <ExternalLink size={20} className="mr-2" /> Open external link
      </a>
    );
  const yt = youtubeEmbed(d.media_url);
  if (yt) return <iframe src={yt} className={cls} allowFullScreen title={d.title} />;
  // eslint-disable-next-line jsx-a11y/media-has-caption
  return <video src={d.media_url} controls poster={d.thumbnail_url ?? undefined} className={cls} />;
}

function ActionPill({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) {
  return (
    <button onClick={onClick}
      className="flex shrink-0 items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/15">
      {children}
    </button>
  );
}

function RelatedList({ currentId }: { currentId: string }) {
  const { data } = useQuery({
    queryKey: ["content-feed", ""],
    queryFn: () => apiGet<FeedPage>("/api/content?limit=16"),
  });
  const items = (data?.items ?? []).filter((i) => i.id !== currentId);
  if (items.length === 0) return <p className="text-sm text-white/40">No related content yet.</p>;
  return (
    <div className="flex flex-col gap-2">
      {items.map((it) => (
        <Link key={it.id} href={`/content/${it.id}`} className="group flex gap-2">
          <div className="relative aspect-video w-40 shrink-0 overflow-hidden rounded-lg bg-elevated sm:w-44">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={it.thumbnail} alt={it.title} className="h-full w-full object-cover" />
            {it.duration && (
              <span className="absolute bottom-1 right-1 rounded bg-black/80 px-1 py-0.5 text-[10px] text-white">{it.duration}</span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="line-clamp-2 text-sm font-medium leading-snug text-white">{it.title}</h3>
            <p className="mt-1 truncate text-xs text-white/50">{it.creator.name}</p>
            <p className="truncate text-xs text-white/40">{it.views} views · {it.time_ago}</p>
          </div>
        </Link>
      ))}
    </div>
  );
}

export default function ContentDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const { user } = useAuth();
  const router = useRouter();

  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [following, setFollowing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const { data: d, isLoading, isError } = useQuery({
    queryKey: ["content", id, user?.id ?? "anon"],
    queryFn: () => apiGet<Detail>(`/api/content/${id}`),
    retry: false,
  });

  useEffect(() => {
    if (d) {
      setLiked(d.is_liked);
      setLikeCount(d.like_count);
      setFollowing(d.is_following);
    }
  }, [d]);

  if (isLoading)
    return <div className="mx-auto max-w-[1800px] px-4 py-4"><div className="skeleton aspect-video w-full rounded-xl lg:max-w-[calc(100%-424px)]" /></div>;
  if (isError || !d)
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-white">Content not found</h1>
        <Link href="/" className="mt-6 inline-block rounded-full bg-white px-6 py-2.5 font-semibold text-black">Back to feed</Link>
      </div>
    );

  const locked = d.is_premium;

  const requireLogin = () => { router.push("/login"); };

  const onLike = async () => {
    if (!user) return requireLogin();
    // optimistic
    setLiked((v) => !v);
    setLikeCount((c) => (liked ? c - 1 : c + 1));
    try {
      const r = await api<{ liked: boolean; like_count: number }>(`/api/content/${id}/like`, { method: "POST" });
      setLiked(r.liked); setLikeCount(r.like_count);
    } catch { setLiked(d.is_liked); setLikeCount(d.like_count); }
  };

  const onFollow = async () => {
    if (!user) return requireLogin();
    setFollowing((v) => !v);
    try {
      const r = await api<{ following: boolean; follower_count: number }>(`/api/users/${d.creator_id}/follow`, { method: "POST" });
      setFollowing(r.following);
    } catch { setFollowing(d.is_following); }
  };

  const share = async () => {
    try { await navigator.clipboard.writeText(window.location.href); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch { /* ignore */ }
  };

  const isOwner = user?.id === d.creator_id;

  return (
    <div className="mx-auto max-w-[1800px] px-0 py-0 sm:px-4 sm:py-4 lg:flex lg:gap-6">
      <div className="min-w-0 lg:flex-1">
        {locked ? (
          <div className="relative flex aspect-video w-full items-center justify-center overflow-hidden border border-fuchsia/20 bg-elevated sm:rounded-xl">
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

        <div className="px-4 sm:px-0">
          <h1 className="mt-3 text-lg font-bold leading-snug tracking-tight text-white sm:text-xl">{d.title}</h1>

          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={d.creator.avatar} alt={d.creator.name} className="h-10 w-10 rounded-full border border-white/15 object-cover" />
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-white">{d.creator.name}</span>
                  {d.creator.verified && <CheckCircle size={14} className="text-cyan" />}
                </div>
                <span className="text-xs text-white/40">{d.follower_count} followers</span>
              </div>
              {!isOwner && (
                <button onClick={onFollow}
                  className={`ml-2 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                    following ? "bg-white/10 text-white" : "bg-white text-black hover:bg-white/90"
                  }`}>
                  {following ? "Following" : "Follow"}
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar">
              <div className="flex shrink-0 items-center rounded-full bg-white/10">
                <button onClick={onLike} className="flex items-center gap-2 rounded-l-full px-4 py-2 text-sm font-medium text-white hover:bg-white/15">
                  <ThumbsUp size={16} className={liked ? "fill-white" : ""} /> {likeCount}
                </button>
                <div className="h-5 w-px bg-white/15" />
                <button className="rounded-r-full px-4 py-2 text-white hover:bg-white/15"><ThumbsDown size={16} /></button>
              </div>
              <ActionPill onClick={share}><Share2 size={16} /> {copied ? "Copied!" : "Share"}</ActionPill>
              <ActionPill><Bookmark size={16} /> Save</ActionPill>
              <ActionPill><Download size={16} /> Download</ActionPill>
            </div>
          </div>

          <div className="mt-4 rounded-xl bg-white/5 p-3 text-sm">
            <div className="font-medium text-white/80">
              {d.views_display} views · {d.time_ago}
              {d.category && (
                <Link href={`/?category=${d.category.slug}`} className="ml-2 text-cyan hover:underline">#{d.category.name}</Link>
              )}
            </div>
            {d.description && (
              <>
                <p className={`mt-2 whitespace-pre-wrap leading-relaxed text-white/70 ${expanded ? "" : "line-clamp-2"}`}>{d.description}</p>
                <button onClick={() => setExpanded((v) => !v)} className="mt-1 text-xs font-medium text-white/50 hover:text-white">
                  {expanded ? "Show less" : "Show more"}
                </button>
              </>
            )}
            {d.tags.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {d.tags.map((t) => (<span key={t} className="rounded-full bg-white/5 px-2.5 py-1 text-xs text-white/50">#{t}</span>))}
              </div>
            )}
          </div>

          <Comments contentId={d.id} ownerId={d.creator_id} count={d.comment_count} />
        </div>
      </div>

      <aside className="mt-6 px-4 sm:px-0 lg:mt-0 lg:w-[400px] lg:shrink-0">
        <h2 className="mb-3 text-sm font-semibold text-white/60">Up next</h2>
        <RelatedList currentId={d.id} />
      </aside>
    </div>
  );
}
