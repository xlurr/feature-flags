import type { Config } from "tailwindcss";

export default {
  darkMode: "class",
  content: [
    "./client/index.html",
    "./client/src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      borderRadius: {
        sm:   "0.125rem",
        md:   "0.25rem",
        lg:   "0.375rem",
        xl:   "0.5rem",
        full: "9999px",
      },
      colors: {
        background: "hsl(var(--background) / <alpha-value>)",
        foreground: "hsl(var(--foreground) / <alpha-value>)",
        border:     "hsl(var(--border)     / <alpha-value>)",
        input:      "hsl(var(--input)      / <alpha-value>)",
        card: {
          DEFAULT:    "hsl(var(--card)            / <alpha-value>)",
          foreground: "hsl(var(--card-foreground) / <alpha-value>)",
          border:     "hsl(var(--card-border)     / <alpha-value>)",
        },
        topnav: {
          DEFAULT:    "hsl(var(--topnav)            / <alpha-value>)",
          foreground: "hsl(var(--topnav-foreground) / <alpha-value>)",
          border:     "hsl(var(--topnav-border)     / <alpha-value>)",
          muted:      "hsl(var(--topnav-muted)      / <alpha-value>)",
          hover:      "hsl(var(--topnav-hover)      / <alpha-value>)",
        },
        popover: {
          DEFAULT:    "hsl(var(--popover)            / <alpha-value>)",
          foreground: "hsl(var(--popover-foreground) / <alpha-value>)",
          border:     "hsl(var(--popover-border)     / <alpha-value>)",
        },
        primary: {
          DEFAULT:    "hsl(var(--primary)            / <alpha-value>)",
          foreground: "hsl(var(--primary-foreground) / <alpha-value>)",
        },
        secondary: {
          DEFAULT:    "hsl(var(--secondary)            / <alpha-value>)",
          foreground: "hsl(var(--secondary-foreground) / <alpha-value>)",
        },
        muted: {
          DEFAULT:    "hsl(var(--muted)            / <alpha-value>)",
          foreground: "hsl(var(--muted-foreground) / <alpha-value>)",
        },
        accent: {
          DEFAULT:    "hsl(var(--accent)            / <alpha-value>)",
          foreground: "hsl(var(--accent-foreground) / <alpha-value>)",
        },
        destructive: {
          DEFAULT:    "hsl(var(--destructive)            / <alpha-value>)",
          foreground: "hsl(var(--destructive-foreground) / <alpha-value>)",
        },
        ring: "hsl(var(--ring) / <alpha-value>)",
        sidebar: {
          DEFAULT:    "hsl(var(--sidebar)            / <alpha-value>)",
          foreground: "hsl(var(--sidebar-foreground) / <alpha-value>)",
          border:     "hsl(var(--sidebar-border)     / <alpha-value>)",
          primary: {
            DEFAULT:    "hsl(var(--sidebar-primary)            / <alpha-value>)",
            foreground: "hsl(var(--sidebar-primary-foreground) / <alpha-value>)",
          },
          accent: {
            DEFAULT:    "hsl(var(--sidebar-accent)            / <alpha-value>)",
            foreground: "hsl(var(--sidebar-accent-foreground) / <alpha-value>)",
          },
          ring: "hsl(var(--sidebar-ring) / <alpha-value>)",
        },
        chart: {
          "1": "hsl(var(--chart-1) / <alpha-value>)",
          "2": "hsl(var(--chart-2) / <alpha-value>)",
          "3": "hsl(var(--chart-3) / <alpha-value>)",
          "4": "hsl(var(--chart-4) / <alpha-value>)",
          "5": "hsl(var(--chart-5) / <alpha-value>)",
        },
        status: {
          online:  "rgb(34  197  94)",
          stale:   "rgb(234 179   8)",
          busy:    "rgb(239  68  68)",
          offline: "rgb(156 163 175)",
        },
      },
      fontFamily: {
        sans:  ["var(--font-sans)"],
        serif: ["var(--font-serif)"],
        mono:  ["var(--font-mono)"],
      },
      fontSize: {
        "10px": ["0.625rem",  { lineHeight: "1.2" }],
        "11px": ["0.6875rem", { lineHeight: "1.2" }],
        "13px": ["0.8125rem", { lineHeight: "1.3" }],
      },
      spacing: {
        "11px": "0.6875rem",
        "13px": "0.8125rem",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to:   { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to:   { height: "0" },
        },
        shimmer: {
          "0%":   { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition:  "200% 0" },
        },
        "sse-pulse": {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(34,197,94,0.4)" },
          "50%":      { boxShadow: "0 0 0 4px rgba(34,197,94,0)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.15s ease-out",
        "accordion-up":   "accordion-up   0.15s ease-out",
        shimmer:           "shimmer 1.5s ease-in-out infinite",
        "sse-pulse":       "sse-pulse 2s ease-in-out infinite",
      },
    },
  },
  plugins: [
    require("tailwindcss-animate"),
    require("@tailwindcss/typography"),
  ],
} satisfies Config;
