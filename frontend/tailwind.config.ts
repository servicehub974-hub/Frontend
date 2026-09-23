import type { Config } from "tailwindcss";

/**
 * Tailwind is wired to the CSS variables in app/globals.css so the whole
 * theme stays token-driven. Use classes like `bg-surface`, `text-secondary`,
 * `border-subtle`, `text-cyan`, `rounded-xl` everywhere instead of raw hex.
 */
const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./features/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        deep: "var(--bg-deep)",
        surface: "var(--bg-surface)",
        elevated: "var(--bg-elevated)",
        // text
        primary: "var(--text-primary)",
        secondary: "var(--text-secondary)",
        muted: "var(--text-muted)",
        // accents (rgb channels → support opacity modifiers)
        gold: "rgb(var(--gold-rgb) / <alpha-value>)",
        violet: "rgb(var(--violet-rgb) / <alpha-value>)",
        cyan: "rgb(var(--cyan-rgb) / <alpha-value>)",
        rose: "rgb(var(--rose-rgb) / <alpha-value>)",
        fuchsia: "rgb(var(--fuchsia-rgb) / <alpha-value>)",
      },
      borderColor: {
        subtle: "var(--border-subtle)",
        strong: "var(--border-strong)",
      },
      borderRadius: {
        sm: "var(--radius-sm)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
        xl: "var(--radius-xl)",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      transitionTimingFunction: {
        cinematic: "cubic-bezier(0.16, 1, 0.3, 1)",
      },
      boxShadow: {
        glow: "0 0 20px rgba(255,255,255,0.15)",
        "glow-cyan": "0 0 25px rgba(6,182,212,0.35)",
        "glow-violet": "0 0 25px rgba(139,92,246,0.35)",
        "glow-gold": "0 0 20px rgba(245,166,35,0.4)",
      },
      keyframes: {
        spin: {
          to: { transform: "rotate(360deg)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
