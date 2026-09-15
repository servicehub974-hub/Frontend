"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/providers/auth-provider";
import { Button } from "@/components/ui/button";

function VerifyInner() {
  const params = useSearchParams();
  const token = params.get("token");
  const { refreshUser } = useAuth();
  const [state, setState] = useState<"loading" | "ok" | "error">("loading");
  const [message, setMessage] = useState("");
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    if (!token) {
      setState("error");
      setMessage("Missing verification link.");
      return;
    }
    api("/api/auth/verify-email", { method: "POST", json: { token } })
      .then(async () => {
        setState("ok");
        try {
          await refreshUser();
        } catch {
          /* ignore */
        }
      })
      .catch((e) => {
        setState("error");
        setMessage(e instanceof Error ? e.message : "Verification failed.");
      });
  }, [token, refreshUser]);

  if (state === "loading") {
    return <p className="text-sm text-white/60">Verifying your email…</p>;
  }

  if (state === "ok") {
    return (
      <div>
        <h1 className="mb-2 text-2xl font-bold tracking-tight text-white">
          Email verified ✓
        </h1>
        <p className="mb-6 text-sm text-white/50">
          Your account is fully activated.
        </p>
        <Link href="/">
          <Button className="w-full">Go to NEXUS</Button>
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold tracking-tight text-white">
        Verification failed
      </h1>
      <p className="mb-6 text-sm text-rose">{message}</p>
      <Link href="/">
        <Button variant="glass" className="w-full">
          Back to home
        </Button>
      </Link>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<p className="text-sm text-white/60">Loading…</p>}>
      <VerifyInner />
    </Suspense>
  );
}
