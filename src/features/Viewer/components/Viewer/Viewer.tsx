import { VStack } from '@channel.io/bezier-react'

interface ViewerProps {
  markdown: string
}

export function Viewer({ markdown }: ViewerProps) {
  return <VStack spacing={4} />
}
