"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useInfiniteQuery, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { Heart, MessageCircle, Share2, CheckCircle, Lock, Gem, Play, Volume2, VolumeX, Crown } from "lucide-react";
import { api, apiGet } from "@/lib/api";
import { CommentPanel } from "@/components/content/comment-panel";
import { useAuth } from "@/providers/auth-provider";

interface Reel {
  id: string; title: string; media_url: string | null; thumbnail_url: string | null;
  is_premium: boolean; price_gems: number | null; is_locked: boolean;
  creator: { name: string; avatar: string; verified: boolean; vip_tier?: string | null }; creator_id: string;
  like_count: number; comment_count: number; is_liked: boolean; is_following: boolean;
}
interface Page { items: Reel[]; next_cursor: string | null; }

function embedSrc(url: string): string | null {
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]{11})/); if (yt) return `https://www.youtube.com/embed/${yt[1]}?autoplay=1&loop=1&playlist=${yt[1]}&controls=0`;
  if (url.includes("drive.google.com")) { const d = url.match(/\/file\/d\/([^/]+)/); if (d) return `https://drive.google.com/file/d/${d[1]}/preview`; }
  return null;
}
const isDirect = (u: string) => /\.(mp4|webm|ogg|mov|m4v)(\?|$)/i.test(u);

