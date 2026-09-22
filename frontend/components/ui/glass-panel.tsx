import { cn } from "@/lib/utils";

interface GlassPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Adds hover-lift + border glow — use for interactive cards. */
  interactive?: boolean;
}

/**
 * Frosted surface used for cards, popovers, side sheets.
 * Backdrop-blur + subtle border, matching the theme.
 */
export function GlassPanel({
  className,
  interactive = false,
  ...props
}: GlassPanelProps) {
  return (
    <div
      className={cn(
        "glass-panel rounded-xl",
        interactive &&
          "transition-all duration-500 hover:border-strong hover:shadow-[0_10px_40px_-10px_rgba(0,0,0,0.8)]",
        className
      )}
      {...props}
    />
  );
}

/** Small rounded pill used for badges, tags, meta chips. */
export function Pill({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "glass-pill inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-medium text-white/90",
        className
      )}
      {...props}
    />
  );
}
