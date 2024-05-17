import { Spinner, VStack } from '@channel.io/bezier-react'
import { useSuspenseQuery } from '@tanstack/react-query'
import { Suspense } from 'react'
import { useRenderMarkdownToHTMLQueryObject } from '@/features/Viewer/queries/useRenderMarkdownToHTMLQueryObject'

interface ViewerProps {
  markdown: string
}

export function BaseViewer({ markdown }: ViewerProps) {
  const { data: rendered } = useSuspenseQuery(
    useRenderMarkdownToHTMLQueryObject(markdown)
  )

  return (
    <VStack
      spacing={4}
      className="markdown-body"
      style={{ fontFamily: 'inherit', fontSize: 14 }}
      dangerouslySetInnerHTML={{ __html: rendered.toString() }}
    />
  )
}

export default function Viewer(props: ViewerProps) {
  return (
    <Suspense
      fallback={
        <VStack
          height="100%"
          justify="center"
          align="center"
        >
          <Spinner color="txt-black-dark" />
        </VStack>
      }
    >
      <BaseViewer {...props} />
    </Suspense>
  )
}
