"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Heart, MessageCircle, Repeat2, Share2, Bookmark, CheckCircle, Trash2, Send } from "lucide-react";
import { api, apiGet } from "@/lib/api";
import { useAuth } from "@/providers/auth-provider";

export interface Post {
  id: string;
  author: { id: string; name: string; avatar: string; verified: boolean };
  title?: string | null; body?: string | null; video_url?: string | null; images: string[];
  time_ago: string; like_count: number; comment_count: number; repost_count: number;
  is_liked: boolean; is_saved: boolean; is_following: boolean; is_owner: boolean;
  repost_of?: Post | null;
}

function embedSrc(url: string): string | null {
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]{11})/);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
  if (url.includes("drive.google.com")) { const d = url.match(/\/file\/d\/([^/]+)/) || url.match(/[?&]id=([^&]+)/); if (d) return `https://drive.google.com/file/d/${d[1]}/preview`; }
  if (url.includes("vimeo.com")) { const v = url.match(/vimeo\.com\/(\d+)/); if (v) return `https://player.vimeo.com/video/${v[1]}`; }
  return null;
}
const isDirect = (u: string) => /\.(mp4|webm|ogg|mov|m4v)(\?|$)/i.test(u);

function Linkify({ text }: { text: string }) {
  const parts = text.split(/(https?:\/\/[^\s]+)/g);
  return <>{parts.map((p, i) => /^https?:\/\//.test(p)
    ? <a key={i} href={p} target="_blank" rel="noreferrer" className="text-cyan hover:underline break-all">{p}</a>
    : <span key={i}>{p}</span>)}</>;
}

