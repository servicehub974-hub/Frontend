"use client";

import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Shield, Plus, ToggleLeft, ToggleRight, Gem, Crown, Check, X, MessageSquareHeart } from "lucide-react";
import { useAuth } from "@/providers/auth-provider";
import { api, apiGet } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MonetizationAdmin } from "@/components/admin/monetization-admin";

interface Category { id: string; name: string; slug: string; is_active: boolean; }
interface Tag { id: string; name: string; slug: string; status: string; }
interface Order { id: string; kind: string; item: string; amount_gems: number | null; amount_usd: number | null; method: string | null; txn_id: string | null; user?: { name: string }; }
interface PaySettings { instructions: string; pay_number: string; pay_email: string; }
interface FB { id: string; name: string; email: string | null; category: string | null; message: string; created_at: string | null; }

export default function AdminPage() {
  const { user, loading } = useAuth();
  const qc = useQueryClient();
  const isAdmin = user?.role === "admin";

  const cats = useQuery({ queryKey: ["categories"], queryFn: () => apiGet<Category[]>("/api/categories"), enabled: isAdmin });
  const tags = useQuery({ queryKey: ["tags"], queryFn: () => apiGet<Tag[]>("/api/tags"), enabled: isAdmin });
  const features = useQuery({ queryKey: ["admin-features"], queryFn: () => apiGet<Record<string, boolean>>("/api/admin/features"), enabled: isAdmin });
  const orders = useQuery({ queryKey: ["admin-orders"], queryFn: () => apiGet<Order[]>("/api/admin/orders?status=pending"), enabled: isAdmin, refetchInterval: 20000 });
  const paySettings = useQuery({ queryKey: ["admin-pay"], queryFn: () => apiGet<PaySettings>("/api/payment/settings"), enabled: isAdmin });
  const feedback = useQuery({ queryKey: ["admin-feedback"], queryFn: () => apiGet<FB[]>("/api/admin/feedback"), enabled: isAdmin });
  const [pay, setPay] = useState<PaySettings>({ instructions: "", pay_number: "", pay_email: "" });
  useEffect(() => { if (paySettings.data) setPay(paySettings.data); }, [paySettings.data]);
  const decide = async (id: string, action: "approve" | "reject") => {
    try { await api(`/api/admin/orders/${id}/${action}`, { method: "POST" }); qc.invalidateQueries({ queryKey: ["admin-orders"] }); }
    catch (e) { setErr(e instanceof Error ? e.message : "Failed"); }
  };
  const [paySaved, setPaySaved] = useState(false);
  const savePay = async () => {
    try { await api("/api/admin/payment-settings", { method: "PUT", json: pay }); qc.invalidateQueries({ queryKey: ["admin-pay"] }); qc.invalidateQueries({ queryKey: ["payment-settings"] }); setPaySaved(true); setTimeout(() => setPaySaved(false), 1600); }
    catch (e) { setErr(e instanceof Error ? e.message : "Failed"); }
  };

  const toggleFeature = async (key: string, enabled: boolean) => {
    try {
      await api(`/api/admin/features/${key}`, { method: "PATCH", json: { enabled } });
      qc.invalidateQueries({ queryKey: ["admin-features"] });
      qc.invalidateQueries({ queryKey: ["features"] });
    } catch (e) { setErr(e instanceof Error ? e.message : "Failed"); }
  };

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

      <div className="mt-6 glass-panel rounded-xl p-5">
        <h2 className="mb-4 font-semibold text-white">Feature controls</h2>
        <div className="flex flex-col gap-2">
          {Object.entries(features.data ?? {}).map(([key, enabled]) => (
            <div key={key} className="flex items-center justify-between rounded-lg px-3 py-2 hover:bg-white/5">
              <span className="text-sm capitalize text-white/80">{key}</span>
              <button onClick={() => toggleFeature(key, !enabled)} className={enabled ? "text-cyan" : "text-white/30"}>
                {enabled ? <ToggleRight size={30} /> : <ToggleLeft size={30} />}
              </button>
            </div>
          ))}
          {(!features.data || Object.keys(features.data).length === 0) && (
            <p className="px-3 py-2 text-sm text-white/40">No feature flags.</p>
          )}
        </div>
        <p className="mt-3 text-xs text-white/30">Turning a feature off hides it across the whole site.</p>
      </div>

      {/* Payment settings */}
      <section className="mt-8">
        <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-white"><Crown size={18} className="text-fuchsia" /> Payment settings</h2>
        <div className="flex flex-col gap-2 rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <textarea value={pay.instructions} onChange={(e) => setPay({ ...pay, instructions: e.target.value })} rows={2} placeholder="Instructions shown to users" className="resize-none rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-cyan/50" />
          <div className="flex flex-wrap gap-2">
            <input value={pay.pay_number} onChange={(e) => setPay({ ...pay, pay_number: e.target.value })} placeholder="Pay number (bKash/Nagad…)" className="min-w-[180px] flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-cyan/50" />
            <input value={pay.pay_email} onChange={(e) => setPay({ ...pay, pay_email: e.target.value })} placeholder="Pay email / crypto address" className="min-w-[180px] flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-cyan/50" />
            <Button onClick={savePay}>Save</Button>
            {paySaved && <span className="self-center text-sm font-semibold text-green-400">Saved ✓</span>}
          </div>
        </div>
      </section>

      {/* Pending orders */}
      <section className="mt-8">
        <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-white"><Gem size={18} className="text-gold" /> Pending payments {orders.data && orders.data.length > 0 && <span className="rounded-full bg-rose px-2 py-0.5 text-xs text-white">{orders.data.length}</span>}</h2>
        {!orders.data || orders.data.length === 0 ? (
          <p className="text-sm text-white/40">No pending orders.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {orders.data.map((o) => (
              <div key={o.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-white">{o.user?.name ?? "User"} · <span className="capitalize text-cyan">{o.kind}</span> {o.item}</p>
                  <p className="text-xs text-white/50">
                    {o.amount_gems ? `${o.amount_gems} Gems` : ""}{o.amount_usd ? ` · $${o.amount_usd}` : ""}
                    {o.method ? ` · ${o.method}` : ""} · Txn: <span className="text-white/70">{o.txn_id || "—"}</span>
                  </p>
                </div>
                <button onClick={() => decide(o.id, "approve")} className="flex items-center gap-1 rounded-full bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-500"><Check size={14} /> Approve</button>
                <button onClick={() => decide(o.id, "reject")} className="flex items-center gap-1 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/15"><X size={14} /> Reject</button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Feedback */}
      <section className="mt-8">
        <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-white"><MessageSquareHeart size={18} className="text-rose" /> Feedback</h2>
        {!feedback.data || feedback.data.length === 0 ? (
          <p className="text-sm text-white/40">No feedback yet.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {feedback.data.map((f) => (
              <div key={f.id} className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                <p className="text-sm text-white/85">{f.message}</p>
                <p className="mt-1 text-xs text-white/40">
                  {f.name}{f.email ? ` · ${f.email}` : ""}{f.category ? ` · ${f.category}` : ""}{f.created_at ? ` · ${new Date(f.created_at).toLocaleDateString()}` : ""}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      <MonetizationAdmin />

      <p className="mt-6 text-xs text-white/30">
        More admin tools (users, content moderation, feature controls) come in Phase 10.
      </p>
    </div>
  );
}
