"use client";

import { useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  const onSubmit = async () => {
    setBusy(true);
    try {
      await api("/api/auth/forgot-password", {
        method: "POST",
        json: { email: email.trim() },
      });
    } catch {
      /* response is intentionally identical whether or not the email exists */
    } finally {
      setBusy(false);
      setSent(true);
    }
  };

  if (sent) {
    return (
      <div>
        <h1 className="mb-2 text-2xl font-bold tracking-tight text-white">
          Check your inbox
        </h1>
        <p className="mb-6 text-sm text-white/50">
          If an account exists for <span className="text-white">{email}</span>,
          we&apos;ve sent a password reset link. It expires in 1 hour.
        </p>
        <Link href="/login">
          <Button variant="glass" className="w-full">
            Back to login
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold tracking-tight text-white">
        Forgot password?
      </h1>
      <p className="mb-6 text-sm text-white/50">
        Enter your email and we&apos;ll send a reset link.
      </p>

      <div className="flex flex-col gap-4">
        <Input
          id="email"
          label="Email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onSubmit()}
        />
        <Button onClick={onSubmit} disabled={busy} className="w-full">
          {busy ? "Sending…" : "Send reset link"}
        </Button>
      </div>

      <p className="mt-6 text-center text-sm text-white/50">
        <Link href="/login" className="text-cyan hover:underline">
          Back to login
        </Link>
      </p>
    </div>
  );
}