function PostMedia({ video_url, images }: { video_url?: string | null; images: string[] }) {
  const embed = video_url ? embedSrc(video_url) : null;
  return (
    <>
      {video_url && (
        <div className="mt-3 overflow-hidden rounded-xl bg-black">
          {embed ? (
            <iframe src={embed} className="aspect-video w-full" allow="autoplay; fullscreen; encrypted-media" allowFullScreen />
          ) : isDirect(video_url) ? (
            // eslint-disable-next-line jsx-a11y/media-has-caption
            <video src={video_url} controls className="aspect-video w-full" />
          ) : (
            <a href={video_url} target="_blank" rel="noreferrer" className="block p-3 text-sm text-cyan hover:underline break-all">{video_url}</a>
          )}
        </div>
      )}
      {images.length > 0 && (
        <div className={`mt-3 grid gap-1 overflow-hidden rounded-xl ${images.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}>
          {images.slice(0, 4).map((src, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={i} src={src} alt="" className={`w-full object-cover ${images.length === 1 ? "max-h-[520px]" : "aspect-square"}`} />
          ))}
        </div>
      )}
    </>
  );
}

function Comments({ postId }: { postId: string }) {
  const { user } = useAuth();
  const router = useRouter();
  const qc = useQueryClient();
  const [text, setText] = useState("");
  const { data } = useQuery({ queryKey: ["post-comments", postId], queryFn: () => apiGet<{ id: string; author: { name: string; avatar: string }; body: string; time_ago: string }[]>(`/api/posts/${postId}/comments`) });
  const send = async () => {
    if (!user) return router.push("/login");
    if (!text.trim()) return;
    try { await api(`/api/posts/${postId}/comments`, { method: "POST", json: { body: text.trim() } }); setText(""); qc.invalidateQueries({ queryKey: ["post-comments", postId] }); } catch { /* */ }
  };
  return (
    <div className="mt-3 border-t border-white/5 pt-3">
      <div className="mb-3 flex gap-2">
        <input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} placeholder="Write a comment…" className="flex-1 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white outline-none focus:border-cyan/50" />
        <button onClick={send} className="rounded-full bg-white p-2 text-black"><Send size={16} /></button>
      </div>
      <div className="flex flex-col gap-3">
        {data?.map((c) => (
          <div key={c.id} className="flex gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={c.author.avatar} alt="" className="h-7 w-7 rounded-full object-cover" />
            <div className="rounded-2xl bg-white/5 px-3 py-2">
              <p className="text-xs font-semibold text-white">{c.author.name} <span className="ml-1 font-normal text-white/30">{c.time_ago}</span></p>
              <p className="text-sm text-white/80">{c.body}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function PostCard({ post, onDeleted, embedded }: { post: Post; onDeleted?: () => void; embedded?: boolean }) {
  const { user } = useAuth();
  const router = useRouter();
  const qc = useQueryClient();
  const [liked, setLiked] = useState(post.is_liked);
  const [likeCount, setLikeCount] = useState(post.like_count);
  const [saved, setSaved] = useState(post.is_saved);
  const [following, setFollowing] = useState(post.is_following);
  const [show, setShow] = useState(false);
  const [copied, setCopied] = useState(false);

  const need = () => { if (!user) { router.push("/login"); return true; } return false; };
  const like = async () => { if (need()) return; const w = liked; setLiked(!w); setLikeCount((c) => c + (w ? -1 : 1)); try { const r = await api<{ liked: boolean; count: number }>(`/api/posts/${post.id}/like`, { method: "POST" }); setLiked(r.liked); setLikeCount(r.count); } catch { setLiked(w); } };
  const save = async () => { if (need()) return; const w = saved; setSaved(!w); try { const r = await api<{ saved: boolean }>(`/api/posts/${post.id}/save`, { method: "POST" }); setSaved(r.saved); } catch { setSaved(w); } };
  const follow = async () => { if (need()) return; setFollowing(true); try { await api(`/api/users/${post.author.id}/follow`, { method: "POST" }); } catch { /* */ } };
  const repost = async () => { if (need()) return; try { await api(`/api/posts/${post.id}/repost`, { method: "POST" }); qc.invalidateQueries({ queryKey: ["feed"] }); } catch { /* */ } };
  const share = async () => { try { await navigator.clipboard.writeText(`${location.origin}/post/${post.id}`); setCopied(true); setTimeout(() => setCopied(false), 1200); } catch { /* */ } };
  const del = async () => { if (!confirm("Delete this post?")) return; try { await api(`/api/posts/${post.id}`, { method: "DELETE" }); onDeleted?.(); qc.invalidateQueries({ queryKey: ["feed"] }); } catch { /* */ } };

  return (
    <article className={embedded ? "rounded-xl border border-white/10 p-3" : "glass-panel rounded-2xl p-4"}>
      <header className="flex items-center gap-3">
        <Link href={`/channel/${post.author.id}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={post.author.avatar} alt="" className="h-10 w-10 rounded-full object-cover" />
        </Link>
        <div className="min-w-0 flex-1">
          <Link href={`/channel/${post.author.id}`} className="flex items-center gap-1 text-sm font-semibold text-white hover:underline">
            {post.author.name} {post.author.verified && <CheckCircle size={13} className="text-cyan" />}
          </Link>
          <p className="text-xs text-white/40">{post.time_ago}</p>
        </div>
        {!embedded && !post.is_owner && !following && (
          <button onClick={follow} className="rounded-full bg-white px-4 py-1.5 text-xs font-semibold text-black hover:bg-white/90">Follow</button>
        )}
        {!embedded && post.is_owner && (
          <button onClick={del} className="rounded-full p-2 text-white/40 hover:bg-white/10 hover:text-rose"><Trash2 size={16} /></button>
        )}
      </header>

      {post.title && <h2 className="mt-3 text-base font-bold text-white">{post.title}</h2>}
      {post.body && <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-white/85"><Linkify text={post.body} /></p>}
      <PostMedia video_url={post.video_url} images={post.images} />

      {post.repost_of && (
        <div className="mt-3">
          <PostCard post={post.repost_of} embedded />
        </div>
      )}

      {!embedded && (
        <>
          <div className="mt-3 flex items-center gap-1 text-white/60">
            <button onClick={like} className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm hover:bg-white/5 ${liked ? "text-rose" : ""}`}><Heart size={17} className={liked ? "fill-rose" : ""} /> {likeCount > 0 && likeCount}</button>
            <button onClick={() => setShow((s) => !s)} className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm hover:bg-white/5"><MessageCircle size={17} /> {post.comment_count > 0 && post.comment_count}</button>
            <button onClick={repost} className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm hover:bg-white/5"><Repeat2 size={17} /> {post.repost_count > 0 && post.repost_count}</button>
            <button onClick={share} className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm hover:bg-white/5"><Share2 size={16} /> {copied ? "Copied" : ""}</button>
            <button onClick={save} className={`ml-auto rounded-full p-2 hover:bg-white/5 ${saved ? "text-cyan" : ""}`}><Bookmark size={17} className={saved ? "fill-cyan" : ""} /></button>
          </div>
          {show && <Comments postId={post.id} />}
        </>
      )}
    </article>
  );
}
