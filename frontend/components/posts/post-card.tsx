"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Heart, MessageCircle, Repeat2, Share2, Bookmark, CheckCircle, Trash2, Send, Play, X, ChevronLeft, ChevronRight, Pencil, ImagePlus } from "lucide-react";
import { uploadFile } from "@/lib/storage";
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

function ytId(url: string) { const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]{11})/); return m ? m[1] : null; }
function embedSrc(url: string): string | null {
  const y = ytId(url); if (y) return `https://www.youtube.com/embed/${y}`;
  if (url.includes("drive.google.com")) { const d = url.match(/\/file\/d\/([^/]+)/) || url.match(/[?&]id=([^&]+)/); if (d) return `https://drive.google.com/file/d/${d[1]}/preview`; }
  if (url.includes("vimeo.com")) { const v = url.match(/vimeo\.com\/(\d+)/); if (v) return `https://player.vimeo.com/video/${v[1]}`; }
  return null;
}
const isDirect = (u: string) => /\.(mp4|webm|ogg|mov|m4v)(\?|$)/i.test(u);

function Linkify({ text }: { text: string }) {
  const parts = text.split(/(https?:\/\/[^\s]+)/g);
  return <>{parts.map((p, i) => /^https?:\/\//.test(p)
    ? <a key={i} href={p} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="text-cyan hover:underline break-all">{p}</a>
    : <span key={i}>{p}</span>)}</>;
}

// Facebook-style fullscreen image viewer with click-to-zoom + prev/next
function Lightbox({ images, start, onClose }: { images: string[]; start: number; onClose: () => void }) {
  const [i, setI] = useState(start);
  const [zoom, setZoom] = useState(false);
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95" onClick={onClose}>
      <button onClick={onClose} className="absolute right-4 top-4 z-10 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"><X size={20} /></button>
      {images.length > 1 && (
        <>
          <button onClick={(e) => { e.stopPropagation(); setZoom(false); setI((v) => (v - 1 + images.length) % images.length); }} className="absolute left-3 z-10 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"><ChevronLeft size={22} /></button>
          <button onClick={(e) => { e.stopPropagation(); setZoom(false); setI((v) => (v + 1) % images.length); }} className="absolute right-3 z-10 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"><ChevronRight size={22} /></button>
        </>
      )}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={images[i]} alt="" onClick={(e) => { e.stopPropagation(); setZoom((z) => !z); }}
        className={`max-h-[92vh] max-w-[96vw] object-contain transition-transform duration-200 ${zoom ? "scale-[1.8] cursor-zoom-out" : "cursor-zoom-in"}`} />
      {images.length > 1 && <div className="absolute bottom-4 text-sm text-white/60">{i + 1} / {images.length}</div>}
    </div>
  );
}

function VideoModal({ url, onClose }: { url: string; onClose: () => void }) {
  const embed = embedSrc(url);
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 p-4" onClick={onClose}>
      <button onClick={onClose} className="absolute right-4 top-4 z-10 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"><X size={20} /></button>
      <div className="w-full max-w-3xl overflow-hidden rounded-xl bg-black" onClick={(e) => e.stopPropagation()}>
        {embed ? <iframe src={embed} className="aspect-video w-full" allow="autoplay; fullscreen; encrypted-media" allowFullScreen />
          : isDirect(url) ? /* eslint-disable-next-line jsx-a11y/media-has-caption */ <video src={url} controls autoPlay className="aspect-video w-full" />
          : <a href={url} target="_blank" rel="noreferrer" className="block p-4 text-cyan hover:underline break-all">{url}</a>}
      </div>
    </div>
  );
}

