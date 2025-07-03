import { vercelPreset } from "@vercel/react-router/vite"
import type { Config } from "@react-router/dev/config"

export default {
  ssr: false,
  prerender: true,
  presets: [vercelPreset()],
  routeDiscovery: { mode: "initial" },
} satisfies Config
