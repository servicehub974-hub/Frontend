"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/auth-provider";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const onSubmit = async () => {
    setError(null);
    setBusy(true);
    try {
      await login(email.trim(), password);
      router.push("/");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Login failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold tracking-tight text-white">Welcome back</h1>
      <p className="mb-6 text-sm text-white/50">Log in to continue.</p>

      <div className="flex flex-col gap-4">
        <Input id="email" label="Email" type="email" placeholder="you@example.com"
          value={email} onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onSubmit()} />
        <Input id="password" label="Password" type="password" placeholder="••••••••"
          value={password} onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onSubmit()} />

        {error && <p className="text-sm text-rose">{error}</p>}

        <Button onClick={onSubmit} disabled={busy} className="w-full">
          {busy ? "Logging in…" : "Log in"}
        </Button>
      </div>

      <p className="mt-3 text-center text-sm">
        <Link href="/forgot-password" className="text-white/50 hover:text-white">
          Forgot password?
        </Link>
      </p>
      <p className="mt-4 text-center text-sm text-white/50">
        New here?{" "}
        <Link href="/register" className="text-cyan hover:underline">Create an account</Link>
      </p>
    </div>
  );
}
