import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { SEO_PAGES, markdownPagePaths, shouldPrerender } from '~/lib/prerender'

describe('shouldPrerender', () => {
  it('페이지 경로는 프리렌더한다', () => {
    for (const path of ['/', '/en/posts', '/261020', '/administrator']) expect(shouldPrerender(path)).toBe(true)
  })

  it('쿼리·해시가 붙은 경로, API, Access 입구는 프리렌더하지 않는다', () => {
    for (const path of ['/posts?tag=a', '/261020#x', '/api/me', '/admin', '/admin/x']) expect(shouldPrerender(path)).toBe(false)
  })
})

describe('SEO_PAGES', () => {
  it('언어별·공통 SEO 산출물 경로다', () => {
    expect(SEO_PAGES).toEqual(['/sitemap.xml', '/robots.txt', '/rss.xml', '/en/rss.xml', '/llms.txt', '/en/llms.txt', '/llms-full.txt'])
  })
})

describe('markdownPagePaths', () => {
  const post = (dir: string, slug: string, files: Record<string, string>) => {
    mkdirSync(join(dir, slug))
    for (const [name, body] of Object.entries(files)) writeFileSync(join(dir, slug, name), body)
  }
  const dir = mkdtempSync(join(tmpdir(), 'md-pages-'))
  post(dir, '261020', { 'index.ko.md': '---\ntitle: a\n---\n본문', 'index.en.md': '---\ntitle: a\n---\nbody' })
  post(dir, '261021', { 'index.ko.md': '---\ntitle: b\n---\n본문' })
  post(dir, '261022', { 'index.ko.md': '---\ntitle: c\ndraft: true\n---\n본문', 'index.en.md': '---\ntitle: c\n---\nbody' })
  writeFileSync(join(dir, 'README.md'), '폴더가 아닌 파일은 무시한다')

  it('번역이 있으면 .md 두 개, 없으면 하나다. 프로덕션에서는 draft 를 뺀다', () => {
    expect(markdownPagePaths(dir, { production: true })).toEqual(['/261020.md', '/en/261020.md', '/261021.md'])
  })

  it('글 폴더가 아예 없으면 (글 0편, git 은 빈 폴더를 추적하지 않음) 빈 목록이다', () => {
    expect(markdownPagePaths(join(dir, 'missing'), { production: true })).toEqual([])
  })

  it('dev 에서는 draft 도 넣는다', () => {
    expect(markdownPagePaths(dir, { production: false })).toEqual(['/261020.md', '/en/261020.md', '/261021.md', '/261022.md', '/en/261022.md'])
  })
})
