"use client";

import { Fragment, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  ThumbsUp, ThumbsDown, Share2, Bookmark, Lock,
  ExternalLink, CheckCircle, MessageSquare,
} from "lucide-react";
import { api, apiGet } from "@/lib/api";
import { useAuth } from "@/providers/auth-provider";
import { fmtCount } from "@/lib/format";
import { useFeature } from "@/lib/use-features";
import { Comments } from "@/components/content/comments";
import { VideoPlayer } from "@/components/content/video-player";
import type { FeedPage } from "@/lib/types";

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
  is_disliked: boolean;
  follower_count: number;
  is_following: boolean;
  comment_count: number;
  is_saved: boolean;
}

function embedSrc(url: string): string | null {
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]{11})/);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
  if (url.includes("drive.google.com")) {
    const dr = url.match(/\/file\/d\/([^/]+)/) || url.match(/[?&]id=([^&]+)/);
    if (dr) return `https://drive.google.com/file/d/${dr[1]}/preview`;
  }
  if (url.includes("vimeo.com")) {
    const vm = url.match(/vimeo\.com\/(\d+)/);
    if (vm) return `https://player.vimeo.com/video/${vm[1]}`;
  }
  return null;
}

// Highlight URLs + #hashtags in the description
function renderRich(text: string) {
  const re = /(https?:\/\/[^\s]+)|(#[\w]+)/g;
  const nodes: React.ReactNode[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) nodes.push(<Fragment key={i++}>{text.slice(last, m.index)}</Fragment>);
    if (m[1])
      nodes.push(
        <a key={i++} href={m[1]} target="_blank" rel="noreferrer" className="text-cyan hover:underline">{m[1]}</a>
      );
    else nodes.push(<span key={i++} className="text-cyan">{m[2]}</span>);
    last = re.lastIndex;
  }
  nodes.push(<Fragment key={i++}>{text.slice(last)}</Fragment>);
  return nodes;
}

