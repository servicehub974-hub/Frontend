"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle } from "lucide-react";
import { api, apiGet } from "@/lib/api";
import { useAuth } from "@/providers/auth-provider";
import { fmtCount } from "@/lib/format";
import { ContentCard } from "@/components/home/content-card";
import { Skeleton } from "@/components/ui/badges";
import type { ContentItem } from "@/lib/types";

interface PublicProfile {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  cover_url: string | null;
  bio: string | null;
  role: string;
  follower_count: number;
  content_count: number;
  is_following: boolean;
}

export default function ChannelPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const { user } = useAuth();
  const router = useRouter();

  const { data: p, isLoading } = useQuery({
    queryKey: ["channel", id, user?.id ?? "anon"],
    queryFn: () => apiGet<PublicProfile>(`/api/users/${id}`),
    retry: false,
  });
  const { data: content } = useQuery({
    queryKey: ["channel-content", id],
    queryFn: () => apiGet<ContentItem[]>(`/api/users/${id}/content`),
  });

  const [following, setFollowing] = useState(false);
  const [followers, setFollowers] = useState(0);
  useEffect(() => {
    if (p) { setFollowing(p.is_following); setFollowers(p.follower_count); }
  }, [p]);

  if (isLoading)
    return <div className="mx-auto max-w-6xl px-4 py-8"><Skeleton className="h-40 rounded-xl" /></div>;
  if (!p)
    return <div className="px-6 py-16 text-center text-white/60">Channel not found.</div>;

  const isMe = user?.id === p.id;
  const follow = async () => {
    if (!user) return router.push("/login");
    setFollowing((v) => !v);
    setFollowers((n) => (following ? n - 1 : n + 1));
    try {
      const r = await api<{ following: boolean; follower_count: number }>(`/api/users/${p.id}/follow`, { method: "POST" });
      setFollowing(r.following); setFollowers(r.follower_count);
    } catch { setFollowing(p.is_following); setFollowers(p.follower_count); }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
      {/* cover */}
      <div className="relative h-32 w-full overflow-hidden rounded-2xl bg-gradient-to-r from-violet-900/40 to-cyan-900/30 sm:h-48">
        {p.cover_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={p.cover_url} alt="" className="h-full w-full object-cover" />
        )}
      </div>

      {/* header */}
      <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={p.avatar_url ?? `https://i.pravatar.cc/150?u=${p.username ?? p.id}`}
          alt={p.username ?? ""} className="h-20 w-20 rounded-full border-2 border-black object-cover sm:h-24 sm:w-24" />
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-white">{p.display_name ?? p.username}</h1>
            {(p.role === "creator" || p.role === "admin") && <CheckCircle size={18} className="text-cyan" />}
          </div>
          <p className="mt-1 text-sm text-white/50">
            @{p.username} · {fmtCount(followers)} followers · {fmtCount(p.content_count)} posts
          </p>
          {p.bio && <p className="mt-1 max-w-xl text-sm text-white/60">{p.bio}</p>}
        </div>
        {!isMe && (
          <button onClick={follow}
            className={`rounded-full px-6 py-2.5 text-sm font-semibold transition-colors ${
              following ? "bg-white/10 text-white" : "bg-white text-black hover:bg-white/90"
            }`}>
            {following ? "Following" : "Follow"}
          </button>
        )}
      </div>

      {/* content grid */}
      <h2 className="mb-4 mt-8 text-lg font-bold text-white">Content</h2>
      {!content || content.length === 0 ? (
        <p className="text-sm text-white/40">No posts yet.</p>
      ) : (
        <div className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {content.map((item, i) => <ContentCard key={item.id} item={item} index={i} />)}
        </div>
      )}
    </div>
  );
}
