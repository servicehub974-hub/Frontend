"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Pencil } from "lucide-react";
import { api, apiGet } from "@/lib/api";
import { useAuth } from "@/providers/auth-provider";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface Category { id: string; name: string; slug: string; }
interface Detail {
  title: string; description: string | null; creator_id: string;
  category: { slug: string } | null; tags: string[];
  is_premium: boolean; price_gems: number | null; visibility: string;
}

export default function EditContentPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const { user } = useAuth();
  const router = useRouter();

  const { data: d } = useQuery({ queryKey: ["content-edit", id], queryFn: () => apiGet<Detail>(`/api/content/${id}`), retry: false });
  const { data: categories } = useQuery({ queryKey: ["categories"], queryFn: () => apiGet<Category[]>("/api/categories") });

  const [form, setForm] = useState({ title: "", description: "", category_id: "", tags: "", visibility: "public", is_premium: false, price_gems: "" });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (d && categories) {
      const catId = d.category ? categories.find((c) => c.slug === d.category!.slug)?.id ?? "" : "";
      setForm({
        title: d.title, description: d.description ?? "", category_id: catId,
        tags: d.tags.join(", "), visibility: d.visibility,
        is_premium: d.is_premium, price_gems: d.price_gems ? String(d.price_gems) : "",
      });
    }
  }, [d, categories]);

  if (d && user && d.creator_id !== user.id && user.role !== "admin")
    return <div className="px-6 py-16 text-center text-white/60">You can&apos;t edit this.</div>;

  const set = (k: keyof typeof form) => (v: string | boolean) => setForm((f) => ({ ...f, [k]: v }));

  const save = async () => {
    setError(null); setBusy(true);
    try {
      await api(`/api/content/${id}`, {
        method: "PATCH",
        json: {
          title: form.title.trim(),
          description: form.description.trim() || null,
          category_id: form.category_id || null,
          visibility: form.visibility,
          is_premium: form.is_premium,
          price_gems: form.is_premium && form.price_gems ? Number(form.price_gems) : null,
          tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
        },
      });
      router.push(`/content/${id}`);
    } catch (e) { setError(e instanceof Error ? e.message : "Save failed"); } finally { setBusy(false); }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <h1 className="mb-6 flex items-center gap-3 text-2xl font-bold tracking-tight text-white">
        <Pencil size={22} className="text-cyan" /> Edit content
      </h1>
      <div className="glass-panel flex flex-col gap-4 rounded-xl p-5 sm:p-6">
        <Input id="title" label="Title" value={form.title} onChange={(e) => set("title")(e.target.value)} />
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-white/50">Description</label>
          <textarea rows={3} value={form.description} onChange={(e) => set("description")(e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white outline-none focus:border-cyan/50" />
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
        <Input id="tags" label="Tags (comma separated)" value={form.tags} onChange={(e) => set("tags")(e.target.value)} />
        <div className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 p-3">
          <input type="checkbox" checked={form.is_premium} onChange={(e) => set("is_premium")(e.target.checked)} className="h-4 w-4 accent-fuchsia-500" id="premium" />
          <label htmlFor="premium" className="flex-1 text-sm text-white/80">Premium</label>
          {form.is_premium && (
            <input type="number" placeholder="Gems" value={form.price_gems} onChange={(e) => set("price_gems")(e.target.value)}
              className="w-24 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white outline-none focus:border-gold" />
          )}
        </div>
        {error && <p className="text-sm text-rose">{error}</p>}
        <div className="flex gap-3">
          <Button onClick={save} disabled={busy} className="flex-1">{busy ? "Saving…" : "Save changes"}</Button>
          <Button variant="glass" onClick={() => router.push(`/content/${id}`)}>Cancel</Button>
        </div>
      </div>
    </div>
  );
}
