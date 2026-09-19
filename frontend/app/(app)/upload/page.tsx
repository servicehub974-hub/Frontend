"use client";

import { useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { UploadCloud, Sparkles, CheckCircle, X, Link2 } from "lucide-react";
import { PageHeader } from "@/components/ui/empty-state";
import { useAuth } from "@/providers/auth-provider";
import { api, apiGet } from "@/lib/api";
import { uploadFile, readVideoMeta } from "@/lib/storage";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface Category { id: string; name: string; }

export default function UploadPage() {
  const { user, becomeCreator } = useAuth();
  const isCreator = user?.role === "creator" || user?.role === "admin";

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: () => apiGet<Category[]>("/api/categories"),
    enabled: isCreator,
  });

  const fileInput = useRef<HTMLInputElement>(null);
  const thumbInput = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);

  const [mediaUrl, setMediaUrl] = useState("");
  const [mediaType, setMediaType] = useState<"video" | "photo">("video");
  const [progress, setProgress] = useState<number | null>(null);
  const [fileName, setFileName] = useState("");
  const [durationSec, setDurationSec] = useState<number | null>(null);
  const [isShort, setIsShort] = useState(false);
  const [useLink, setUseLink] = useState(false);

  const [thumbUrl, setThumbUrl] = useState("");
  const [thumbProgress, setThumbProgress] = useState<number | null>(null);

  const [form, setForm] = useState({
    title: "", description: "", category_id: "", tags: "",
    visibility: "public", is_premium: false, price_gems: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  const set = (k: keyof typeof form) => (v: string | boolean) => setForm((f) => ({ ...f, [k]: v }));

  if (!user)
    return <div className="mx-auto max-w-md px-4 py-16 text-center"><h1 className="text-2xl font-bold text-white">Log in to upload</h1></div>;

  if (!isCreator)
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-fuchsia/20 bg-fuchsia/10">
          <Sparkles size={24} className="text-fuchsia" />
        </div>
        <h1 className="text-2xl font-bold text-white">Become a creator to upload</h1>
        <Button variant="violet" className="mt-6" onClick={() => becomeCreator().catch(() => {})}>
          <Sparkles size={16} /> Become a creator
        </Button>
      </div>
    );

  const handleFile = async (file: File) => {
    setError(null);
    if (!file.type.startsWith("video")) return setError("Please choose a video file.");
    setMediaType("video");
    setFileName(file.name);
    if (!form.title) set("title")(file.name.replace(/\.[^.]+$/, ""));
    if (isVideo) {
      const meta = await readVideoMeta(file);
      setDurationSec(meta.duration);
      setIsShort(meta.isVertical && (meta.duration ?? 999) <= 180);
    }
    setProgress(0);
    try {
      const url = await uploadFile(file, setProgress);
      setMediaUrl(url);
      setProgress(100);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
      setProgress(null);
    }
  };

  const handleThumb = async (file: File) => {
    if (!file.type.startsWith("image")) return setError("Thumbnail must be an image.");
    setThumbProgress(0);
    try {
      const url = await uploadFile(file, setThumbProgress);
      setThumbUrl(url); setThumbProgress(100);
    } catch { setThumbProgress(null); }
  };

  const publish = async () => {
    setError(null);
    if (!form.title.trim()) return setError("Title is required.");
    if (!mediaUrl.trim()) return setError("Upload a file or paste a media link first.");
    setBusy(true);
    try {
      await api("/api/content", {
        method: "POST",
        json: {
          title: form.title.trim(),
          description: form.description.trim() || null,
          content_type: useLink ? "video" : mediaType,
          category_id: form.category_id || null,
          media_url: mediaUrl.trim(),
          thumbnail_url: thumbUrl.trim() || null,
          duration_seconds: durationSec,
          is_short: !useLink && mediaType === "video" ? isShort : false,
          visibility: form.visibility,
          is_premium: form.is_premium,
          price_gems: form.is_premium && form.price_gems ? Number(form.price_gems) : null,
          allow_comments: true,
          tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
        },
      });
      setDone(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Publish failed");
    } finally {
      setBusy(false);
    }
  };

  if (done)
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <CheckCircle size={40} className="mx-auto mb-4 text-cyan" />
        <h1 className="text-2xl font-bold text-white">Published ✓</h1>
        <div className="mt-6 flex justify-center gap-3">
          <Button onClick={() => (window.location.href = "/")}>View feed</Button>
          <Button variant="glass" onClick={() => window.location.reload()}>Upload another</Button>
        </div>
      </div>
    );

  const uploaded = mediaUrl && (progress === 100 || useLink);

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <PageHeader icon={UploadCloud} title="Upload video" action={
        <button onClick={() => setUseLink((v) => !v)} className="flex items-center gap-1.5 text-xs text-white/50 hover:text-white">
          <Link2 size={14} /> {useLink ? "Upload a file instead" : "Use a link instead"}
        </button>
      } />

      {/* Drop zone / link input */}
      {!uploaded ? (
        useLink ? (
          <div className="glass-panel rounded-xl p-5">
            <Input id="link" label="Media URL" placeholder="https://… (YouTube, Google Drive, direct link)"
              value={mediaUrl} onChange={(e) => setMediaUrl(e.target.value)} />
          </div>
        ) : (
          <div
            onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
            onDragLeave={() => setDrag(false)}
            onDrop={(e) => { e.preventDefault(); setDrag(false); const f = e.dataTransfer.files?.[0]; if (f) handleFile(f); }}
            className={`flex flex-col items-center justify-center rounded-2xl border-2 border-dashed py-16 transition-colors ${
              drag ? "border-cyan bg-cyan/5" : "border-white/15 bg-white/[0.02]"
            }`}
          >
            <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-white/5">
              <UploadCloud size={32} className="text-white/70" />
            </div>
            {progress !== null ? (
              <div className="w-64 text-center">
                <p className="mb-2 truncate text-sm text-white/70">{fileName}</p>
                <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
                  <div className="h-full bg-cyan transition-all" style={{ width: `${progress}%` }} />
                </div>
                <p className="mt-2 text-xs text-white/50">{progress}%</p>
              </div>
            ) : (
              <>
                <p className="mb-1 text-white/80">Drag & drop a video</p>
                <p className="mb-4 text-xs text-white/40">or</p>
                <Button onClick={() => fileInput.current?.click()}>Select file</Button>
              </>
            )}
            <input ref={fileInput} type="file" accept="video/*" className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
          </div>
        )
      ) : (
        <div className="glass-panel flex flex-col gap-4 rounded-xl p-5 sm:p-6">
          {/* preview */}
          <div className="flex items-center gap-3 rounded-lg bg-white/5 p-3">
            <CheckCircle size={18} className="text-cyan" />
            <span className="flex-1 truncate text-sm text-white/70">{fileName || mediaUrl}</span>
            <button onClick={() => { setMediaUrl(""); setProgress(null); setFileName(""); }} className="text-white/40 hover:text-white"><X size={16} /></button>
          </div>

          <Input id="title" label="Title *" value={form.title} onChange={(e) => set("title")(e.target.value)} />
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-white/50">Description</label>
            <textarea rows={3} value={form.description} onChange={(e) => set("description")(e.target.value)}
              placeholder="Tell viewers about this… (links & #tags are highlighted)"
              className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white outline-none placeholder:text-white/30 focus:border-cyan/50" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-white/50">Category</label>
              <select value={form.category_id} onChange={(e) => set("category_id")(e.target.value)}
                className="rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white outline-none focus:border-cyan/50">
                <option value="">— none —</option>
                {categories?.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-white/50">Visibility</label>
              <select value={form.visibility} onChange={(e) => set("visibility")(e.target.value)}
                className="rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white outline-none focus:border-cyan/50">
                <option value="public">Public</option>
                <option value="unlisted">Unlisted</option>
                <option value="private">Private</option>
              </select>
            </div>
          </div>

          {/* thumbnail */}
          <div className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 p-3">
            {thumbUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={thumbUrl} alt="" className="h-12 w-20 rounded object-cover" />
            ) : (
              <div className="flex h-12 w-20 items-center justify-center rounded bg-white/5 text-[10px] text-white/40">No thumb</div>
            )}
            <div className="flex-1 text-sm text-white/60">
              {thumbProgress !== null && thumbProgress < 100 ? `Uploading… ${thumbProgress}%` : "Custom thumbnail (optional)"}
            </div>
            <Button variant="glass" size="sm" onClick={() => thumbInput.current?.click()}>Upload</Button>
            <input ref={thumbInput} type="file" accept="image/*" className="hidden"
              onChange={(e) => e.target.files?.[0] && handleThumb(e.target.files[0])} />
          </div>

          <Input id="tags" label="Tags (comma separated)" placeholder="music, 4k, bhojpuri"
            value={form.tags} onChange={(e) => set("tags")(e.target.value)} />

          <div className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 p-3">
            <input type="checkbox" checked={form.is_premium} onChange={(e) => set("is_premium")(e.target.checked)} className="h-4 w-4 accent-fuchsia-500" id="premium" />
            <label htmlFor="premium" className="flex-1 text-sm text-white/80">Premium (unlock with gems)</label>
            {form.is_premium && (
              <input type="number" placeholder="Gems" value={form.price_gems} onChange={(e) => set("price_gems")(e.target.value)}
                className="w-24 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white outline-none focus:border-gold" />
            )}
          </div>

          {error && <p className="text-sm text-rose">{error}</p>}
          <Button onClick={publish} disabled={busy} className="w-full">{busy ? "Publishing…" : "Publish"}</Button>
        </div>
      )}

      {error && !uploaded && <p className="mt-4 text-sm text-rose">{error}</p>}
    </div>
  );
}
