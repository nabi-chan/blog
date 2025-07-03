import {
  Anchor,
  Blockquote,
  Code,
  Divider,
  Image,
  List,
  Stack,
  Table,
  Text,
  Title,
} from "@mantine/core"
import { runSync } from "@mdx-js/mdx"
import { MDXProvider } from "@mdx-js/react"
import * as runtime from "react/jsx-runtime"

type MDXContent = ReturnType<typeof runSync>["default"]
type MDXComponents = Parameters<MDXContent>[0]["components"]

const components: MDXComponents = {
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

export function RenderMdx({ content }: { content: string }) {
  const { default: Component } = runSync(content, {
    ...runtime,
    baseUrl: import.meta.url,
  })

  return (
    <MDXProvider>
      <Stack
        gap="0.375em"
        style={{
          whiteSpace: "pre-wrap",
        }}>
        <Component components={components} />
      </Stack>
    </MDXProvider>
  )
}
