"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Crown, Gem, Check } from "lucide-react";
import { useAuth } from "@/providers/auth-provider";
import { api, apiGet } from "@/lib/api";
import { PageHeader } from "@/components/ui/empty-state";
import { PaymentModal } from "@/components/monetization/payment-modal";

interface Tier { tier: string; rank: number; price_gems: number | null; price_usd: number | null; duration_days: number | null; daily_gems: number; benefits: string[]; }
interface Status { active: boolean; tier: string | null; expires_at: string | null; }

const RING: Record<string, string> = { silver: "border-white/20", gold: "border-gold/40", platinum: "border-cyan/40", lifetime: "border-fuchsia/50" };

export default function VipPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [msg, setMsg] = useState("");
  const [pay, setPay] = useState<Tier | null>(null);

  const { data: tiers } = useQuery({ queryKey: ["vip-tiers"], queryFn: () => apiGet<Tier[]>("/api/vip/tiers") });
  const { data: status } = useQuery({ queryKey: ["vip-me"], queryFn: () => apiGet<Status>("/api/vip/me"), enabled: !!user });
  const { data: wallet } = useQuery({ queryKey: ["wallet"], queryFn: () => apiGet<{ gems: number }>("/api/wallet"), enabled: !!user });

  const subscribe = async (t: Tier) => {
    if (!user) return;
    setMsg("");
    try {
      await api("/api/vip/subscribe", { method: "POST", json: { tier: t.tier } });
      setMsg(`🎉 ${t.tier.toUpperCase()} activated!`);
      qc.invalidateQueries({ queryKey: ["vip-me"] });
      qc.invalidateQueries({ queryKey: ["wallet"] });
    } catch (e) { setMsg((e as { message?: string })?.message || "Could not subscribe."); }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <PageHeader icon={Crown} title="VIP Lounge" tint="text-fuchsia" action={
        user ? <Link href="/gems" className="flex items-center gap-1.5 rounded-full bg-white/5 px-4 py-1.5 text-sm text-white hover:bg-white/10"><Gem size={15} className="text-gold" /> {wallet?.gems ?? 0}</Link> : null
      } />

      {status?.active && (
        <div className="mb-6 flex items-center gap-3 rounded-2xl border border-fuchsia/30 bg-fuchsia/10 p-4">
          <Crown size={22} className="text-fuchsia" />
          <div>
            <p className="font-semibold text-white">You're {status.tier?.toUpperCase()} VIP</p>
            <p className="text-xs text-white/50">{status.expires_at ? `Expires ${new Date(status.expires_at).toLocaleDateString()}` : "Lifetime access"}</p>
          </div>
        </div>
      )}
      {msg && <p className="mb-4 rounded-lg bg-white/5 p-3 text-sm text-white">{msg}</p>}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {tiers?.map((t) => (
          <div key={t.tier} className={`flex flex-col rounded-2xl border ${RING[t.tier] || "border-white/10"} bg-white/[0.03] p-5`}>
            <h3 className="text-lg font-bold capitalize text-white">{t.tier}</h3>
            <div className="mt-1 text-2xl font-bold text-white">
              {t.price_gems != null ? <span className="flex items-center gap-1"><Gem size={18} className="text-gold" />{t.price_gems}</span> : `$${t.price_usd?.toFixed(2)}`}
            </div>
            <p className="mb-3 text-xs text-white/40">{t.duration_days ? `${t.duration_days} days` : "Lifetime"}</p>
            <ul className="mb-4 flex flex-1 flex-col gap-1.5">
              {t.benefits.map((b, i) => <li key={i} className="flex items-start gap-2 text-sm text-white/70"><Check size={15} className="mt-0.5 shrink-0 text-cyan" /> {b}</li>)}
            </ul>
            {!user ? (
              <Link href="/login" className="rounded-full bg-white/10 py-2 text-center text-sm font-semibold text-white">Log in</Link>
            ) : t.price_gems != null ? (
              <button onClick={() => subscribe(t)} className="rounded-full bg-white py-2 text-sm font-semibold text-black hover:bg-white/90">Subscribe · {t.price_gems}💎</button>
            ) : (
              <button onClick={() => setPay(t)} className="rounded-full bg-gradient-to-r from-fuchsia-600 to-violet-600 py-2 text-sm font-semibold text-white">Buy · ${t.price_usd?.toFixed(2)}</button>
            )}
          </div>
        ))}
      </div>
      <p className="mt-4 text-xs text-white/30">Gem-priced tiers are charged from your Gem balance instantly. Money-priced tiers use manual payment — submit your transaction ID and an admin approves it.</p>

      <PaymentModal open={!!pay} onClose={() => { setPay(null); qc.invalidateQueries({ queryKey: ["orders-me"] }); }}
        kind="vip" item={pay?.tier ?? ""} title={`Buy ${pay?.tier?.toUpperCase()} VIP`} amountText={`Amount: $${pay?.price_usd?.toFixed(2)}`} />
    </div>
  );
}
