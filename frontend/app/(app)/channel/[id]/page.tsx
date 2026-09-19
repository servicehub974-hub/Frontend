"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle, X, Share2, Flag, Users, Video, Eye, Calendar, Globe, Settings, MessageSquare } from "lucide-react";
import { api, apiGet } from "@/lib/api";
import { useAuth } from "@/providers/auth-provider";
import { fmtCount } from "@/lib/format";
import { useFeature } from "@/lib/use-features";
import { ContentCard } from "@/components/home/content-card";
import { Skeleton } from "@/components/ui/badges";
import type { ContentItem } from "@/lib/types";

interface LinkT { label: string; url: string; }
interface PublicProfile {
  id: string; username: string | null; display_name: string | null;
  avatar_url: string | null; cover_url: string | null; bio: string | null;
  role: string; website: string | null; location: string | null; links: LinkT[];
  follower_count: number; content_count: number; total_views: number;
  joined: string | null; is_following: boolean;
}

type Tab = "videos" | "shorts" | "photos" | "playlists" | "about";

function joinedText(iso: string | null) {
  if (!iso) return "";
  try { return "Joined " + new Date(iso).toLocaleDateString("en", { month: "short", day: "numeric", year: "numeric" }); }
  catch { return ""; }
}

export default function ChannelPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const { user } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("videos");
  const [showAbout, setShowAbout] = useState(false);
  const messagesEnabled = useFeature("messages");

  const { data: p, isLoading } = useQuery({
    queryKey: ["channel", id, user?.id ?? "anon"],
    queryFn: () => apiGet<PublicProfile>(`/api/users/${id}`),
    retry: false,
  });
  const { data: content } = useQuery({
    queryKey: ["channel-content", id, tab],
    queryFn: () => apiGet<ContentItem[]>(`/api/users/${id}/content?kind=${tab}`),
    enabled: tab !== "about" && tab !== "playlists",
  });
  const { data: playlists } = useQuery({
    queryKey: ["channel-playlists", id],
    queryFn: () => apiGet<{ id: string; title: string; visibility: string; item_count: number; thumbnail: string | null }[]>(`/api/users/${id}/playlists`),
    enabled: tab === "playlists",
  });

  const [following, setFollowing] = useState(false);
  const [followers, setFollowers] = useState(0);
  useEffect(() => { if (p) { setFollowing(p.is_following); setFollowers(p.follower_count); } }, [p]);

  if (isLoading) return <div className="mx-auto max-w-6xl px-4 py-8"><Skeleton className="h-40 rounded-2xl" /></div>;
  if (!p) return <div className="px-6 py-16 text-center text-white/60">Channel not found.</div>;

  const isMe = user?.id === p.id;
  const verified = p.role === "creator" || p.role === "admin";

  const follow = async () => {
    if (!user) return router.push("/login");
    setFollowing((v) => !v); setFollowers((n) => (following ? n - 1 : n + 1));
    try {
      const r = await api<{ following: boolean; follower_count: number }>(`/api/users/${p.id}/follow`, { method: "POST" });
      setFollowing(r.following); setFollowers(r.follower_count);
    } catch { setFollowing(p.is_following); setFollowers(p.follower_count); }
  };
  const shareChannel = () => { navigator.clipboard?.writeText(window.location.href).catch(() => {}); };
  const startChat = async () => {
    if (!user) return router.push("/login");
    try {
      const r = await api<{ id: string }>("/api/conversations", { method: "POST", json: { user_id: p.id } });
      router.push(`/messages?c=${r.id}`);
    } catch { /* ignore */ }
  };

  const tabs: Tab[] = ["videos", "shorts", "photos", "playlists", "about"];

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
      {/* Banner (adjustable like YouTube via object-cover) */}
      <div className="relative mb-2 h-32 w-full overflow-hidden rounded-2xl bg-gradient-to-r from-violet-900/40 to-cyan-900/30 sm:h-48">
        {p.cover_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={p.cover_url} alt="" className="h-full w-full object-cover" />
        )}
      </div>

      {/* Header */}
      <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-start">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={p.avatar_url ?? `https://i.pravatar.cc/150?u=${p.username ?? p.id}`}
          alt="" className="h-24 w-24 rounded-full border-2 border-black object-cover sm:h-32 sm:w-32" />
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">{p.display_name ?? p.username}</h1>
            {verified && <CheckCircle size={18} className="text-cyan" />}
          </div>
          <p className="mt-1 text-sm text-white/50">
            @{p.username} · {fmtCount(followers)} followers · {fmtCount(p.content_count)} posts
          </p>
          {p.bio && (
            <button onClick={() => setShowAbout(true)} className="mt-1 line-clamp-1 max-w-xl text-left text-sm text-white/60 hover:text-white/80">
              {p.bio} <span className="font-medium text-white/80">…more</span>
            </button>
          )}
          <div className="mt-3 flex flex-wrap gap-2">
            {isMe ? (
              <Link href="/channel/edit" className="flex items-center gap-2 rounded-full bg-white/10 px-5 py-2 text-sm font-semibold text-white hover:bg-white/15">
                <Settings size={16} /> Customize channel
              </Link>
            ) : (
              <button onClick={follow}
                className={`rounded-full px-6 py-2 text-sm font-semibold transition-colors ${following ? "bg-white/10 text-white" : "bg-white text-black hover:bg-white/90"}`}>
                {following ? "Following" : "Follow"}
              </button>
            )}
            {!isMe && messagesEnabled && (
              <button onClick={startChat} className="flex items-center gap-2 rounded-full bg-white/10 px-5 py-2 text-sm font-semibold text-white hover:bg-white/15">
                <MessageSquare size={16} /> Message
              </button>
            )}
            <button onClick={shareChannel} className="rounded-full bg-white/10 px-5 py-2 text-sm font-semibold text-white hover:bg-white/15">Share</button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-6 flex gap-6 border-b border-white/10">
        {tabs.map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`-mb-px border-b-2 pb-3 text-sm font-medium capitalize transition-colors ${
              tab === t ? "border-white text-white" : "border-transparent text-white/50 hover:text-white"
            }`}>
            {t}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="mt-6 min-h-[45vh]">
        {tab === "playlists" ? (
          !playlists || playlists.length === 0 ? (
            <p className="text-sm text-white/40">No public playlists yet.</p>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {playlists.map((pl) => (
                <Link key={pl.id} href={`/playlist/${pl.id}`} className="group">
                  <div className="relative aspect-video overflow-hidden rounded-xl bg-elevated">
                    {pl.thumbnail && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={pl.thumbnail} alt="" className="h-full w-full object-cover transition-transform group-hover:scale-105" />
                    )}
                    <div className="absolute bottom-0 right-0 bg-black/70 px-2 py-1 text-[11px] text-white">{pl.item_count} videos</div>
                  </div>
                  <h3 className="mt-1.5 line-clamp-1 text-sm font-medium text-white">{pl.title}</h3>
                </Link>
              ))}
            </div>
          )
        ) : tab === "about" ? (
          <div className="max-w-2xl">
            <h2 className="mb-2 font-semibold text-white">Description</h2>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-white/70">{p.bio || "No description."}</p>
            {p.links.length > 0 && (
              <>
                <h2 className="mb-2 mt-6 font-semibold text-white">Links</h2>
                <div className="flex flex-col gap-2">
                  {p.links.map((l, i) => (
                    <a key={i} href={l.url} target="_blank" rel="noreferrer" className="text-sm text-cyan hover:underline">{l.label || l.url}</a>
                  ))}
                </div>
              </>
            )}
            <h2 className="mb-2 mt-6 font-semibold text-white">Stats</h2>
            <div className="flex flex-col gap-2 text-sm text-white/60">
              <span className="flex items-center gap-2"><Calendar size={15} /> {joinedText(p.joined)}</span>
              <span className="flex items-center gap-2"><Users size={15} /> {fmtCount(followers)} followers</span>
              <span className="flex items-center gap-2"><Video size={15} /> {fmtCount(p.content_count)} posts</span>
              <span className="flex items-center gap-2"><Eye size={15} /> {p.total_views.toLocaleString()} total views</span>
              {p.location && <span className="flex items-center gap-2"><Globe size={15} /> {p.location}</span>}
            </div>
          </div>
        ) : !content || content.length === 0 ? (
          <p className="text-sm text-white/40">No {tab} yet.</p>
        ) : tab === "shorts" ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6">
            {content.map((item) => (
              <Link key={item.id} href={`/content/${item.id}`} className="group">
                <div className="relative aspect-[9/16] overflow-hidden rounded-xl bg-elevated">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={item.thumbnail} alt={item.title} className="h-full w-full object-cover transition-transform group-hover:scale-105" />
                </div>
                <p className="mt-1.5 line-clamp-2 text-xs font-medium text-white">{item.title}</p>
                <p className="text-[11px] text-white/40">{item.views} views</p>
              </Link>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {content.map((item, i) => <ContentCard key={item.id} item={item} index={i} />)}
          </div>
        )}
      </div>

      {/* About modal */}
      {showAbout && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4" onClick={() => setShowAbout(false)}>
          <div className="absolute inset-0 bg-black/70" />
          <div className="relative z-10 max-h-[85vh] w-full max-w-md overflow-y-auto glass-panel rounded-2xl p-6 hide-scrollbar" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">{p.display_name ?? p.username}</h2>
              <button onClick={() => setShowAbout(false)} className="text-white/50 hover:text-white"><X size={20} /></button>
            </div>
            <h3 className="mb-1 text-sm font-semibold text-white">Description</h3>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-white/70">{p.bio || "No description."}</p>
            {p.links.length > 0 && (
              <>
                <h3 className="mb-1 mt-5 text-sm font-semibold text-white">Links</h3>
                <div className="flex flex-col gap-1.5">
                  {p.links.map((l, i) => (
                    <a key={i} href={l.url} target="_blank" rel="noreferrer" className="text-sm text-cyan hover:underline">{l.label || l.url}</a>
                  ))}
                </div>
              </>
            )}
            <h3 className="mb-1 mt-5 text-sm font-semibold text-white">More info</h3>
            <div className="flex flex-col gap-2 text-sm text-white/60">
              <span className="flex items-center gap-2"><Calendar size={15} /> {joinedText(p.joined)}</span>
              <span className="flex items-center gap-2"><Users size={15} /> {fmtCount(followers)} followers</span>
              <span className="flex items-center gap-2"><Video size={15} /> {fmtCount(p.content_count)} posts</span>
              <span className="flex items-center gap-2"><Eye size={15} /> {p.total_views.toLocaleString()} total views</span>
            </div>
            <div className="mt-5 flex gap-2">
              <button onClick={shareChannel} className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm text-white hover:bg-white/15"><Share2 size={15} /> Share channel</button>
              <button className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm text-white hover:bg-white/15"><Flag size={15} /> Report</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
