import { index, layout, prefix } from "@react-router/dev/routes"
import { mdxRoutes } from "./utils/mdx.server"
import type { RouteConfig } from "@react-router/dev/routes"

export default [
  layout("routes/_layout.tsx", [
    index("routes/home.tsx"),
    ...prefix("p", mdxRoutes("posts", "routes/post.tsx")),
  ]),
] satisfies RouteConfig
