import {
  AppShell,
  Badge,
  Burger,
  Card,
  Group,
  ScrollArea,
  Stack,
  Text,
  Title,
} from "@mantine/core"
import { useDisclosure } from "@mantine/hooks"
import { Link, Outlet } from "react-router"
import { loadAllMdx } from "react-router-mdx/server"
import * as v from "valibot"
import type { Route } from "./+types/_layout"

const LoadAllMDXSchema = v.array(
  v.object({
    slug: v.string(),
    path: v.string(),
    title: v.string(),
    icon: v.optional(v.string()),
    description: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
  }),
)

export async function loader({ request }: Route.LoaderArgs) {
  const pathname = new URL(request.url).pathname
  return {
    slug: pathname.match(/^\/p\//) ? pathname.replace(/^\/p\//, "") : null,
    posts: v.parse(LoadAllMDXSchema, await loadAllMdx()),
  }
}

export async function clientLoader({ serverLoader }: Route.ClientLoaderArgs) {
  const collapsed = localStorage.getItem("navbar") === "hidden"
  const serverData = await serverLoader()
  return {
    ...serverData,
    collapsed,
  }
}

export default function Layout({ loaderData }: Route.ComponentProps) {
  const [collapsed, { toggle }] = useDisclosure(
    "collapsed" in loaderData ? loaderData.collapsed : !!loaderData.slug,
    {
      onOpen: () => localStorage.setItem("navbar", "display"),
      onClose: () => localStorage.setItem("navbar", "hidden"),
    },
  )

  return (
    <AppShell
      h="100dvh"
      padding="md"
      header={{ height: 60 }}
      navbar={{
        width: 500,
        breakpoint: "md",
        collapsed: {
          desktop: collapsed,
          mobile: collapsed,
        },
      }}>
      <AppShell.Header p="md" pos="fixed">
        <Burger opened={!collapsed} onClick={toggle} size="sm" />
        <Link to="/">
          <Title order={3} component="h1" pos="absolute" top="25%" left="50%">
            🦋
          </Title>
        </Link>
      </AppShell.Header>
      <AppShell.Navbar>
        <ScrollArea type="auto" scrollbars="y">
          <Stack p="md" pb="xl">
            {loaderData.posts.map((item) => (
              <Card
                key={item.slug}
                shadow="md"
                component={Link}
                bg={item.slug === loaderData.slug ? "gray.1" : "none"}
                to={`/p/${item.slug}`}>
                <Text lineClamp={2} size="lg">
                  <Text mr={6} size="xl" component="span">
                    {item.icon ?? "📄"}
                  </Text>
                  <Text fw={600} component="span">
                    {item.title}
                  </Text>
                </Text>

                {item.description && (
                  <Text size="sm" mt={4} c="dimmed" lineClamp={3}>
                    {item.description}
                  </Text>
                )}

                {item.tags && (
                  <Group mt={8} gap={4}>
                    {item.tags.map((tag) => (
                      <Badge variant="light" color="gray" key={tag}>
                        {tag}
                      </Badge>
                    ))}
                  </Group>
                )}
              </Card>
            ))}
          </Stack>
        </ScrollArea>
      </AppShell.Navbar>
      <AppShell.Main>
        <Outlet />
      </AppShell.Main>
    </AppShell>
  )
}
