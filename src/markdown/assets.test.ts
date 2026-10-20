import { existsSync, mkdtempSync, statSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import sharp from 'sharp'
import { beforeAll, describe, expect, it } from 'vitest'
import { writeAssets } from './assets'

let src = ''
let out = ''
beforeAll(async () => {
  const dir = mkdtempSync(join(tmpdir(), 'assets-'))
  src = join(dir, 'src.png')
  out = join(dir, 'out', 'nested')
  await sharp({ create: { width: 1600, height: 10, channels: 3, background: '#888' } }).png().toFile(src)
})

describe('writeAssets', () => {
  it('원본을 복사하고 폭에 맞춘 WebP 사본을 만든다', async () => {
    await writeAssets([
      { kind: 'copy', from: src, to: join(out, 'a.png') },
      { kind: 'webp', from: src, to: join(out, 'a.720w.webp'), width: 720 },
    ])
    expect(existsSync(join(out, 'a.png'))).toBe(true)
    expect((await sharp(join(out, 'a.720w.webp')).metadata()).width).toBe(720)
  })

  it('이미 있는 파일은 다시 만들지 않는다', async () => {
    const before = statSync(join(out, 'a.720w.webp')).mtimeMs
    await writeAssets([{ kind: 'webp', from: src, to: join(out, 'a.720w.webp'), width: 720 }])
    expect(statSync(join(out, 'a.720w.webp')).mtimeMs).toBe(before)
  })
})
