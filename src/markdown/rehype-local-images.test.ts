import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import sharp from 'sharp'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { rehypeLocalImages, svgSize } from './rehype-local-images'
import { runPlugins } from './test-utils'

// 1x1 투명 PNG
const PIXEL = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='

let dir = ''
let filePath = ''
beforeAll(async () => {
  dir = mkdtempSync(join(tmpdir(), 'local-images-'))
  filePath = join(dir, 'index.ko.md')
  writeFileSync(join(dir, 'a.png'), Buffer.from(PIXEL, 'base64'))
  writeFileSync(join(dir, '스크린샷 2026-10-20 오후 2.15.30.png'), Buffer.from(PIXEL, 'base64'))
  writeFileSync(join(dir, 'my image.png'), Buffer.from(PIXEL, 'base64'))
  mkdirSync(join(dir, 'images'))
  writeFileSync(join(dir, 'images', 'b.png'), Buffer.from(PIXEL, 'base64'))
  // 휴대폰 사진처럼 EXIF 회전(6 = 시계 방향 90도)이 붙은 200x100 JPEG. 보이는 크기는 100x200 이다
  await sharp({ create: { width: 200, height: 100, channels: 3, background: '#888' } })
    .jpeg()
    .withMetadata({ orientation: 6 })
    .toFile(join(dir, 'phone.jpg'))
  writeFileSync(join(dir, 'b.svg'), '<svg></svg>')
  writeFileSync(join(dir, 'c.svg'), '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 150"></svg>')
})
afterEach(() => {
  vi.restoreAllMocks()
})

const run = (md: string) =>
  runPlugins(md, { rehype: [[rehypeLocalImages, { filePath, slug: 'x' }]], path: filePath })

describe('rehypeLocalImages', () => {
  it('글 옆 이미지를 해시 경로로 바꾸고 크기·WebP 사본·로딩 우선순위를 단다', async () => {
    const { html, data } = await run('![그림](./a.png)\n\n문장 안 ![작은](./a.png) 이미지\n\n![외부](https://example.com/x.png)')
    expect(html).toMatch(
      /<picture><source type="image\/webp" srcset="\/content-assets\/x\/a\.[0-9a-f]{8}\.1w\.webp 1w" sizes="\(max-width: 1199px\) 90vw, 920px"><img src="\/content-assets\/x\/a\.[0-9a-f]{8}\.png" alt="그림" width="1" height="1" loading="eager" fetchpriority="high" decoding="async"><\/picture>/,
    )
    expect(html).toMatch(/문장 안 <picture>.*<img src="\/content-assets\/x\/a\.[0-9a-f]{8}\.png" alt="작은" width="1" height="1" loading="lazy" fetchpriority="low"/)
    expect(html).toContain('src="https://example.com/x.png"')
    expect(data.assets).toEqual([
      { kind: 'copy', from: join(dir, 'a.png'), to: expect.stringMatching(/^public\/content-assets\/x\/a\.[0-9a-f]{8}\.png$/) },
      { kind: 'webp', from: join(dir, 'a.png'), to: expect.stringMatching(/^public\/content-assets\/x\/a\.[0-9a-f]{8}\.1w\.webp$/), width: 1 },
    ])
  })

  it('?w= 로 폭을 제한하고 쿼리는 경로에서 뺀다', async () => {
    const { html } = await run('![작게](./a.png?w=400)')
    expect(html).toContain('style="max-width:min(400px, 100%);height:auto;"')
    expect(html).toContain('sizes="(max-width: 445px) 90vw, 400px"')
    expect(html).not.toContain('?w=400')
  })

  it('?w= 가 본문 최대 폭(920px)보다 크면 본문 폭 기준 sizes 를 쓴다', async () => {
    const { html } = await run('![크게](./a.png?w=1000)')
    expect(html).toContain('sizes="(max-width: 1199px) 90vw, 920px"')
  })

  it('alt 가 없으면 경고만 한다', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    await run('![](./a.png)')
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('alt'))
  })

  it('SVG 는 루트 태그에서 크기를 읽고 WebP 사본을 만들지 않는다', async () => {
    const { html } = await run('![c](./c.svg)')
    expect(html).toMatch(/<img src="\/content-assets\/x\/c\.[0-9a-f]{8}\.svg" alt="c" width="300" height="150"/)
    expect(html).not.toContain('<picture>')
  })

  it('한글·공백이 든 파일 이름도 찾고, 공개 이름은 URL 에 안전한 ASCII 로 만든다', async () => {
    const { html } = await run('![스샷](<./스크린샷 2026-10-20 오후 2.15.30.png>)\n\n![공백](<./my image.png>)')
    expect(html).toMatch(/src="\/content-assets\/x\/2026-10-20-2-15-30\.[0-9a-f]{8}\.png"/)
    expect(html).toMatch(/src="\/content-assets\/x\/my-image\.[0-9a-f]{8}\.png"/)
    expect(html).toMatch(/srcset="\/content-assets\/x\/my-image\.[0-9a-f]{8}\.1w\.webp 1w"/)
  })

  it('글 폴더 안 하위 폴더의 이미지도 쓴다', async () => {
    const { html } = await run('![하위](./images/b.png)')
    expect(html).toMatch(/src="\/content-assets\/x\/b\.[0-9a-f]{8}\.png"/)
  })

  it('EXIF 회전을 반영해 보이는 크기와 사본 폭을 정한다', async () => {
    const { html, data } = await run('![폰](./phone.jpg)')
    expect(html).toMatch(/<img src="\/content-assets\/x\/phone\.[0-9a-f]{8}\.jpg" alt="폰" width="100" height="200"/)
    expect(data.assets).toContainEqual(expect.objectContaining({ kind: 'webp', width: 100 }))
  })

  it('파일이 없거나 크기를 못 읽으면 던진다', async () => {
    await expect(run('![x](./missing.png)')).rejects.toThrow(/missing\.png.*찾을 수 없습니다/)
    await expect(run('![b](./b.svg)')).rejects.toThrow(/b\.svg.*크기/)
  })
})

describe('svgSize', () => {
  it('width·height 를 읽고, 없으면 viewBox 를 쓴다', () => {
    expect(svgSize('<svg xmlns="http://www.w3.org/2000/svg" width="120px" height="80">')).toEqual({ width: 120, height: 80 })
    expect(svgSize('<svg viewBox="0 0 300 150">')).toEqual({ width: 300, height: 150 })
  })

  it('루트 태그에 긴 속성이 있어도 읽는다 (draw.io)', () => {
    expect(svgSize(`<svg content="${'&lt;mxfile&gt;'.repeat(2000)}" viewBox="0 0 10 20">`)).toEqual({ width: 10, height: 20 })
  })

  it('크기 정보가 없으면 빈 객체다', () => {
    expect(svgSize('<svg></svg>')).toEqual({})
  })
})
