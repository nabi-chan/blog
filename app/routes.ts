import { index, layout } from "@react-router/dev/routes"
import { routes } from "react-router-mdx/server"
import type { RouteConfig } from "@react-router/dev/routes"

export default [
  layout("routes/layout.tsx", [
    index("routes/home/page.tsx"),
    ...routes("routes/post/page.tsx"),
  ]),
] satisfies RouteConfig
