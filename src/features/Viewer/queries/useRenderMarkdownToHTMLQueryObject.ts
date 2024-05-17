import { renderMarkdown } from '@/features/Viewer/utils/renderMarkdown'

export function useRenderMarkdownToHTMLQueryObject(markdown: string) {
  return {
    queryKey: ['renderMarkdownToHTML', markdown],
    queryFn: () => renderMarkdown(markdown),
  }
}
