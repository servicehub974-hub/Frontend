"use client";

import { useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  const onSubmit = async () => {
    setBusy(true);
    try {
      await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo:
          typeof window !== "undefined" ? `${window.location.origin}/reset-password` : undefined,
      });
    } catch {
      /* identical response regardless */
    } finally {
      setBusy(false);
      setSent(true);
    }
  };

  if (sent) {
    return (
      <div>
        <h1 className="mb-2 text-2xl font-bold tracking-tight text-white">Check your inbox</h1>
        <p className="mb-6 text-sm text-white/50">
          If an account exists for <span className="text-white">{email}</span>, we&apos;ve sent a reset link.
        </p>
        <Link href="/login"><Button variant="glass" className="w-full">Back to login</Button></Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold tracking-tight text-white">Forgot password?</h1>
      <p className="mb-6 text-sm text-white/50">Enter your email and we&apos;ll send a reset link.</p>
      <div className="flex flex-col gap-4">
        <Input id="email" label="Email" type="email" placeholder="you@example.com"
          value={email} onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onSubmit()} />
        <Button onClick={onSubmit} disabled={busy} className="w-full">
          {busy ? "Sending…" : "Send reset link"}
        </Button>
      </div>
      <p className="mt-6 text-center text-sm text-white/50">
        <Link href="/login" className="text-cyan hover:underline">Back to login</Link>
      </p>
    </div>
  );
}
