import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx}",
    "./src/components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        surface: {
          primary: 'var(--a-surface-primary)',
          secondary: 'var(--a-surface-secondary)',
          tertiary: 'var(--a-surface-tertiary)',
          elevated: 'var(--a-surface-elevated)',
        },
        border: {
          primary: 'var(--a-border-primary)',
          secondary: 'var(--a-border-secondary)',
        },
        text: {
          primary: 'var(--a-text-primary)',
          secondary: 'var(--a-text-secondary)',
          tertiary: 'var(--a-text-tertiary)',
          quaternary: 'var(--a-text-quaternary)',
        },
        accent: {
          DEFAULT: 'var(--a-accent)',
          hover: 'var(--a-accent-hover)',
          light: 'var(--a-accent-light)',
          text: 'var(--a-accent-text)',
        },
        gauge: {
          track: 'var(--a-gauge-track)',
        },
        status: {
          success: '#16a34a',
          error: '#dc2626',
          warning: '#f59e0b',
        },
      },
    },
  },
  plugins: [],
};

export default config;
