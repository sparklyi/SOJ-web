import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./features/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        soj: {
          bg: "rgb(var(--soj-bg) / <alpha-value>)",
          "bg-raised": "rgb(var(--soj-bg-raised) / <alpha-value>)",
          surface: "rgb(var(--soj-surface) / <alpha-value>)",
          "surface-2": "rgb(var(--soj-surface-2) / <alpha-value>)",
          line: "rgb(var(--soj-line) / <alpha-value>)",
          text: "rgb(var(--soj-text) / <alpha-value>)",
          muted: "rgb(var(--soj-text-muted) / <alpha-value>)",
          accent: "rgb(var(--soj-accent) / <alpha-value>)",
          success: "rgb(var(--soj-success) / <alpha-value>)",
          warning: "rgb(var(--soj-warning) / <alpha-value>)",
          danger: "rgb(var(--soj-danger) / <alpha-value>)",
          info: "rgb(var(--soj-info) / <alpha-value>)",
        },
      },
      borderRadius: {
        "soj-sm": "4px",
        "soj-md": "6px",
        "soj-lg": "8px",
      },
      fontFamily: {
        sans: ["var(--font-soj-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["var(--font-soj-mono)", "ui-monospace", "SFMono-Regular", "monospace"],
      },
    },
  },
};

export default config;
