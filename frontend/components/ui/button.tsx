import { forwardRef } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "glass" | "ghost" | "violet";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const base =
  "inline-flex items-center justify-center gap-2 rounded-full font-semibold " +
  "transition-all duration-300 active:scale-95 disabled:opacity-40 disabled:pointer-events-none " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40";

const variants: Record<Variant, string> = {
  // Solid white — primary call to action (Stream Now, etc.)
  primary:
    "bg-white text-black shadow-glow hover:shadow-glow-cyan hover:-translate-y-0.5 hover:bg-cyan-50",
  // Frosted glass — secondary action
  glass:
    "glass-pill text-white hover:bg-white/10",
  // Minimal — icon buttons, low emphasis
  ghost:
    "text-white/70 hover:text-white hover:bg-white/10",
  // Accent — premium / VIP flows
  violet:
    "bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-glow-violet hover:-translate-y-0.5",
};

const sizes: Record<Size, string> = {
  sm: "px-4 py-1.5 text-[13px]",
  md: "px-6 py-2.5 text-sm",
  lg: "px-8 py-3.5 text-base",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => (
    <button
      ref={ref}
      className={cn(base, variants[variant], sizes[size], className)}
      {...props}
    />
  )
);

Button.displayName = "Button";
