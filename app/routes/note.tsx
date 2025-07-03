import { Badge, Box, Card, Group, Stack, Text } from "@mantine/core"
import { RenderMdx } from "~/components/render-mdx"
import { loadAllMdx } from "~/utils/mdx.server"
import type { Route } from "./+types/note"

export async function loader() {
  return loadAllMdx("notes")
}

export default function Page({ loaderData }: Route.ComponentProps) {
  return (
    <Stack>
      {loaderData.map(({ slug, __raw, attributes }) => (
        <Card key={slug} shadow="md">
          <Text size="lg">
            <Text mr={6} size="xl" component="span">
              {attributes.icon ?? "📄"}
            </Text>
            <Text fw={600} component="span">
              {attributes.title}
            </Text>
          </Text>

          {attributes.description && (
            <Text size="sm" mt={4} c="dimmed">
              {attributes.description}
            </Text>
          )}

          {attributes.tags && (
            <Group mt={4} gap={4}>
              {attributes.tags.map((tag) => (
                <Badge variant="light" color="gray" key={tag}>
                  {tag}
                </Badge>
              ))}
            </Group>
          )}

          <Box mt="md" />
          <RenderMdx content={__raw} />
        </Card>
      ))}
    </Stack>
  )
}
