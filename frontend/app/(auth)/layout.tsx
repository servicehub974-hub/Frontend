import Link from "next/link";
import { Zap } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <Link href="/" className="mb-8 flex items-center justify-center gap-2.5">
          <div className="relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-lg border border-white/10 bg-black">
            <div className="absolute inset-0 bg-gradient-to-br from-violet-600 to-cyan-500 opacity-40" />
            <Zap size={18} className="relative z-10 fill-white text-white" />
          </div>
          <span className="text-2xl font-bold tracking-tighter text-white">
            NEXUS<span className="font-light text-white/30">PRO</span>
          </span>
        </Link>

        <div className="glass-panel rounded-xl p-6 sm:p-8">{children}</div>
      </div>
    </div>
  );
}
