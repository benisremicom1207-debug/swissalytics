import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["selector", 'html[data-dark="true"]'],
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx}",
    "./src/components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", "Inter Tight", "Helvetica Neue", "Helvetica", "Arial", "sans-serif"],
        mono: ["var(--font-mono)", "JetBrains Mono", "ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
        serif: ["var(--font-serif)", "Fraunces", "Georgia", "Times New Roman", "serif"],
      },
      colors: {
        // Token-driven so dark mode flips automatically
        cream:    {
          DEFAULT: "var(--sa-cream)",
          2: "var(--sa-cream-2)",
          3: "var(--sa-cream-3)",
        },
        ink:      {
          DEFAULT: "var(--sa-ink)",
          2: "var(--sa-ink-2)",
          3: "var(--sa-ink-3)",
          4: "var(--sa-ink-4)",
        },
        rule:     "var(--sa-rule)",
        "sa-red": { DEFAULT: "var(--sa-red)", ink: "var(--sa-red-ink)" },
        "sa-ok":  "var(--sa-ok)",
        "sa-warn":"var(--sa-warn)",
        "sa-err": "var(--sa-err)",

        // legacy-compatible tokens
        surface: {
          primary:   "var(--a-surface-primary)",
          secondary: "var(--a-surface-secondary)",
          tertiary:  "var(--a-surface-tertiary)",
          elevated:  "var(--a-surface-elevated)",
        },
        border: {
          primary:   "var(--a-border-primary)",
          secondary: "var(--a-border-secondary)",
        },
        text: {
          primary:    "var(--a-text-primary)",
          secondary:  "var(--a-text-secondary)",
          tertiary:   "var(--a-text-tertiary)",
          quaternary: "var(--a-text-quaternary)",
        },
        accent: {
          DEFAULT: "var(--a-accent)",
          hover:   "var(--a-accent-hover)",
          light:   "var(--a-accent-light)",
          text:    "var(--a-accent-text)",
        },
        gauge: { track: "var(--a-gauge-track)" },
        status: { success: "var(--sa-ok)", error: "var(--sa-err)", warning: "var(--sa-warn)" },
      },
      letterSpacing: { "tight-2": "-0.02em", "tight-3": "-0.03em", "tight-4": "-0.04em" },
      borderRadius: { none: "0", xs: "2px" },
    },
  },
  plugins: [],
};

export default config;
