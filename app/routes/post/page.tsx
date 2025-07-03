import {
  Anchor,
  Badge,
  Blockquote,
  Box,
  Code,
  Divider,
  Group,
  Image,
  List,
  Stack,
  Table,
  Text,
  Title,
} from "@mantine/core"
import { useMdxComponent } from "react-router-mdx/client"
import { loadMdx } from "react-router-mdx/server"
import * as v from "valibot"
import type { Route } from "./+types/post"

const LoadMDXSchema = v.object({
  __raw: v.string(),
  attributes: v.object({
    title: v.string(),
    icon: v.optional(v.string()),
    description: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
  }),
})

export async function loader({ request }: Route.LoaderArgs) {
  return v.parse(LoadMDXSchema, await loadMdx(request))
}

export function meta({ data }: Route.MetaArgs) {
  return [{ title: data?.attributes.title }]
}

const components: Parameters<typeof useMdxComponent>[0] = {
  h1: (props) => <Title mt="lg" component="h1" order={2} {...props} />,
  h2: (props) => <Title mt="md" component="h2" order={3} {...props} />,
  h3: (props) => <Title mt="md" component="h3" order={4} {...props} />,
  h4: (props) => <Title mt="sm" component="h4" order={5} {...props} />,
  h5: (props) => <Title mt="sm" component="h5" order={6} {...props} />,
  h6: (props) => <Text component="h6" fw="bold" {...props} />,
  p: (props) => <Text component="p" {...props} />,
  a: (props) => <Anchor target="_blank" rel="noopener noreferrer" {...props} />,
  ul: (props) => <List {...props} />,
  ol: (props) => <List type="ordered" {...props} />,
  li: (props) => <List.Item {...props} />,
  blockquote: (props) => <Blockquote {...props} />,
  code: (props) => <Code color="gray.3" {...props} />,
  pre: (props) => <pre {...props} />,
  strong: (props) => <strong {...props} />,
  em: (props) => <em {...props} />,
  img: (props) => <Image {...props} />,
  hr: () => <Divider />,
  table: (props) => <Table {...props} />,
  thead: (props) => <Table.Thead {...props} />,
  tbody: (props) => <Table.Tbody {...props} />,
  tr: (props) => <Table.Tr {...props} />,
  th: (props) => <Table.Th {...props} />,
  td: (props) => <Table.Td {...props} />,
}

export default function Page({ loaderData }: Route.ComponentProps) {
  const Component = useMdxComponent(components)
  return (
    <>
      <Box component="header">
        <Title order={1}>{loaderData?.attributes.title}</Title>
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
      <Stack
        gap="0.375em"
        style={{
          whiteSpace: "pre-wrap",
        }}>
        <Component />
      </Stack>
    </>
  )
}