function ReelItem({ r, muted, onToggleMute }: { r: Reel; muted: boolean; onToggleMute: () => void }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const vidRef = useRef<HTMLVideoElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [liked, setLiked] = useState(r.is_liked);
  const [likeCount, setLikeCount] = useState(r.like_count);
  const [following, setFollowing] = useState(r.is_following);
  const [copied, setCopied] = useState(false);
  const [unlocking, setUnlocking] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [paused, setPaused] = useState(true);
  const [burst, setBurst] = useState(false);
  const lastTapRef = useRef(0);
  const doLikeBurst = () => { if (!liked) like(); setBurst(true); setTimeout(() => setBurst(false), 700); };
  const onTapVideo = () => {
    const now = Date.now();
    if (now - lastTapRef.current < 300) { doLikeBurst(); }
    else { const v = vidRef.current; if (v) v.paused ? v.play() : v.pause(); }
    lastTapRef.current = now;
  };
  const embed = r.media_url ? embedSrc(r.media_url) : null;

  useEffect(() => {
    const el = wrapRef.current, v = vidRef.current; if (!el) return;
    const io = new IntersectionObserver((e) => {
      if (!v) return;
      if (e[0].isIntersecting) v.play().catch(() => {}); else v.pause();
    }, { threshold: 0.6 });
    io.observe(el); return () => io.disconnect();
  }, [r.media_url]);

  const like = async () => { if (!user) return; const w = liked; setLiked(!w); setLikeCount((c) => c + (w ? -1 : 1)); try { await api(`/api/content/${r.id}/like`, { method: "POST" }); } catch { setLiked(w); } };
  const follow = async () => { if (!user) return; setFollowing(true); try { await api(`/api/users/${r.creator_id}/follow`, { method: "POST" }); } catch { /* */ } };
  const share = async () => { try { await navigator.clipboard.writeText(`${location.origin}/content/${r.id}`); setCopied(true); setTimeout(() => setCopied(false), 1200); } catch { /* */ } };
  const unlock = async () => { if (!user) return; setUnlocking(true); try { await api(`/api/content/${r.id}/unlock`, { method: "POST" }); qc.invalidateQueries({ queryKey: ["reels"] }); qc.invalidateQueries({ queryKey: ["wallet"] }); } catch (e) { alert((e as { message?: string })?.message || "Unlock failed"); } finally { setUnlocking(false); } };

  return (
    <div ref={wrapRef} className="relative flex h-full w-full snap-start items-center justify-center bg-black">
      <div className="relative h-full w-full max-w-[460px] overflow-hidden bg-black">
        {r.is_locked ? (
          <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-cover bg-center p-6 text-center" style={{ backgroundImage: r.thumbnail_url ? `url(${r.thumbnail_url})` : undefined }}>
            <div className="absolute inset-0 bg-black/70 backdrop-blur-md" />
            <Lock size={36} className="relative text-white" />
            <p className="relative font-semibold text-white">Premium reel</p>
            <button onClick={unlock} disabled={unlocking} className="relative flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-black hover:bg-white/90 disabled:opacity-50">
              <Gem size={16} className="text-gold" /> {unlocking ? "Unlocking…" : `Unlock · ${r.price_gems}`}
            </button>
          </div>
        ) : embed ? (
          <iframe src={embed} className="h-full w-full" allow="autoplay; fullscreen" />
        ) : r.media_url && isDirect(r.media_url) ? (
          // eslint-disable-next-line jsx-a11y/media-has-caption
          <video
            ref={vidRef}
            src={r.media_url}
            poster={r.thumbnail_url ?? undefined}
            className="h-full w-full object-contain"
            loop
            muted={muted}
            playsInline
            preload="auto"
            autoPlay
            onPlay={() => setPaused(false)}
            onPause={() => setPaused(true)}
            onWaiting={() => setPaused(true)}
            onPlaying={() => setPaused(false)}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-white/40"><Play size={40} /></div>
        )}

        {!r.is_locked && r.media_url && isDirect(r.media_url) && paused && (
          <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur"><Play size={30} className="ml-1 fill-white" /></span>
          </div>
        )}
        {!r.is_locked && <div className="absolute inset-0 z-[5]" onClick={onTapVideo} />}
        {burst && <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center"><Heart size={110} className="animate-ping fill-rose text-rose opacity-90" /></div>}

        {/* mute toggle */}
        {!r.is_locked && r.media_url && isDirect(r.media_url) && (
          <button onClick={onToggleMute} className="absolute right-3 top-3 z-10 rounded-full bg-black/50 p-2 text-white">{muted ? <VolumeX size={18} /> : <Volume2 size={18} />}</button>
        )}

        {/* action rail */}
        <div className="absolute bottom-24 right-3 z-10 flex flex-col items-center gap-5 text-white">
          <button onClick={like} className="flex flex-col items-center"><Heart size={30} className={liked ? "fill-rose text-rose" : ""} /><span className="text-xs">{likeCount}</span></button>
          <button onClick={() => setShowComments(true)} className="flex flex-col items-center"><MessageCircle size={28} /><span className="text-xs">{r.comment_count}</span></button>
          <button onClick={share} className="flex flex-col items-center"><Share2 size={26} /><span className="text-xs">{copied ? "✓" : "Share"}</span></button>
        </div>

        {/* creator + title */}
        <div className="absolute bottom-6 left-4 right-16 z-10 text-white">
          <div className="mb-2 flex items-center gap-2">
            <Link href={`/channel/${r.creator_id}`} className="flex items-center gap-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={r.creator.avatar} alt="" className="h-9 w-9 rounded-full border border-white/30 object-cover" />
              <span className="flex items-center gap-1 text-sm font-semibold">{r.creator.name} {r.creator.verified && <CheckCircle size={12} />}{r.creator.vip_tier && <Crown size={12} className="text-fuchsia" />}</span>
            </Link>
            {user && !following && <button onClick={follow} className="rounded-full border border-white/60 px-3 py-1 text-xs font-semibold">Follow</button>}
          </div>
          <p className="line-clamp-2 text-sm text-white/90">{r.title}</p>
        </div>
      </div>
      {showComments && <CommentPanel contentId={r.id} ownerId={r.creator_id} count={r.comment_count} onClose={() => setShowComments(false)} />}
    </div>
  );
}

function ReelsInner() {
  const [muted, setMuted] = useState(true);
  const sp = useSearchParams();
  const v = sp.get("v");
  const { data: pinned } = useQuery({
    queryKey: ["reel-pinned", v],
    queryFn: () => apiGet<Reel & { creator_id: string }>(`/api/content/${v}`),
    enabled: !!v,
  });
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useInfiniteQuery({
    queryKey: ["reels"],
    queryFn: ({ pageParam }) => apiGet<Page>(`/api/reels${pageParam ? `?cursor=${encodeURIComponent(pageParam)}` : ""}`),
    initialPageParam: "",
    getNextPageParam: (last) => last.next_cursor ?? undefined,
  });

  const sentinelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = sentinelRef.current; if (!el) return;
    const io = new IntersectionObserver((e) => { if (e[0].isIntersecting && hasNextPage && !isFetchingNextPage) fetchNextPage(); });
    io.observe(el); return () => io.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const feedReels = data?.pages.flatMap((p) => p.items) ?? [];
  const reels: Reel[] = pinned
    ? [pinned as Reel, ...feedReels.filter((r) => r.id !== pinned.id)]
    : feedReels;

  return (
    <div className="fixed bottom-16 left-0 right-0 top-16 z-20 overflow-y-scroll bg-black snap-y snap-mandatory hide-scrollbar sm:bottom-0 sm:top-20 sm:left-[72px] lg:left-64">
      {isLoading ? (
        <div className="flex h-full items-center justify-center text-white/40">Loading reels…</div>
      ) : reels.length === 0 ? (
        <div className="flex h-full flex-col items-center justify-center gap-2 text-white/40"><Play size={40} /><p>No reels yet. Upload a vertical short!</p></div>
      ) : (
        reels.map((r) => (
          <div key={r.id} className="h-full w-full snap-start">
            <ReelItem r={r} muted={muted} onToggleMute={() => setMuted((m) => !m)} />
          </div>
        ))
      )}
      <div ref={sentinelRef} className="h-2" />
    </div>
  );
}

export default function ReelsPage() {
  return (
    <Suspense fallback={<div className="fixed inset-0 z-20 flex items-center justify-center bg-black text-white/40">Loading reels…</div>}>
      <ReelsInner />
    </Suspense>
  );
}
