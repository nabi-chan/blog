// 플러그인 단위 테스트용 최소 파이프라인 (커버리지 제외)
import rehypeStringify from 'rehype-stringify'
import remarkDirective from 'remark-directive'
import remarkGfm from 'remark-gfm'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import { type PluggableList, unified } from 'unified'
import { VFile } from 'vfile'

export async function runPlugins(
  markdown: string,
  opts: { remark?: PluggableList; rehype?: PluggableList; path?: string } = {},
): Promise<{ html: string; data: VFile['data'] }> {
  const file = new VFile({ value: markdown, path: opts.path })
  const result = await unified()
    .use(remarkParse)
    .use(remarkGfm, { singleTilde: false })
    .use(remarkDirective)
    .use(opts.remark ?? [])
    .use(remarkRehype)
    .use(opts.rehype ?? [])
    .use(rehypeStringify)
    .process(file)
  return { html: String(result), data: result.data }
}
