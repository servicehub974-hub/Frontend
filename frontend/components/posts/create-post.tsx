"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ImagePlus, Video, X, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import { uploadFile } from "@/lib/storage";
import { useAuth } from "@/providers/auth-provider";

export function CreatePost() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [posting, setPosting] = useState(false);

  if (!user) return null;

  const pickImages = async (files: FileList | null) => {
    if (!files) return;
    setBusy(true);
    try {
      const urls: string[] = [];
      for (const f of Array.from(files).slice(0, 4 - images.length)) {
        if (f.type.startsWith("image")) urls.push(await uploadFile(f));
      }
      setImages((prev) => [...prev, ...urls].slice(0, 4));
    } catch { /* */ } finally { setBusy(false); }
  };

  const submit = async () => {
    if (!title.trim() && !body.trim() && images.length === 0 && !videoUrl.trim()) return;
    setPosting(true);
    try {
      await api("/api/posts", { method: "POST", json: { title: title.trim() || null, body: body.trim() || null, video_url: videoUrl.trim() || null, images } });
      setTitle(""); setBody(""); setVideoUrl(""); setImages([]); setOpen(false);
      qc.invalidateQueries({ queryKey: ["feed"] });
    } catch { /* */ } finally { setPosting(false); }
  };

  return (
    <div className="glass-panel rounded-2xl p-4">
      <div className="flex items-center gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={user.avatar_url || `https://i.pravatar.cc/150?u=${user.id}`} alt="" className="h-10 w-10 rounded-full object-cover" />
        <button onClick={() => setOpen(true)} className="flex-1 rounded-full bg-white/5 px-4 py-2.5 text-left text-sm text-white/40 hover:bg-white/10">
          Share something…
        </button>
      </div>

      {open && (
        <div className="mt-3 flex flex-col gap-3">
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title (optional)"
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-white outline-none focus:border-cyan/50" />
          <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="What's on your mind? Paste links too…" rows={3}
            className="resize-none rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-cyan/50" />
          <input value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="Video URL (YouTube / Drive / .mp4) — plays in the post"
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-cyan/50" />

          {images.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {images.map((src, i) => (
                <div key={i} className="relative h-20 w-20 overflow-hidden rounded-lg">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt="" className="h-full w-full object-cover" />
                  <button onClick={() => setImages(images.filter((_, j) => j !== i))} className="absolute right-0.5 top-0.5 rounded-full bg-black/70 p-0.5 text-white"><X size={12} /></button>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center gap-2">
            <label className="flex cursor-pointer items-center gap-1.5 rounded-full bg-white/5 px-3 py-1.5 text-sm text-white/70 hover:bg-white/10">
              {busy ? <Loader2 size={16} className="animate-spin" /> : <ImagePlus size={16} />} Photos
              <input type="file" accept="image/*" multiple hidden onChange={(e) => pickImages(e.target.files)} disabled={images.length >= 4} />
            </label>
            <button onClick={() => setOpen(false)} className="ml-auto text-sm text-white/40 hover:text-white">Cancel</button>
            <button onClick={submit} disabled={posting || busy} className="rounded-full bg-white px-5 py-1.5 text-sm font-semibold text-black hover:bg-white/90 disabled:opacity-50">
              {posting ? "Posting…" : "Post"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
