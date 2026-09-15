"use client";

import { useState } from "react";
import { MailWarning, X } from "lucide-react";
import { useAuth } from "@/providers/auth-provider";
import { api } from "@/lib/api";

export function VerifyEmailBanner() {
  const { user } = useAuth();
  const [dismissed, setDismissed] = useState(false);
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");

  if (!user || user.email_verified || dismissed) return null;

  const resend = async () => {
    setStatus("sending");
    try {
      await api("/api/auth/resend-verification", { method: "POST" });
      setStatus("sent");
    } catch {
      setStatus("idle");
    }
  };

  return (
    <div className="mx-4 mt-3 flex items-center gap-3 rounded-xl border border-gold/20 bg-gold/5 px-4 py-2.5 text-sm sm:mx-6">
      <MailWarning size={16} className="shrink-0 text-gold" />
      <span className="flex-1 text-white/70">
        Verify your email to unlock uploads, gems and VIP.
      </span>
      {status === "sent" ? (
        <span className="text-xs text-cyan">Sent — check your inbox</span>
      ) : (
        <button
          onClick={resend}
          disabled={status === "sending"}
          className="shrink-0 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white transition-colors hover:bg-white/20 disabled:opacity-50"
        >
          {status === "sending" ? "Sending…" : "Resend email"}
        </button>
      )}
      <button
        onClick={() => setDismissed(true)}
        className="shrink-0 text-white/40 hover:text-white"
        aria-label="Dismiss"
      >
        <X size={16} />
      </button>
    </div>
  );
}
