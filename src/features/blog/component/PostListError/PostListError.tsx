import { VStack, Text } from '@channel.io/bezier-react'
import type { PropsWithChildren } from 'react'

export function PostListError({ children }: PropsWithChildren) {
  return (
    <VStack paddingVertical={24}>
      <Text
        typo="14"
        color="txt-black-darker"
        align="center"
      >
        {children}
      </Text>
    </VStack>
  )
}
