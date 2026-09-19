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
          "line-strong": "rgb(var(--soj-line-strong) / <alpha-value>)",
          text: "rgb(var(--soj-text) / <alpha-value>)",
          muted: "rgb(var(--soj-text-muted) / <alpha-value>)",
          faint: "rgb(var(--soj-text-faint) / <alpha-value>)",
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
        "soj-xl": "10px",
      },
      fontFamily: {
        // 展示字：标题、大数字、品牌字。中文没有 Web 字体，靠系统字体接管，
        // 但字重与字距按展示字调过，见 globals.css 的 .soj-display。
        display: [
          "var(--font-soj-display)",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "PingFang SC",
          "Hiragino Sans GB",
          "Microsoft YaHei",
          "Noto Sans SC",
          "sans-serif",
        ],
        sans: [
          "var(--font-soj-sans)",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "PingFang SC",
          "Hiragino Sans GB",
          "Microsoft YaHei",
          "Noto Sans SC",
          "sans-serif",
        ],
        mono: ["var(--font-soj-mono)", "ui-monospace", "SFMono-Regular", "SF Mono", "Menlo", "monospace"],
      },
    },
  },
};

export default config;
