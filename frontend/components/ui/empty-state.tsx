import type { LucideIcon } from "lucide-react";

export function EmptyState({ icon: Icon, title, subtitle, action }: {
  icon: LucideIcon; title: string; subtitle?: string; action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center py-20 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03]">
        <Icon size={26} className="text-white/40" />
      </div>
      <h3 className="text-base font-semibold text-white">{title}</h3>
      {subtitle && <p className="mt-1 max-w-xs text-sm text-white/40">{subtitle}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function PageHeader({ icon: Icon, title, tint = "text-cyan", action }: {
  icon: LucideIcon; title: string; tint?: string; action?: React.ReactNode;
}) {
  return (
    <div className="mb-8 flex items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/5 bg-white/[0.04]">
          <Icon size={22} className={tint} />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-white sm:text-[26px]">{title}</h1>
      </div>
      {action}
    </div>
  );
}
