import { VStack, Text } from '@channel.io/bezier-react'
import type { PropsWithChildren } from 'react'

interface PageHeaderProps {
  title: string
  description?: string | null
}

export function PageHeader({
  title,
  description,
  children,
}: PropsWithChildren<PageHeaderProps>) {
  return (
    <VStack spacing={8}>
      <Text
        typo="18"
        bold
      >
        {title}
      </Text>
      {description && (
        <Text
          typo="14"
          color="txt-black-darker"
        >
          {description}
        </Text>
      )}

      {children}
    </VStack>
  )
}
