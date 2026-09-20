"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ImagePlus, Plus, Trash2, Settings } from "lucide-react";
import { api, apiGet } from "@/lib/api";
import { useAuth } from "@/providers/auth-provider";
import { uploadFile } from "@/lib/storage";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface LinkT { label: string; url: string; }
interface Profile {
  id: string; username: string | null; display_name: string | null;
  avatar_url: string | null; cover_url: string | null; bio: string | null;
  website: string | null; location: string | null; links: LinkT[];
}

export default function ChannelEditPage() {
  const { user, loading, refreshUser } = useAuth();
  const router = useRouter();
  const avatarInput = useRef<HTMLInputElement>(null);
  const bannerInput = useRef<HTMLInputElement>(null);

  const { data: p } = useQuery({
    queryKey: ["channel-edit", user?.id],
    queryFn: () => apiGet<Profile>(`/api/users/${user!.id}`),
    enabled: !!user,
  });

  const [form, setForm] = useState({
    display_name: "", username: "", bio: "", location: "", website: "",
    avatar_url: "", cover_url: "",
  });
  const [links, setLinks] = useState<LinkT[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);

  useEffect(() => {
    if (p) {
      setForm({
        display_name: p.display_name ?? "", username: p.username ?? "",
        bio: p.bio ?? "", location: p.location ?? "", website: p.website ?? "",
        avatar_url: p.avatar_url ?? "", cover_url: p.cover_url ?? "",
      });
      setLinks(p.links ?? []);
    }
  }, [p]);

  if (loading) return <div className="px-6 py-16 text-white/50">Loading…</div>;
  if (!user) { router.push("/login"); return null; }

  const set = (k: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  const upBanner = async (file: File) => { setUploadingBanner(true); try { set("cover_url")(await uploadFile(file)); } finally { setUploadingBanner(false); } };
  const upAvatar = async (file: File) => { setUploadingAvatar(true); try { set("avatar_url")(await uploadFile(file)); } finally { setUploadingAvatar(false); } };

  const save = async () => {
    setError(null); setBusy(true);
    try {
      await api("/api/users/me", {
        method: "PATCH",
        json: {
          display_name: form.display_name.trim() || null,
          username: form.username.trim() || undefined,
          bio: form.bio.trim() || null,
          location: form.location.trim() || null,
          website: form.website.trim() || null,
          avatar_url: form.avatar_url || null,
          cover_url: form.cover_url || null,
          links: links.filter((l) => l.url.trim()),
        },
      });
      await refreshUser();
      router.push(`/channel/${user.id}`);
    } catch (e) { setError(e instanceof Error ? e.message : "Save failed"); } finally { setBusy(false); }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <h1 className="mb-6 flex items-center gap-3 text-2xl font-bold tracking-tight text-white">
        <Settings size={22} className="text-cyan" /> Customize channel
      </h1>

      {/* Banner */}
      <div className="relative mb-4 h-32 w-full overflow-hidden rounded-2xl bg-gradient-to-r from-violet-900/40 to-cyan-900/30 sm:h-40">
        {form.cover_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={form.cover_url} alt="" className="h-full w-full object-cover" />
        )}
        <button onClick={() => bannerInput.current?.click()}
          className="absolute inset-0 flex items-center justify-center gap-2 bg-black/40 text-sm font-medium text-white opacity-0 transition-opacity hover:opacity-100">
          <ImagePlus size={18} /> {uploadingBanner ? "Uploading…" : "Change banner"}
        </button>
        <input ref={bannerInput} type="file" accept="image/*" className="hidden"
          onChange={(e) => e.target.files?.[0] && upBanner(e.target.files[0])} />
      </div>

      {/* Avatar */}
      <div className="mb-6 flex items-center gap-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={form.avatar_url || `https://i.pravatar.cc/150?u=${form.username || user.id}`}
          alt="" className="h-20 w-20 rounded-full border border-white/15 object-cover" />
        <Button variant="glass" size="sm" onClick={() => avatarInput.current?.click()}>
          <ImagePlus size={15} /> {uploadingAvatar ? "Uploading…" : "Change avatar"}
        </Button>
        <input ref={avatarInput} type="file" accept="image/*" className="hidden"
          onChange={(e) => e.target.files?.[0] && upAvatar(e.target.files[0])} />
      </div>

      <div className="glass-panel flex flex-col gap-4 rounded-xl p-5 sm:p-6">
        <Input id="name" label="Display name" value={form.display_name} onChange={(e) => set("display_name")(e.target.value)} />
        <Input id="username" label="Username" value={form.username} onChange={(e) => set("username")(e.target.value)} />
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-white/50">Description</label>
          <textarea rows={4} value={form.bio} onChange={(e) => set("bio")(e.target.value)}
            placeholder="Tell people about your channel…"
            className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white outline-none focus:border-cyan/50" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Input id="location" label="Location" value={form.location} onChange={(e) => set("location")(e.target.value)} />
          <Input id="website" label="Website" value={form.website} onChange={(e) => set("website")(e.target.value)} />
        </div>

        {/* Links */}
        <div>
          <label className="text-xs font-medium text-white/50">Links</label>
          <div className="mt-2 flex flex-col gap-2">
            {links.map((l, i) => (
              <div key={i} className="flex gap-2">
                <input placeholder="Label" value={l.label}
                  onChange={(e) => setLinks((ls) => ls.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))}
                  className="w-32 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-cyan/50" />
                <input placeholder="https://…" value={l.url}
                  onChange={(e) => setLinks((ls) => ls.map((x, j) => (j === i ? { ...x, url: e.target.value } : x)))}
                  className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-cyan/50" />
                <button onClick={() => setLinks((ls) => ls.filter((_, j) => j !== i))} className="text-white/40 hover:text-rose"><Trash2 size={16} /></button>
              </div>
            ))}
            <button onClick={() => setLinks((ls) => [...ls, { label: "", url: "" }])}
              className="flex w-fit items-center gap-1.5 rounded-full bg-white/5 px-3 py-1.5 text-xs text-white/70 hover:bg-white/10">
              <Plus size={14} /> Add link
            </button>
          </div>
        </div>

        {error && <p className="text-sm text-rose">{error}</p>}
        <div className="flex gap-3">
          <Button onClick={save} disabled={busy} className="flex-1">{busy ? "Saving…" : "Save"}</Button>
          <Button variant="glass" onClick={() => router.push(`/channel/${user.id}`)}>Cancel</Button>
        </div>
      </div>
    </div>
  );
}
