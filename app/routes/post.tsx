import { Badge, Box, Divider, Group, Text, Title } from "@mantine/core"
import { RenderMdx } from "~/components/render-mdx"
import { loadMdx } from "~/utils/mdx.server"
import type { Route } from "./+types/post"

export async function loader({ request }: Route.LoaderArgs) {
  const pathname = new URL(request.url).pathname
  return await loadMdx("posts", pathname.replace(/^\/p\//, ""))
}

export function meta({ data }: Route.MetaArgs) {
  return [{ title: data?.attributes.title }]
}

export default function Page({ loaderData }: Route.ComponentProps) {
  return (
    <>
      <Box component="header">
        <Title order={1}>{loaderData.attributes?.title}</Title>
        {loaderData.attributes.description && (
          <Text mt={4} c="dimmed">
            {loaderData.attributes.description}
          </Text>
        )}
        {loaderData.attributes.tags && (
          <Group mt={8} gap={4}>
            {loaderData.attributes.tags.map((tag) => (
              <Badge size="md" variant="outline" color="gray" key={tag}>
                {tag}
              </Badge>
            ))}
          </Group>
        )}
      </Box>
      <Divider my="lg" />
      <RenderMdx content={loaderData.__raw} />
    </>
  )
}
