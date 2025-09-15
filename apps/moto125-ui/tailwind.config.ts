import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#d08813ff",
        text: "#747474",
        heading: "#000000",
        border: "#e6e6e6",
      },
      fontFamily: {
        heading: ["system-ui", "sans-serif"],
        body: ["Lato", "system-ui", "sans-serif"],
      },
      maxWidth: {
        page: "1200px",
        content: "72ch",
      },
      boxShadow: {
        sm: "0 1px 2px rgba(0,0,0,.05)",
        md: "0 2px 8px rgba(0,0,0,.08)",
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};
export default config;
