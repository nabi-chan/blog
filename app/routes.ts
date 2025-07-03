import { index, layout } from "@react-router/dev/routes"
import { routes } from "react-router-mdx/server"
import type { RouteConfig } from "@react-router/dev/routes"

export default [
  layout("routes/_layout.tsx", [
    index("routes/home.tsx"),
    ...routes("routes/post.tsx"),
  ]),
] satisfies RouteConfig
