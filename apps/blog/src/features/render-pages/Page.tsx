import { Text } from '@channel.io/bezier-react'
import type { PageProps } from './getStaticProps'

export function Page(props: PageProps) {
  return <Text as="pre">{JSON.stringify(props, null, 2)}</Text>
}
