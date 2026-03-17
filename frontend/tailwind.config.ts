import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#07111F",
        mist: "#E6F5F3",
        mint: "#A4F0DD",
        cyan: "#3AC7C2",
        coral: "#FF8E72"
      },
      boxShadow: {
        panel: "0 24px 80px rgba(7, 17, 31, 0.18)"
      }
    }
  },
  plugins: []
};

export default config;

