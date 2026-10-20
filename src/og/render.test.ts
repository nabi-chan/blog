import { mkdtempSync, existsSync, statSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { postCard } from './card'
import { renderOgPng, writeOgImage } from './render'

// PNG 서명과 IHDR 의 너비·높이를 읽는다
function pngInfo(png: Uint8Array) {
  const view = new DataView(png.buffer, png.byteOffset, png.byteLength)
  return { signature: [...png.slice(0, 4)], width: view.getUint32(16), height: view.getUint32(20) }
}

const date = '2026-10-20T12:00:00+09:00'

describe('renderOgPng', () => {
  it('1200×630 PNG 를 만든다', async () => {
    const info = pngInfo(await renderOgPng(postCard({ title: '이 블로그를 어떻게 만들었나', date, locale: 'ko' })))
    expect(info).toEqual({ signature: [0x89, 0x50, 0x4e, 0x47], width: 1200, height: 630 })
  }, 20_000)

  it('넘치는 제목과 이모지도 PNG 를 만든다', async () => {
    const title = `${'Supercalifragilistic'.repeat(4)} 🎉 아주 긴 제목`
    expect(pngInfo(await renderOgPng(postCard({ title, date, locale: 'ko' }))).width).toBe(1200)
  }, 20_000)
})

describe('writeOgImage', () => {
  it('파일을 쓰고, 같은 카드는 캐시에서 복사만 한다', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'og-'))
    const cacheDir = join(dir, 'cache')
    const card = postCard({ title: '캐시 확인', date, locale: 'ko' })
    await writeOgImage(card, join(dir, 'out', 'a.png'), cacheDir)
    expect(existsSync(join(dir, 'out', 'a.png'))).toBe(true)
    const [cached] = (await import('node:fs')).readdirSync(cacheDir)
    const before = statSync(join(cacheDir, cached)).mtimeMs
    await new Promise((resolve) => setTimeout(resolve, 20))
    await writeOgImage(card, join(dir, 'out', 'b.png'), cacheDir)
    expect(statSync(join(cacheDir, cached)).mtimeMs).toBe(before)
    expect(existsSync(join(dir, 'out', 'b.png'))).toBe(true)
  }, 20_000)
})
