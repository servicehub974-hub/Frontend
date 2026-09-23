"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error); }, [error]);
  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-20 text-center">
      <AlertTriangle size={40} className="mb-4 text-gold" />
      <h1 className="text-xl font-bold text-white">Something went wrong</h1>
      <p className="mt-2 text-sm text-white/50">This section hit an unexpected error. You can try again — the rest of the app is fine.</p>
      <button onClick={reset} className="mt-6 flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-black hover:bg-white/90">
        <RefreshCw size={16} /> Try again
      </button>
    </div>
  );
}
