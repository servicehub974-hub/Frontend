"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/auth-provider";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({
    display_name: "",
    username: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const onSubmit = async () => {
    setError(null);
    setBusy(true);
    try {
      await register({
        email: form.email.trim(),
        username: form.username.trim(),
        password: form.password,
        display_name: form.display_name.trim() || undefined,
      });
      router.push("/");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Registration failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold tracking-tight text-white">
        Create your account
      </h1>
      <p className="mb-6 text-sm text-white/50">Join the universe.</p>

      <div className="flex flex-col gap-4">
        <Input id="display_name" label="Display name" placeholder="Jane Doe" value={form.display_name} onChange={set("display_name")} />
        <Input id="username" label="Username" placeholder="janedoe" value={form.username} onChange={set("username")} />
        <Input id="email" label="Email" type="email" placeholder="you@example.com" value={form.email} onChange={set("email")} />
        <Input
          id="password"
          label="Password"
          type="password"
          placeholder="At least 8 characters"
          value={form.password}
          onChange={set("password")}
          onKeyDown={(e) => e.key === "Enter" && onSubmit()}
        />

        {error && <p className="text-sm text-rose">{error}</p>}

        <Button onClick={onSubmit} disabled={busy} className="w-full">
          {busy ? "Creating…" : "Create account"}
        </Button>
      </div>

      <p className="mt-6 text-center text-sm text-white/50">
        Already have an account?{" "}
        <Link href="/login" className="text-cyan hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
}
