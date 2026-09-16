"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Shield, Plus } from "lucide-react";
import { useAuth } from "@/providers/auth-provider";
import { api, apiGet } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface Category { id: string; name: string; slug: string; is_active: boolean; }
interface Tag { id: string; name: string; slug: string; status: string; }

export default function AdminPage() {
  const { user, loading } = useAuth();
  const qc = useQueryClient();
  const isAdmin = user?.role === "admin";

  const cats = useQuery({ queryKey: ["categories"], queryFn: () => apiGet<Category[]>("/api/categories"), enabled: isAdmin });
  const tags = useQuery({ queryKey: ["tags"], queryFn: () => apiGet<Tag[]>("/api/tags"), enabled: isAdmin });

  const [catName, setCatName] = useState("");
  const [tagName, setTagName] = useState("");
  const [err, setErr] = useState<string | null>(null);

  if (loading) return <div className="px-6 py-16 text-white/50">Loading…</div>;
  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <Shield size={28} className="mx-auto mb-3 text-rose" />
        <h1 className="text-2xl font-bold text-white">Admins only</h1>
        <p className="mt-2 text-sm text-white/50">You don&apos;t have access to this page.</p>
      </div>
    );
  }

  const addCategory = async () => {
    setErr(null);
    if (!catName.trim()) return;
    try {
      await api("/api/categories", { method: "POST", json: { name: catName.trim() } });
      setCatName("");
      qc.invalidateQueries({ queryKey: ["categories"] });
    } catch (e) { setErr(e instanceof Error ? e.message : "Failed"); }
  };
  const addTag = async () => {
    setErr(null);
    if (!tagName.trim()) return;
    try {
      await api("/api/tags", { method: "POST", json: { name: tagName.trim() } });
      setTagName("");
      qc.invalidateQueries({ queryKey: ["tags"] });
    } catch (e) { setErr(e instanceof Error ? e.message : "Failed"); }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex items-center gap-3">
        <Shield size={24} className="text-cyan" />
        <h1 className="text-2xl font-bold tracking-tight text-white">Admin Panel</h1>
      </div>

      {err && <p className="mb-4 text-sm text-rose">{err}</p>}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Categories */}
        <div className="glass-panel rounded-xl p-5">
          <h2 className="mb-4 font-semibold text-white">Categories</h2>
          <div className="mb-4 flex gap-2">
            <Input id="cat" placeholder="New category" value={catName}
              onChange={(e) => setCatName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addCategory()} />
            <Button onClick={addCategory}><Plus size={16} /></Button>
          </div>
          <div className="flex flex-col gap-1">
            {cats.data?.length ? cats.data.map((c) => (
              <div key={c.id} className="flex items-center justify-between rounded-lg px-3 py-2 text-sm hover:bg-white/5">
                <span className="text-white/80">{c.name}</span>
                <span className="text-xs text-white/30">/{c.slug}</span>
              </div>
            )) : <p className="px-3 py-2 text-sm text-white/40">None yet.</p>}
          </div>
        </div>

        {/* Tags */}
        <div className="glass-panel rounded-xl p-5">
          <h2 className="mb-4 font-semibold text-white">Tags</h2>
          <div className="mb-4 flex gap-2">
            <Input id="tag" placeholder="New tag" value={tagName}
              onChange={(e) => setTagName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addTag()} />
            <Button onClick={addTag}><Plus size={16} /></Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {tags.data?.length ? tags.data.map((t) => (
              <span key={t.id} className="rounded-full bg-white/5 px-3 py-1 text-xs text-white/70">#{t.name}</span>
            )) : <p className="px-3 py-2 text-sm text-white/40">None yet.</p>}
          </div>
        </div>
      </div>

      <p className="mt-6 text-xs text-white/30">
        More admin tools (users, content moderation, feature controls) come in Phase 10.
      </p>
    </div>
  );
}
