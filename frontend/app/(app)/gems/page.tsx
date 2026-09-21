"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Gem, Gift } from "lucide-react";
import { useAuth } from "@/providers/auth-provider";
import { api, apiGet } from "@/lib/api";
import { PageHeader } from "@/components/ui/empty-state";
import { PaymentModal } from "@/components/monetization/payment-modal";

interface Pkg { id: string; label: string; gems: number; price_usd: number; }
interface Wallet { gems: number; claimed_today: boolean; ledger: { delta: number; reason: string; at: string }[]; }

export default function GemsPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [pay, setPay] = useState<Pkg | null>(null);
  const [msg, setMsg] = useState("");

  const { data: wallet } = useQuery({ queryKey: ["wallet"], queryFn: () => apiGet<Wallet>("/api/wallet"), enabled: !!user });
  const { data: packages } = useQuery({ queryKey: ["gem-packages"], queryFn: () => apiGet<Pkg[]>("/api/gems/packages") });
  const { data: vip } = useQuery({ queryKey: ["vip-me"], queryFn: () => apiGet<{ active: boolean }>("/api/vip/me"), enabled: !!user });

  const claim = async () => {
    setMsg("");
    try { const r = await api<{ claimed: number }>("/api/wallet/daily-bonus", { method: "POST" }); setMsg(`🎁 +${r.claimed} Gems!`); qc.invalidateQueries({ queryKey: ["wallet"] }); }
    catch (e) { setMsg((e as { message?: string })?.message || "Could not claim."); }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <PageHeader icon={Gem} title="Gem Exchange" tint="text-gold" />

      {user && (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-gold/20 bg-gold/5 p-5">
          <div className="flex items-center gap-3">
            <Gem size={28} className="text-gold" />
            <div><p className="text-2xl font-bold text-white">{wallet?.gems ?? 0}</p><p className="text-xs text-white/40">Your Gems</p></div>
          </div>
          {vip?.active && (
            <button onClick={claim} disabled={wallet?.claimed_today} className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-black hover:bg-white/90 disabled:opacity-50">
              <Gift size={16} /> {wallet?.claimed_today ? "Claimed today" : "Claim daily bonus"}
            </button>
          )}
        </div>
      )}
      {msg && <p className="mb-4 rounded-lg bg-white/5 p-3 text-sm text-white">{msg}</p>}

      <h2 className="mb-3 text-lg font-semibold text-white">Buy Gems</h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {packages?.map((p) => (
          <button key={p.id} onClick={() => (user ? setPay(p) : null)} className="flex flex-col items-center rounded-2xl border border-white/10 bg-white/[0.03] p-4 hover:border-gold/40">
            <Gem size={24} className="mb-2 text-gold" />
            <p className="text-lg font-bold text-white">{p.gems}</p>
            <p className="text-xs text-white/40">Gems</p>
            <p className="mt-2 rounded-full bg-white/10 px-3 py-1 text-sm font-semibold text-white">${p.price_usd.toFixed(2)}</p>
          </button>
        ))}
      </div>
      <p className="mt-3 text-xs text-white/30">Gems are added after an admin verifies your payment (submit your transaction ID).</p>

      {wallet && wallet.ledger.length > 0 && (
        <div className="mt-8">
          <h2 className="mb-3 text-lg font-semibold text-white">History</h2>
          <div className="flex flex-col divide-y divide-white/5">
            {wallet.ledger.map((l, i) => (
              <div key={i} className="flex items-center justify-between py-2.5 text-sm">
                <span className="capitalize text-white/70">{l.reason.replace(/_/g, " ")}</span>
                <span className={l.delta >= 0 ? "font-semibold text-green-400" : "font-semibold text-rose"}>{l.delta >= 0 ? "+" : ""}{l.delta} 💎</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <PaymentModal open={!!pay} onClose={() => setPay(null)} kind="gems" item={pay?.id ?? ""} title="Buy Gems" amountText={pay ? `${pay.gems} Gems · $${pay.price_usd.toFixed(2)}` : ""} />
    </div>
  );
}
