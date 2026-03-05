import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./modules/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: {
          DEFAULT: "#F8FAFC",
          paper: "#FFFFFF",
          input: "#F1F5F9",
          subtle: "#F8FAFC",
          hover: "#F1F5F9",
        },
        foreground: "#1E293B",
        primary: {
          50: "#F3E8FF",
          100: "#E9D5FF",
          200: "#D8B4FE",
          300: "#C084FC",
          400: "#A855F7",
          500: "#47006C",
          600: "#35024F",
          700: "#2D003F",
          800: "#1E0033",
          900: "#140024",
        },
        secondary: {
          50: "#ECFEFF",
          100: "#CFFAFE",
          200: "#A5F3FC",
          300: "#67E8F9",
          400: "#22D3EE",
          500: "#81E1F5",
          600: "#5DD5F0",
          700: "#0E7490",
          800: "#155E75",
          900: "#164E63",
        },
        text: {
          primary: "#1E293B",
          secondary: "#475569",
          muted: "#64748B",
          disabled: "#94A3B8",
        },
        border: {
          light: "#E2E8F0",
          DEFAULT: "#CBD5E1",
          dark: "#94A3B8",
        },
        success: {
          DEFAULT: "#10B981",
          light: "#6EE7B7",
          dark: "#047857",
        },
        warning: {
          DEFAULT: "#FBBF24",
          light: "#FCD34D",
          dark: "#D97706",
        },
        error: {
          DEFAULT: "#DC2626",
          light: "#FCA5A5",
          dark: "#991B1B",
        },
        info: {
          DEFAULT: "#81E1F5",
          light: "#A5F3FC",
          dark: "#0E7490",
        },
      },
    },
  },
  plugins: [],
};

export default config;
