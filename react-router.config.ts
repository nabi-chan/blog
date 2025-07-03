import { vercelPreset } from "@vercel/react-router/vite"
import { init } from "react-router-mdx/server"
import type { Config } from "@react-router/dev/config"

init({ path: "posts", alias: "p" })

export default {
  ssr: false,
  prerender: true,
  presets: [vercelPreset()],
  routeDiscovery: { mode: "initial" },
} satisfies Config
