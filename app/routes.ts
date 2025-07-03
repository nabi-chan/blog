import { mdxRoutes } from "./utils/mdx.server"
import { index, layout, prefix, route } from "@react-router/dev/routes"
import type { RouteConfig } from "@react-router/dev/routes"

export default [
  layout("routes/_layout.tsx", [
    index("routes/home.tsx"),
    route("/note", "routes/note.tsx"),
    ...prefix("p", mdxRoutes("posts", "routes/post.tsx")),
  ]),
] satisfies RouteConfig
