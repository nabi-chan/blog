import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { Plugin } from 'vite'
import { siteCard } from './card.ts'
import { writeOgImage } from './render.ts'

// Lobby·Posts·404 가 쓰는 사이트 기본 OG 이미지(public/og/<locale>/site.png).
// 소개글이 없어도 만들어지도록 콘텐츠 변환이 아니라 빌드 시작에서 만든다 (계획 3 리뷰)
export function ogSitePlugin(options: { outDir?: string; cacheDir?: string; messagesDir?: string } = {}): Plugin {
  const { outDir = 'public/og', cacheDir = 'node_modules/.cache/og', messagesDir = 'messages' } = options
  // 환경(client·ssr)마다 buildStart 가 불려도 한 번만 그린다
  let done: Promise<void> | undefined
  return {
    name: 'eunsol:og-site',
    buildStart() {
      done ??= (async () => {
        for (const locale of ['ko', 'en'] as const) {
          // Paraglide 컴파일보다 먼저 돌 수 있어서 메시지 파일을 직접 읽는다
          const { site_description: description } = JSON.parse(readFileSync(join(messagesDir, `${locale}.json`), 'utf8')) as { site_description: string }
          await writeOgImage(siteCard({ locale, description }), join(outDir, locale, 'site.png'), cacheDir)
        }
      })()
      return done
    },
  }
}
