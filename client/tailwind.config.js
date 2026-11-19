/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: "#09090b", // Pure dark obsidian / zinc-950 canvas (no navy tint)
          deep: "#000000",    // Deep black terminal/code background
          surface: "#111113", // Elevated panel surface
          soft: "#18181b",    // Elevated card background (zinc-900)
          sub: "#0c0c0e",     // Sub-panel / nested background
          hover: "#222226",   // Subtle interactive hover state
        },
        ink: {
          DEFAULT: "#fafafa", // Zinc-50 high-contrast primary
          muted: "#a1a1aa",   // Zinc-400 secondary text
          dim: "#71717a",     // Zinc-500 labels / hints
          faint: "#52525b",   // Zinc-600 captions / inactive
        },
        rule: {
          DEFAULT: "#27272a", // Zinc-800 border
          soft: "#1c1c1f",
          subtle: "rgba(255, 255, 255, 0.08)",
          light: "rgba(255, 255, 255, 0.15)",
        },
        ruleSoft: "#1c1c1f",
        accent: {
          DEFAULT: "#ffffff", // Pure high-contrast white accent
          strong: "#f4f4f5",  // Zinc-100
          soft: "#e4e4e7",    // Zinc-200
          glow: "rgba(255, 255, 255, 0.08)",
          subtle: "rgba(255, 255, 255, 0.04)",
        },
        brand: {
          purple: "#d4d4d8",  // Clean neutral zinc
          violet: "#e4e4e7",
          emerald: "#34d399",
        },
        good: "#10b981",      // Emerald-500
        bad: "#f87171",       // Red-400
        warning: "#fbbf24",   // Amber-400
      },
      fontFamily: {
        sans: [
          '"Inter"',
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
        mono: [
          '"JetBrains Mono"',
          '"IBM Plex Mono"',
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "monospace",
        ],
        serif: [
          '"Inter"',
          "sans-serif",
        ],
      },
      letterSpacing: {
        wider2: "0.08em",
      },
      boxShadow: {
        glow: "0 0 25px -5px rgba(255, 255, 255, 0.08)",
        "glow-sm": "0 1px 3px 0 rgba(0, 0, 0, 0.4), 0 1px 2px -1px rgba(0, 0, 0, 0.4)",
        card: "0 4px 20px -2px rgba(0, 0, 0, 0.5), 0 2px 6px -1px rgba(0, 0, 0, 0.4)",
      },
      keyframes: {
        caret: {
          "0%, 49%": { opacity: "1" },
          "50%, 100%": { opacity: "0" },
        },
        pulseDot: {
          "0%, 100%": { opacity: "0.2" },
          "50%": { opacity: "1" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
      },
      animation: {
        caret: "caret 1.05s step-end infinite",
        "pulse-dot": "pulseDot 1.2s ease-in-out infinite",
        shimmer: "shimmer 2s infinite",
      },
    },
  },
  plugins: [],
};