function FbImages({ images, onZoom }: { images: string[]; onZoom: (i: number) => void }) {
  const n = images.length;
  const Img = ({ i, cls }: { i: number; cls: string }) => (
    <button onClick={() => onZoom(i)} className={`relative ${cls}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={images[i]} alt="" className="h-full w-full cursor-zoom-in object-cover" />
      {i === 3 && n > 4 && <span className="absolute inset-0 flex items-center justify-center bg-black/60 text-xl font-semibold text-white">+{n - 4}</span>}
    </button>
  );
  if (n === 1) return <div className="mt-3 overflow-hidden rounded-xl"><button onClick={() => onZoom(0)}>{/* eslint-disable-next-line @next/next/no-img-element */}<img src={images[0]} alt="" className="max-h-[520px] w-full cursor-zoom-in object-cover" /></button></div>;
  if (n === 2) return <div className="mt-3 grid h-72 grid-cols-2 gap-1 overflow-hidden rounded-xl"><Img i={0} cls="" /><Img i={1} cls="" /></div>;
  if (n === 3) return <div className="mt-3 grid h-80 grid-cols-2 grid-rows-2 gap-1 overflow-hidden rounded-xl"><Img i={0} cls="row-span-2" /><Img i={1} cls="" /><Img i={2} cls="" /></div>;
  return <div className="mt-3 grid h-80 grid-cols-2 grid-rows-2 gap-1 overflow-hidden rounded-xl">{[0, 1, 2, 3].map((i) => <Img key={i} i={i} cls="" />)}</div>;
}

function PostMedia({ post, onZoom, onPlay }: { post: Post; onZoom: (i: number) => void; onPlay: () => void }) {
  const hasImages = post.images.length > 0;
  const yid = post.video_url ? ytId(post.video_url) : null;

  if (hasImages) {
    return (
      <>
        <FbImages images={post.images} onZoom={onZoom} />
        {post.video_url && (
          <button onClick={onPlay} className="mt-2 flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-2 text-left hover:bg-white/10">
            <span className="relative flex h-12 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-black">
              {yid && /* eslint-disable-next-line @next/next/no-img-element */ <img src={`https://img.youtube.com/vi/${yid}/hqdefault.jpg`} alt="" className="h-full w-full object-cover opacity-70" />}
              <Play size={18} className="absolute fill-white text-white" />
            </span>
            <span className="text-sm font-medium text-white">Watch video</span>
          </button>
        )}
      </>
    );
  }

  if (post.video_url) {
    const embed = embedSrc(post.video_url);
    return (
      <div className="mt-3 overflow-hidden rounded-xl bg-black">
        {embed ? <iframe src={embed} className="aspect-video w-full" allow="autoplay; fullscreen; encrypted-media" allowFullScreen />
          : isDirect(post.video_url) ? /* eslint-disable-next-line jsx-a11y/media-has-caption */ <video src={post.video_url} controls className="aspect-video w-full" />
          : <a href={post.video_url} target="_blank" rel="noreferrer" className="block p-3 text-sm text-cyan hover:underline break-all">{post.video_url}</a>}
      </div>
    );
  }
  return null;
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
  const [expanded, setExpanded] = useState(false);
  const [lightbox, setLightbox] = useState<number | null>(null);
  const [playVideo, setPlayVideo] = useState(false);
  const [editing, setEditing] = useState(false);
  const [eTitle, setETitle] = useState(post.title ?? "");
  const [eBody, setEBody] = useState(post.body ?? "");
  const [eVideo, setEVideo] = useState(post.video_url ?? "");
  const [eImages, setEImages] = useState<string[]>(post.images);
  const [uploading, setUploading] = useState(false);

  const longBody = (post.body?.length ?? 0) > 180;

  const need = () => { if (!user) { router.push("/login"); return true; } return false; };
  const like = async () => { if (need()) return; const w = liked; setLiked(!w); setLikeCount((c) => c + (w ? -1 : 1)); try { const r = await api<{ liked: boolean; count: number }>(`/api/posts/${post.id}/like`, { method: "POST" }); setLiked(r.liked); setLikeCount(r.count); } catch { setLiked(w); } };
  const save = async () => { if (need()) return; const w = saved; setSaved(!w); try { const r = await api<{ saved: boolean }>(`/api/posts/${post.id}/save`, { method: "POST" }); setSaved(r.saved); } catch { setSaved(w); } };
  const follow = async () => { if (need()) return; setFollowing(true); try { await api(`/api/users/${post.author.id}/follow`, { method: "POST" }); } catch { /* */ } };
  const repost = async () => { if (need()) return; try { await api(`/api/posts/${post.id}/repost`, { method: "POST" }); qc.invalidateQueries({ queryKey: ["feed"] }); } catch { /* */ } };
  const share = async () => { try { await navigator.clipboard.writeText(`${location.origin}/post/${post.id}`); setCopied(true); setTimeout(() => setCopied(false), 1200); } catch { /* */ } };
  const del = async () => { if (!confirm("Delete this post?")) return; try { await api(`/api/posts/${post.id}`, { method: "DELETE" }); onDeleted?.(); qc.invalidateQueries({ queryKey: ["feed"] }); } catch { /* */ } };
  const saveEdit = async () => {
    try {
      await api(`/api/posts/${post.id}`, { method: "PATCH", json: { title: eTitle.trim() || null, body: eBody.trim() || null, video_url: eVideo.trim() || null, images: eImages } });
      setEditing(false);
      qc.invalidateQueries({ queryKey: ["feed"] });
      qc.invalidateQueries({ queryKey: ["post", post.id] });
      qc.invalidateQueries({ queryKey: ["channel-posts", post.author.id] });
    } catch { /* */ }
  };
  const addEditImages = async (files: FileList | null) => {
    if (!files) return; setUploading(true);
    try { const urls: string[] = []; for (const f of Array.from(files).slice(0, 4 - eImages.length)) { if (f.type.startsWith("image")) urls.push(await uploadFile(f)); } setEImages((p) => [...p, ...urls].slice(0, 4)); } catch { /* */ } finally { setUploading(false); }
  };

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
        {!embedded && post.is_owner && !editing && (
          <button onClick={() => setEditing(true)} className="rounded-full p-2 text-white/40 hover:bg-white/10 hover:text-white"><Pencil size={15} /></button>
        )}
        {!embedded && post.is_owner && (
          <button onClick={del} className="rounded-full p-2 text-white/40 hover:bg-white/10 hover:text-rose"><Trash2 size={16} /></button>
        )}
      </header>

      {editing ? (
        <div className="mt-3 flex flex-col gap-2">
          <input value={eTitle} onChange={(e) => setETitle(e.target.value)} placeholder="Title" className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-white outline-none focus:border-cyan/50" />
          <textarea value={eBody} onChange={(e) => setEBody(e.target.value)} rows={3} placeholder="Text…" className="resize-none rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-cyan/50" />
          <input value={eVideo} onChange={(e) => setEVideo(e.target.value)} placeholder="Video URL" className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-cyan/50" />
          {eImages.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {eImages.map((src, i) => (
                <div key={i} className="relative h-16 w-16 overflow-hidden rounded-lg">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt="" className="h-full w-full object-cover" />
                  <button onClick={() => setEImages(eImages.filter((_, j) => j !== i))} className="absolute right-0.5 top-0.5 rounded-full bg-black/70 p-0.5 text-white"><X size={11} /></button>
                </div>
              ))}
            </div>
          )}
          <div className="flex items-center gap-2">
            <label className="flex cursor-pointer items-center gap-1.5 rounded-full bg-white/5 px-3 py-1.5 text-xs text-white/70 hover:bg-white/10">
              <ImagePlus size={15} /> {uploading ? "Uploading…" : "Photos"}
              <input type="file" accept="image/*" multiple hidden onChange={(e) => addEditImages(e.target.files)} disabled={eImages.length >= 4} />
            </label>
            <button onClick={() => setEditing(false)} className="ml-auto text-sm text-white/40 hover:text-white">Cancel</button>
            <button onClick={saveEdit} className="rounded-full bg-white px-4 py-1.5 text-sm font-semibold text-black hover:bg-white/90">Save</button>
          </div>
        </div>
      ) : (
        <>
          {post.title && <h2 className="mt-3 text-base font-bold text-white">{post.title}</h2>}
          {post.body && (
            <div className="mt-2 text-sm leading-relaxed text-white/85">
              <p className={`whitespace-pre-wrap ${!expanded && longBody ? "line-clamp-3" : ""}`}><Linkify text={post.body} /></p>
              {longBody && (
                <button onClick={() => setExpanded((e) => !e)} className="mt-0.5 text-sm font-medium text-white/50 hover:text-white">
                  {expanded ? "See less" : "See more"}
                </button>
              )}
            </div>
          )}
          <PostMedia post={post} onZoom={(i) => setLightbox(i)} onPlay={() => setPlayVideo(true)} />
          {post.repost_of && <div className="mt-3"><PostCard post={post.repost_of} embedded /></div>}
        </>
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

      {lightbox !== null && <Lightbox images={post.images} start={lightbox} onClose={() => setLightbox(null)} />}
      {playVideo && post.video_url && <VideoModal url={post.video_url} onClose={() => setPlayVideo(false)} />}
    </article>
  );
}
