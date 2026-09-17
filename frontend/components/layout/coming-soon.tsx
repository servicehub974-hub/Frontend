import { Sparkles } from "lucide-react";

export function ComingSoon({ title, note }: { title: string; note?: string }) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 md:px-8 md:py-16">
      <div className="glass-panel rounded-xl p-8 text-center sm:p-12">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-white/10 bg-white/5">
          <Sparkles size={24} className="text-cyan" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-white">{title}</h1>
        <p className="mx-auto mt-2 max-w-md text-sm text-white/50">
          {note ?? "This section is coming soon as we build out the platform."}
        </p>
      </div>
    </div>
  );
}
