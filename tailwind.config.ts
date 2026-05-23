import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  "#f0fdf4",
          100: "#dcfce7",
          200: "#bbf7d0",
          300: "#86efac",
          400: "#4ade80",
          500: "#2ECC71", // Verde basilico principale
          600: "#16a34a",
          700: "#15803d",
          800: "#166534",
          900: "#14532d",
        },
        dark: {
          900: "#111827", // Nero carbone
          800: "#1f2937",
          700: "#374151",
          600: "#4b5563",
        },
        level: {
          bronzo:   "#cd7f32",
          argento:  "#c0c0c0",
          oro:      "#ffd700",
          platino:  "#e5e4e2",
          diamante: "#b9f2ff",
        },
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "monospace"],
      },
      animation: {
        "fade-in":     "fadeIn 0.3s ease-out",
        "slide-up":    "slideUp 0.4s ease-out",
        "pulse-green": "pulseGreen 1.5s ease-in-out infinite",
      },
      keyframes: {
        fadeIn:     { from: { opacity: "0" }, to: { opacity: "1" } },
        slideUp:    { from: { opacity: "0", transform: "translateY(16px)" }, to: { opacity: "1", transform: "translateY(0)" } },
        pulseGreen: { "0%, 100%": { boxShadow: "0 0 0 0 rgba(46,204,113,0.4)" }, "50%": { boxShadow: "0 0 0 12px rgba(46,204,113,0)" } },
      },
    },
  },
  plugins: [],
};
export default config;
