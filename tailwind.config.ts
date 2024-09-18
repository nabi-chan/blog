import type { Config } from "tailwindcss"

const config: Config = {
  content: ["./src/**/*.{ts,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        background: "#F2F4F7",
        backgroundHover: "#D9DBDE",
      },
      borderWidth: {
        1: "1px",
      },
      boxShadow: {
        lv3: "0px 4px 4px 0px rgba(0, 0, 0, 0.22)",
      },
      maxWidth: {
        content: "1366px",
      },
    },
  },
  plugins: [],
}

export default config
