import { useMdxComponent } from "react-router-mdx/client"
import { loadMdx } from "react-router-mdx/server"
import type { Route } from "./+types/page"

export async function loader({ request }: Route.LoaderArgs) {
  return loadMdx(request)
}

export function meta({ data }: Route.MetaArgs) {
  return [{ title: data?.attributes.title }]
}

export default function Page({ loaderData }: Route.ComponentProps) {
  const Component = useMdxComponent()
  return (
    <>
      <h1>{loaderData?.attributes.title}</h1>
      <Component />
    </>
  )
}
