"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  const onSubmit = async () => {
    setError(null);
    if (password.length < 6) return setError("Password must be at least 6 characters.");
    if (password !== confirm) return setError("Passwords don't match.");
    setBusy(true);
    // Supabase auto-creates a recovery session from the email link (detectSessionInUrl).
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) return setError(error.message);
    setDone(true);
  };

  if (done) {
    return (
      <div>
        <h1 className="mb-2 text-2xl font-bold tracking-tight text-white">Password reset ✓</h1>
        <p className="mb-6 text-sm text-white/50">You can now log in with your new password.</p>
        <Button className="w-full" onClick={() => router.push("/login")}>Go to login</Button>
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold tracking-tight text-white">Set a new password</h1>
      <p className="mb-6 text-sm text-white/50">Choose a strong password.</p>
      <div className="flex flex-col gap-4">
        <Input id="password" label="New password" type="password" placeholder="At least 6 characters"
          value={password} onChange={(e) => setPassword(e.target.value)} />
        <Input id="confirm" label="Confirm password" type="password" placeholder="Repeat password"
          value={confirm} onChange={(e) => setConfirm(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onSubmit()} />
        {error && <p className="text-sm text-rose">{error}</p>}
        <Button onClick={onSubmit} disabled={busy} className="w-full">
          {busy ? "Resetting…" : "Reset password"}
        </Button>
      </div>
    </div>
  );
}
