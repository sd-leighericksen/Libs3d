import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", "Inter", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      colors: {
        ink: "#0a0a0a",
        canvas: "#ffffff",
        "canvas-inverse": "#0a0a0a",
        "surface-soft": "#f5f5f3",
        hairline: "#e6e6e3",
        "hairline-soft": "#efefec",
        // Driven by --accent-rgb (set from Settings.accentColor in the root
        // layout). RGB channels + <alpha-value> so /opacity modifiers still work.
        "accent-magenta": "rgb(var(--accent-rgb) / <alpha-value>)",
        success: "#13a05a",
        "block-lime": "#d9f24a",
        "block-lilac": "#d7c8ff",
        "block-cream": "#f6efdf",
        "block-mint": "#c7eedb",
        "block-pink": "#ffd1d9",
        "block-coral": "#ff8a6c",
        "block-navy": "#1a1b4b",
      },
      borderRadius: {
        xs: "2px",
        sm: "6px",
        md: "8px",
        lg: "24px",
        xl: "32px",
        pill: "50px",
      },
      spacing: {
        hair: "1px",
        xxs: "4px",
        xs: "8px",
        sm: "12px",
        md: "16px",
        lg: "24px",
        xl: "32px",
        xxl: "48px",
        section: "96px",
      },
      fontSize: {
        "display-xl": ["86px", { lineHeight: "1.00", letterSpacing: "-1.72px", fontWeight: "340" }],
        "display-lg": ["64px", { lineHeight: "1.10", letterSpacing: "-0.96px", fontWeight: "340" }],
        headline: ["26px", { lineHeight: "1.35", letterSpacing: "-0.26px", fontWeight: "540" }],
        subhead: ["26px", { lineHeight: "1.35", letterSpacing: "-0.26px", fontWeight: "340" }],
        "card-title": ["24px", { lineHeight: "1.45", letterSpacing: "0", fontWeight: "700" }],
        "body-lg": ["20px", { lineHeight: "1.40", letterSpacing: "-0.14px", fontWeight: "330" }],
        body: ["18px", { lineHeight: "1.45", letterSpacing: "-0.26px", fontWeight: "400" }],
        "body-sm": ["16px", { lineHeight: "1.45", letterSpacing: "-0.14px", fontWeight: "330" }],
        link: ["20px", { lineHeight: "1.40", letterSpacing: "-0.10px", fontWeight: "480" }],
        button: ["20px", { lineHeight: "1.40", letterSpacing: "-0.10px", fontWeight: "480" }],
        eyebrow: ["18px", { lineHeight: "1.30", letterSpacing: "0.54px", fontWeight: "400" }],
        caption: ["12px", { lineHeight: "1.00", letterSpacing: "0.60px", fontWeight: "400" }],
      },
      maxWidth: {
        content: "1280px",
      },
    },
  },
  plugins: [],
} satisfies Config;
