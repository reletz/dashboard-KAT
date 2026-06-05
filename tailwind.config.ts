import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // KAT ITB 2026 · OSKM forest palette (diambil dari brand asesmen)
        mint: {
          DEFAULT: "#C7FFE4", // background utama
          deep: "#8AF4CA", // teks label / aksen lembut
        },
        forest: {
          900: "#0E2038", // navy paling gelap
          800: "#182F53", // card navy
          700: "#1B567D", // biru menengah
          600: "#317890", // border teal
        },
        leaf: {
          DEFAULT: "#49DEA7", // aksen hijau utama
          bright: "#60E3C5", // hover
          button: "#33C5AF", // tombol
        },
        cream: "#FFF3B8", // heading kuning krem
      },
      fontFamily: {
        sans: ["Geom", "system-ui", "sans-serif"],
        display: ["Redzone", "Geom", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "monospace"],
      },
      borderRadius: {
        "4xl": "2rem",
      },
      boxShadow: {
        glass: "0 20px 50px -12px rgba(14, 32, 56, 0.55)",
        "leaf-glow": "0 0 0 3px rgba(73, 222, 167, 0.25)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        sway: {
          "0%, 100%": { transform: "rotate(-2deg)" },
          "50%": { transform: "rotate(2deg)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.6s cubic-bezier(0.22, 1, 0.36, 1) both",
        "fade-in": "fade-in 0.8s ease-out both",
        sway: "sway 6s ease-in-out infinite",
        float: "float 7s ease-in-out infinite",
      },
    },
  },
  plugins: [],
} satisfies Config;
