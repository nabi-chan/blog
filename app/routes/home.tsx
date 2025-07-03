import { Anchor, Center, List, Stack, Text } from "@mantine/core"

export default function Page() {
  return (
    <Center h="calc(100dvh - 60px - var(--app-shell-padding) * 2)">
      <Stack>
        <Text fz="h1" ta="center">
          🦋
        </Text>

        <Text fz="h4" ta="center" fw={600}>
          Software Engineer in{" "}
          <Anchor fw="bold" href="https://github.com/cat-hou-se">
            cat-house
          </Anchor>
        </Text>

        <List>
          <List.Item>
            <Anchor fw={600} href="mailto:hello@nabi.kim">
              <Text component="span" fz="xl" mr={4}>
                ✉️
              </Text>
              Email
            </Anchor>
          </List.Item>
          <List.Item>
            <Anchor fw={600} href="https://nabi.kim/s/cv">
              <Text component="span" fz="xl" mr={4}>
                📄
              </Text>
              CV
            </Anchor>
          </List.Item>
        </List>
      </Stack>
    </Center>
  )
}
