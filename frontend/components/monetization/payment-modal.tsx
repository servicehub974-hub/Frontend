"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { X, Copy, CheckCircle } from "lucide-react";
import { api, apiGet } from "@/lib/api";

interface Settings { instructions: string; pay_number: string; pay_email: string; }

export function PaymentModal({ open, onClose, kind, item, title, amountText }: {
  open: boolean; onClose: () => void; kind: "vip" | "gems"; item: string; title: string; amountText: string;
}) {
  const [method, setMethod] = useState("");
  const [txn, setTxn] = useState("");
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState("");
  const { data: s } = useQuery({ queryKey: ["payment-settings"], queryFn: () => apiGet<Settings>("/api/payment/settings"), enabled: open });

  if (!open) return null;

  const copy = (v: string) => { navigator.clipboard?.writeText(v); setCopied(v); setTimeout(() => setCopied(""), 1200); };
  const submit = async () => {
    if (!txn.trim()) return;
    setBusy(true);
    try { await api("/api/orders", { method: "POST", json: { kind, item, method: method.trim() || null, txn_id: txn.trim() } }); setDone(true); }
    catch { /* */ } finally { setBusy(false); }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 p-4 backdrop-blur-md" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0d0d12] p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold text-white">{title}</h2>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"><X size={16} /></button>
        </div>

        {done ? (
          <div className="py-6 text-center">
            <CheckCircle size={40} className="mx-auto mb-3 text-green-400" />
            <p className="font-semibold text-white">Order submitted!</p>
            <p className="mt-1 text-sm text-white/50">An admin will verify your payment and activate it shortly.</p>
            <button onClick={onClose} className="mt-5 rounded-full bg-white px-6 py-2 text-sm font-semibold text-black">Done</button>
          </div>
        ) : (
          <>
            <p className="mb-3 text-sm text-white/70">{amountText}</p>
            {s?.instructions && <p className="mb-3 rounded-lg bg-white/5 p-3 text-xs text-white/60">{s.instructions}</p>}
            <div className="mb-3 flex flex-col gap-2">
              {s?.pay_number && (
                <button onClick={() => copy(s.pay_number)} className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white">
                  <span><span className="text-white/40">Pay number:</span> {s.pay_number}</span>
                  {copied === s.pay_number ? <CheckCircle size={15} className="text-green-400" /> : <Copy size={15} className="text-white/40" />}
                </button>
              )}
              {s?.pay_email && (
                <button onClick={() => copy(s.pay_email)} className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white">
                  <span><span className="text-white/40">Pay email:</span> {s.pay_email}</span>
                  {copied === s.pay_email ? <CheckCircle size={15} className="text-green-400" /> : <Copy size={15} className="text-white/40" />}
                </button>
              )}
            </div>
            <input value={method} onChange={(e) => setMethod(e.target.value)} placeholder="Payment method (bKash, Nagad, crypto…)" className="mb-2 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-cyan/50" />
            <input value={txn} onChange={(e) => setTxn(e.target.value)} placeholder="Transaction / Order ID *" className="mb-4 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-cyan/50" />
            <button onClick={submit} disabled={busy || !txn.trim()} className="w-full rounded-full bg-white px-4 py-2.5 text-sm font-semibold text-black hover:bg-white/90 disabled:opacity-50">
              {busy ? "Submitting…" : "Submit for approval"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
