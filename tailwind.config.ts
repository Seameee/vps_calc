import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        glass: {
          primary: "rgba(255, 255, 255, 0.05)",
          "primary-dark": "rgba(10, 10, 20, 0.65)",
          secondary: "rgba(20, 20, 35, 0.50)",
          tertiary: "rgba(255, 255, 255, 0.08)",
        },
        text: {
          primary: "rgba(255, 255, 255, 0.95)",
          secondary: "rgba(255, 255, 255, 0.70)",
          tertiary: "rgba(255, 255, 255, 0.50)",
        },
        border: {
          subtle: "rgba(255, 255, 255, 0.12)",
          focus: "rgba(255, 255, 255, 0.35)",
        },
        accent: {
          primary: "#60a5fa",
          secondary: "#a78bfa",
        },
        status: {
          success: "#34d399",
          warning: "#fbbf24",
          error: "#f87171",
        },
      },
      borderRadius: {
        glass: "24px",
        "glass-sm": "16px",
        "glass-input": "12px",
      },
      fontFamily: {
        sans: [
          "'Inter'",
          "'Noto Sans SC'",
          "-apple-system",
          "BlinkMacSystemFont",
          "'Segoe UI'",
          "'PingFang SC'",
          "'Microsoft YaHei'",
          "sans-serif",
        ],
        mono: [
          "'JetBrains Mono'",
          "'Fira Code'",
          "'Cascadia Code'",
          "Consolas",
          "monospace",
        ],
      },
      keyframes: {
        "fade-in-up": {
          "0%": {
            opacity: "0",
            transform: "translateY(20px)",
          },
          "100%": {
            opacity: "1",
            transform: "translateY(0)",
          },
        },
        "scale-bounce": {
          "0%": { transform: "scale(0.95)" },
          "50%": { transform: "scale(1.02)" },
          "100%": { transform: "scale(1)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      animation: {
        "fade-in-up": "fade-in-up 0.6s cubic-bezier(0.4, 0, 0.2, 1) forwards",
        "scale-bounce": "scale-bounce 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)",
        shimmer: "shimmer 1.5s infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
