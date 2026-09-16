"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Upload as UploadIcon, Sparkles, CheckCircle } from "lucide-react";
import { useAuth } from "@/providers/auth-provider";
import { api, apiGet } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface Category { id: string; name: string; slug: string; }

export default function UploadPage() {
  const { user, becomeCreator } = useAuth();
  const isCreator = user?.role === "creator" || user?.role === "admin";

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: () => apiGet<Category[]>("/api/categories"),
    enabled: isCreator,
  });

  const [form, setForm] = useState({
    title: "", description: "", content_type: "video", category_id: "",
    media_url: "", thumbnail_url: "", duration_seconds: "", tags: "",
    visibility: "public", is_premium: false, price_gems: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  const set = (k: keyof typeof form) => (v: string | boolean) =>
    setForm((f) => ({ ...f, [k]: v }));

  if (!user) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-white">Log in to upload</h1>
        <p className="mt-2 text-sm text-white/50">You need an account to publish content.</p>
      </div>
    );
  }

  if (!isCreator) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-fuchsia/20 bg-fuchsia/10">
          <Sparkles size={24} className="text-fuchsia" />
        </div>
        <h1 className="text-2xl font-bold text-white">Become a creator to upload</h1>
        <p className="mx-auto mt-2 max-w-sm text-sm text-white/50">
          Upgrade your account to publish videos, photos and links.
        </p>
        <Button variant="violet" className="mt-6" onClick={() => becomeCreator().catch(() => {})}>
          <Sparkles size={16} /> Become a creator
        </Button>
      </div>
    );
  }

  const onSubmit = async () => {
    setError(null);
    if (!form.title.trim()) return setError("Title is required.");
    if (!form.media_url.trim()) return setError("Media URL (link) is required.");
    setBusy(true);
    try {
      await api("/api/content", {
        method: "POST",
        json: {
          title: form.title.trim(),
          description: form.description.trim() || null,
          content_type: form.content_type,
          category_id: form.category_id || null,
          media_url: form.media_url.trim(),
          thumbnail_url: form.thumbnail_url.trim() || null,
          duration_seconds: form.duration_seconds ? Number(form.duration_seconds) : null,
          visibility: form.visibility,
          is_premium: form.is_premium,
          price_gems: form.is_premium && form.price_gems ? Number(form.price_gems) : null,
          allow_comments: true,
          tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
        },
      });
      setDone(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <CheckCircle size={40} className="mx-auto mb-4 text-cyan" />
        <h1 className="text-2xl font-bold text-white">Published ✓</h1>
        <p className="mt-2 text-sm text-white/50">Your content is live on the feed.</p>
        <div className="mt-6 flex justify-center gap-3">
          <Button onClick={() => (window.location.href = "/")}>View feed</Button>
          <Button variant="glass" onClick={() => { setDone(false); setForm({ ...form, title: "", media_url: "", thumbnail_url: "", description: "" }); }}>
            Upload another
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex items-center gap-3">
        <UploadIcon size={24} className="text-cyan" />
        <h1 className="text-2xl font-bold tracking-tight text-white">Upload content</h1>
      </div>

      <div className="glass-panel flex flex-col gap-4 rounded-xl p-5 sm:p-6">
        <Input id="title" label="Title *" placeholder="Give it a title"
          value={form.title} onChange={(e) => set("title")(e.target.value)} />

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-white/50">Description</label>
          <textarea rows={3} placeholder="What's this about?"
            value={form.description} onChange={(e) => set("description")(e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white outline-none transition-all placeholder:text-white/30 focus:border-cyan/50 focus:bg-white/10" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-white/50">Type</label>
            <select value={form.content_type} onChange={(e) => set("content_type")(e.target.value)}
              className="rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white outline-none focus:border-cyan/50">
              <option value="video">Video</option>
              <option value="photo">Photo</option>
              <option value="link">Link</option>
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-white/50">Category</label>
            <select value={form.category_id} onChange={(e) => set("category_id")(e.target.value)}
              className="rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white outline-none focus:border-cyan/50">
              <option value="">— none —</option>
              {categories?.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
            </select>
          </div>
        </div>

        <Input id="media_url" label="Media URL * (link to video/photo)"
          placeholder="https://… (Google Drive, direct link, etc.)"
          value={form.media_url} onChange={(e) => set("media_url")(e.target.value)} />
        <Input id="thumbnail_url" label="Thumbnail URL"
          placeholder="https://… (optional cover image)"
          value={form.thumbnail_url} onChange={(e) => set("thumbnail_url")(e.target.value)} />

        <div className="grid grid-cols-2 gap-4">
          <Input id="duration" label="Duration (seconds)" type="number" placeholder="e.g. 320"
            value={form.duration_seconds} onChange={(e) => set("duration_seconds")(e.target.value)} />
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

        <Input id="tags" label="Tags (comma separated)" placeholder="video editing, tutorial, 4k"
          value={form.tags} onChange={(e) => set("tags")(e.target.value)} />

        <div className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 p-3">
          <input type="checkbox" checked={form.is_premium}
            onChange={(e) => set("is_premium")(e.target.checked)}
            className="h-4 w-4 accent-fuchsia-500" id="premium" />
          <label htmlFor="premium" className="flex-1 text-sm text-white/80">Premium (unlock with gems)</label>
          {form.is_premium && (
            <input type="number" placeholder="Gems" value={form.price_gems}
              onChange={(e) => set("price_gems")(e.target.value)}
              className="w-24 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white outline-none focus:border-gold" />
          )}
        </div>

        {error && <p className="text-sm text-rose">{error}</p>}

        <Button onClick={onSubmit} disabled={busy} className="w-full">
          {busy ? "Publishing…" : "Publish"}
        </Button>
      </div>
    </div>
  );
}
