import { existsSync, mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { ogSitePlugin } from './site-plugin'

describe('ogSitePlugin', () => {
  it('빌드를 시작할 때 언어마다 사이트 기본 OG 이미지를 만든다 (소개글과 무관)', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'og-site-'))
    const plugin = ogSitePlugin({ outDir: join(dir, 'og'), cacheDir: join(dir, 'cache') })
    await (plugin.buildStart as () => Promise<void>).call({})
    expect(existsSync(join(dir, 'og', 'ko', 'site.png'))).toBe(true)
    expect(existsSync(join(dir, 'og', 'en', 'site.png'))).toBe(true)
  }, 30_000)
})
