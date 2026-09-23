import { Sparkles } from "lucide-react";

export function ComingSoon({ title, note }: { title: string; note?: string }) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 md:px-8">
      <h1 className="mb-8 text-2xl font-bold tracking-tight text-white sm:text-[26px]">{title}</h1>
      <div className="flex flex-col items-center rounded-2xl border border-white/5 bg-white/[0.02] py-20 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-cyan/15 bg-cyan/5">
          <Sparkles size={26} className="text-cyan" />
        </div>
        <h3 className="text-base font-semibold text-white">Coming soon</h3>
        <p className="mx-auto mt-1 max-w-xs text-sm text-white/40">
          {note ?? "This section is being built out as the platform grows."}
        </p>
      </div>
    </div>
  );
}
