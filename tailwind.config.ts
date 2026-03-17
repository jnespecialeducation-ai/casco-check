import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#0F172A",
          light: "#1e293b",
          dark: "#020617",
        },
        secondary: {
          DEFAULT: "#64748b",
          light: "#94a3b8",
          dark: "#475569",
        },
        accent: {
          DEFAULT: "#f97316",
          light: "#fb923c",
          dark: "#ea580c",
        },
        accentBlue: {
          DEFAULT: "#2563eb",
          light: "#3b82f6",
          dark: "#1d4ed8",
        },
        success: "#22c55e",
        warning: "#f59e0b",
        error: "#ef4444",
        surface: "#f8fafc",
      },
      fontFamily: {
        sans: ["var(--font-noto-sans)", "system-ui", "sans-serif"],
      },
      fontSize: {
        "display": ["2rem", { lineHeight: "1.2", fontWeight: "700" }],
        "title": ["1.25rem", { lineHeight: "1.4", fontWeight: "600" }],
        "body": ["1rem", { lineHeight: "1.6" }],
        "caption": ["0.875rem", { lineHeight: "1.5" }],
      },
      spacing: {
        "18": "4.5rem",
        "22": "5.5rem",
        "30": "7.5rem",
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
      },
      boxShadow: {
        "card": "0 1px 3px 0 rgb(0 0 0 / 0.05), 0 1px 2px -1px rgb(0 0 0 / 0.05)",
        "card-hover": "0 4px 6px -1px rgb(0 0 0 / 0.08), 0 2px 4px -2px rgb(0 0 0 / 0.05)",
        "elevated": "0 10px 15px -3px rgb(0 0 0 / 0.08), 0 4px 6px -4px rgb(0 0 0 / 0.05)",
      },
      animation: {
        "in": "in 0.2s ease-out",
        "fade-in": "fadeIn 0.3s ease-out",
      },
      keyframes: {
        in: {
          "0%": { opacity: "0", transform: "scale(0.98)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