function Media({ d, onNext, related, onSelect }: { d: Detail; onNext?: () => void; related?: any[]; onSelect?: (id: string) => void }) {
  const cls = "aspect-video w-full bg-black sm:rounded-xl";
  if (!d.media_url) return <div className={`${cls} flex items-center justify-center text-white/40`}>No media</div>;
  if (d.content_type === "photo")
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={d.media_url} alt={d.title} className={`${cls} object-contain`} />;
  if (d.content_type === "link")
    return (
      <a href={d.media_url} target="_blank" rel="noreferrer" className={`${cls} flex items-center justify-center text-cyan hover:bg-white/5`}>
        <ExternalLink size={20} className="mr-2" /> Open external link
      </a>
    );
  const embed = embedSrc(d.media_url);
  if (embed) return <iframe src={embed} className={cls} allow="autoplay; fullscreen; encrypted-media" allowFullScreen title={d.title} />;
  return <VideoPlayer src={d.media_url} poster={d.thumbnail_url ?? undefined} onNext={onNext} related={related} onSelect={onSelect} />;
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
    queryKey: ["related-feed", currentId],
    queryFn: () => apiGet<FeedPage>("/api/content?limit=16"),
    refetchInterval: 30000, // realtime-ish
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
            {it.duration && <span className="absolute bottom-1 right-1 rounded bg-black/80 px-1 py-0.5 text-[10px] text-white">{it.duration}</span>}
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

export function WatchClient({ id }: { id: string }) {
  useEffect(() => {
    if (typeof window !== "undefined" && window.self !== window.top) {
      window.location.replace(`/embed/${id}`);
    }
  }, [id]);
  const { user } = useAuth();
  const router = useRouter();
  const messagesEnabled = useFeature("messages");

  const [liked, setLiked] = useState(false);
  const [disliked, setDisliked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [following, setFollowing] = useState(false);
  const [followers, setFollowers] = useState(0);
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const { data: d, isLoading, isError } = useQuery({
    queryKey: ["content", id, user?.id ?? "anon"],
    queryFn: () => apiGet<Detail>(`/api/content/${id}`),
    retry: false,
  });
  const { data: relatedData } = useQuery({
    queryKey: ["related-feed", id],
    queryFn: () => apiGet<FeedPage>("/api/content?limit=16"),
  });

  useEffect(() => {
    if (d) {
      setLiked(d.is_liked); setDisliked(d.is_disliked); setLikeCount(d.like_count);
      setFollowing(d.is_following); setFollowers(d.follower_count); setSaved(d.is_saved);
    }
  }, [d]);

  if (isLoading)
    return <div className="mx-auto max-w-[1800px] px-4 py-4"><div className="skeleton aspect-video w-full rounded-xl lg:max-w-[calc(100%-424px)]" /></div>;
  if (isError || !d)
    return (
      <div className="mx-auto flex max-w-md flex-col items-center px-4 py-24 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-white/10 bg-white/5 text-2xl">🔍</div>
        <h1 className="text-xl font-bold text-white">Content not found</h1>
        <p className="mt-1 text-sm text-white/50">It may have been removed or made private, or the API is still waking up — try again in a moment.</p>
        <div className="mt-6 flex gap-3">
          <button onClick={() => window.location.reload()} className="rounded-full bg-white/10 px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/15">Retry</button>
          <Link href="/" className="rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-black hover:bg-white/90">Back to feed</Link>
        </div>
      </div>
    );

  const locked = d.is_premium;
  const requireLogin = () => router.push("/login");

  const onLike = async () => {
    const wasLiked = liked, wasDisliked = disliked;
    setLiked(!wasLiked); setLikeCount((c) => (wasLiked ? c - 1 : c + 1)); if (wasDisliked) setDisliked(false);
    try {
      const r = await api<{ liked: boolean; like_count: number }>(`/api/content/${id}/like`, { method: "POST" });
      setLiked(r.liked); setLikeCount(r.like_count); if (r.liked) setDisliked(false);
    } catch (e) {
      setLiked(wasLiked); setDisliked(wasDisliked); setLikeCount(d.like_count);
      if ((e as { status?: number }).status === 401) requireLogin();
    }
  };

  const onDislike = async () => {
    const wasLiked = liked, wasDisliked = disliked;
    setDisliked(!wasDisliked); if (wasLiked) { setLiked(false); setLikeCount((c) => c - 1); }
    try {
      const r = await api<{ disliked: boolean; like_count: number }>(`/api/content/${id}/dislike`, { method: "POST" });
      setDisliked(r.disliked); setLikeCount(r.like_count); if (r.disliked) setLiked(false);
    } catch (e) {
      setLiked(wasLiked); setDisliked(wasDisliked); setLikeCount(d.like_count);
      if ((e as { status?: number }).status === 401) requireLogin();
    }
  };

  const onFollow = async () => {
    if (!user) return requireLogin();
    const was = following;
    setFollowing(!was); setFollowers((n) => (was ? n - 1 : n + 1));
    try {
      const r = await api<{ following: boolean; follower_count: number }>(`/api/users/${d.creator_id}/follow`, { method: "POST" });
      setFollowing(r.following); setFollowers(r.follower_count);
    } catch { setFollowing(was); setFollowers(d.follower_count); }
  };

  const share = async () => {
    try { await navigator.clipboard.writeText(window.location.href); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch { /* ignore */ }
  };

  const onSave = async () => {
    if (!user) return requireLogin();
    const was = saved; setSaved(!was);
    try { const r = await api<{ saved: boolean }>(`/api/content/${id}/save`, { method: "POST" }); setSaved(r.saved); }
    catch { setSaved(was); }
  };

  const startChat = async () => {
    if (!user) return requireLogin();
    try {
      const r = await api<{ id: string }>("/api/conversations", { method: "POST", json: { user_id: d.creator_id } });
      router.push(`/messages?c=${r.id}`);
    } catch { /* ignore */ }
  };

  const isOwner = user?.id === d.creator_id || user?.role === "admin";
  const relatedItems = (relatedData?.items ?? []).filter((i) => i.id !== id);
  const goSelect = (rid: string) => router.push(`/content/${rid}`);
  const goNext = relatedItems[0] ? () => router.push(`/content/${relatedItems[0].id}`) : undefined;

  const onDelete = async () => {
    if (!confirm("Delete this content permanently?")) return;
    try { await api(`/api/content/${id}`, { method: "DELETE" }); router.push("/"); } catch { /* ignore */ }
  };

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
          <Media d={d} onNext={goNext} related={relatedItems} onSelect={goSelect} />
        )}

        <div className="px-4 sm:px-0">
          <h1 className="mt-3 text-lg font-bold leading-snug tracking-tight text-white sm:text-xl">{d.title}</h1>

          {isOwner && (
            <div className="mt-2 flex gap-2">
              <Link href={`/content/${id}/edit`} className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-medium text-white hover:bg-white/15">Edit</Link>
              <button onClick={onDelete} className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-medium text-rose hover:bg-white/15">Delete</button>
            </div>
          )}

          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <Link href={`/channel/${d.creator_id}`} className="flex items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={d.creator.avatar} alt={d.creator.name} className="h-10 w-10 rounded-full border border-white/15 object-cover" />
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-white hover:text-white">{d.creator.name}</span>
                    {d.creator.verified && <CheckCircle size={14} className="text-cyan" />}
                  </div>
                  <span className="text-xs text-white/40">{fmtCount(followers)} followers</span>
                </div>
              </Link>
              {!isOwner && (
                <button onClick={onFollow}
                  className={`ml-2 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                    following ? "bg-white/10 text-white" : "bg-white text-black hover:bg-white/90"
                  }`}>
                  {following ? "Following" : "Follow"}
                </button>
              )}
              {!isOwner && messagesEnabled && (
                <button onClick={startChat} className="ml-1 flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/15">
                  <MessageSquare size={16} /> Message
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar">
              <div className="flex shrink-0 items-center rounded-full bg-white/10">
                <button onClick={onLike} className="flex items-center gap-2 rounded-l-full px-4 py-2 text-sm font-medium text-white hover:bg-white/15">
                  <ThumbsUp size={16} className={liked ? "fill-white" : ""} /> {fmtCount(likeCount)}
                </button>
                <div className="h-5 w-px bg-white/15" />
                <button onClick={onDislike} className="rounded-r-full px-4 py-2 text-white hover:bg-white/15">
                  <ThumbsDown size={16} className={disliked ? "fill-white" : ""} />
                </button>
              </div>
              <ActionPill onClick={share}><Share2 size={16} /> {copied ? "Copied!" : "Share"}</ActionPill>
              <ActionPill onClick={onSave}><Bookmark size={16} className={saved ? "fill-white" : ""} /> {saved ? "Saved" : "Save"}</ActionPill>
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
                <p className={`mt-2 whitespace-pre-wrap leading-relaxed text-white/70 ${expanded ? "" : "line-clamp-2"}`}>
                  {renderRich(d.description)}
                </p>
                <button onClick={() => setExpanded((v) => !v)} className="mt-1 text-xs font-medium text-white/50 hover:text-white">
                  {expanded ? "Show less" : "Show more"}
                </button>
              </>
            )}
            {d.tags.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {d.tags.map((t) => (<span key={t} className="rounded-full bg-white/5 px-2.5 py-1 text-xs text-cyan">#{t}</span>))}
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
