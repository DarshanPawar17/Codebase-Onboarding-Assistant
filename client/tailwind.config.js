/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: "#090d16", // Slate-charcoal deep canvas
          deep: "#05070b",    // Terminal/code background
          surface: "#0e131f", // Elevated panel surface
          soft: "#141c2c",    // Card background
          sub: "#0c101a",     // Nested pane background
          hover: "#1a2438",   // Subtle interactive hover
        },
        ink: {
          DEFAULT: "#f1f5f9", // Slate-100 high-contrast primary
          muted: "#94a3b8",   // Slate-400 secondary text
          dim: "#64748b",     // Slate-500 labels / hints
          faint: "#475569",   // Slate-600 captions / inactive
        },
        rule: {
          DEFAULT: "#1e293b", // Slate-800 border
          soft: "#131b2a",
          subtle: "rgba(255, 255, 255, 0.08)",
          light: "rgba(255, 255, 255, 0.15)",
        },
        ruleSoft: "#131b2a",
        accent: {
          DEFAULT: "#38bdf8", // Sky-400 vivid electric cyan
          strong: "#0284c7",  // Sky-600
          soft: "#7dd3fc",    // Sky-300
          glow: "rgba(56, 189, 248, 0.18)",
          subtle: "rgba(56, 189, 248, 0.08)",
        },
        brand: {
          purple: "#818cf8",  // Indigo-400
          violet: "#a78bfa",  // Violet-400
          emerald: "#34d399", // Emerald-400
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
        glow: "0 0 25px -5px rgba(56, 189, 248, 0.25)",
        "glow-sm": "0 0 15px -3px rgba(56, 189, 248, 0.2)",
        card: "0 10px 30px -10px rgba(0, 0, 0, 0.5)",
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
