"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

function ResetInner() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get("token");

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  const onSubmit = async () => {
    setError(null);
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }
    if (!token) {
      setError("Missing reset link.");
      return;
    }
    setBusy(true);
    try {
      await api("/api/auth/reset-password", {
        method: "POST",
        json: { token, new_password: password },
      });
      setDone(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Reset failed.");
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <div>
        <h1 className="mb-2 text-2xl font-bold tracking-tight text-white">
          Password reset ✓
        </h1>
        <p className="mb-6 text-sm text-white/50">
          You can now log in with your new password.
        </p>
        <Button className="w-full" onClick={() => router.push("/login")}>
          Go to login
        </Button>
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold tracking-tight text-white">
        Set a new password
      </h1>
      <p className="mb-6 text-sm text-white/50">Choose a strong password.</p>

      <div className="flex flex-col gap-4">
        <Input
          id="password"
          label="New password"
          type="password"
          placeholder="At least 8 characters"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <Input
          id="confirm"
          label="Confirm password"
          type="password"
          placeholder="Repeat password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onSubmit()}
        />
        {error && <p className="text-sm text-rose">{error}</p>}
        <Button onClick={onSubmit} disabled={busy} className="w-full">
          {busy ? "Resetting…" : "Reset password"}
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

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<p className="text-sm text-white/60">Loading…</p>}>
      <ResetInner />
    </Suspense>
  );
}
