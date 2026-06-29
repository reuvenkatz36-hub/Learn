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
        background: "var(--background)",
        foreground: "var(--foreground)",
        // Light "warm paper" base
        paper: "#FAFAF8",
        surface: "#FFFFFF",
        ink: "#1C1B1A",
        "ink-soft": "#6B6864",
        "ink-faint": "#9C9892",
        line: "#ECEAE4",
        // Crew signature accents (one per character)
        crew: {
          fox: "#FF6B5E",
          owl: "#5B6CFF",
          cat: "#8B5CF6",
          beaver: "#F5A524",
          dog: "#22B07D",
          elephant: "#3BA9E0",
        },
      },
      keyframes: {
        "crew-bob": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-5px)" },
        },
        "crew-blink": {
          "0%, 92%, 100%": { transform: "scaleY(1)" },
          "96%": { transform: "scaleY(0.1)" },
        },
      },
      animation: {
        "crew-bob": "crew-bob 3.2s ease-in-out infinite",
      },
      boxShadow: {
        soft: "0 1px 2px rgba(28,27,26,0.04), 0 6px 16px -6px rgba(28,27,26,0.10)",
        lift: "0 2px 4px rgba(28,27,26,0.05), 0 14px 30px -10px rgba(28,27,26,0.16)",
      },
      backgroundImage: {
        // Regal brand gradient for Principal Hoot / logo / hero moments
        "brand-regal": "linear-gradient(135deg, #4F46E5 0%, #6D28D9 60%, #E9B84A 140%)",
        "hero-glow": "radial-gradient(60% 50% at 50% 35%, rgba(79,70,229,0.10), transparent 70%)",
      },
      typography: {
        invert: {
          css: {
            '--tw-prose-body': '#d1d5db',
            '--tw-prose-headings': '#f9fafb',
            '--tw-prose-code': '#c4b5fd',
            '--tw-prose-pre-bg': '#111827',
          },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
};
export default config;
