import { createHash } from 'node:crypto'
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { Resvg } from '@resvg/resvg-js'
import type { ReactNode } from 'react'
import satori from 'satori'
import { OG_SIZE, type OgNode } from './card.ts'

// 카드 디자인이나 렌더 방식이 바뀌면 올린다. 캐시 키에 들어간다
// 2: 제목 맞춤(fitOgTitle)과 세 줄 높이 자르기 (계획 4)
const OG_VERSION = 2

// satori 는 woff2 와 가변 폰트를 읽지 못해서 SUIT 정적 TTF 를 쓴다 (빌드 전용, 사이트로 내보내지 않음)
const FONT_DIR = resolve('assets/fonts')
let fonts: Array<{ name: string; data: Buffer; weight: 400 | 700; style: 'normal' }> | undefined

function loadFonts() {
  fonts ??= [
    { name: 'SUIT', data: readFileSync(join(FONT_DIR, 'SUIT-Regular.ttf')), weight: 400, style: 'normal' },
    { name: 'SUIT', data: readFileSync(join(FONT_DIR, 'SUIT-Bold.ttf')), weight: 700, style: 'normal' },
  ]
  return fonts
}

export async function renderOgPng(node: OgNode): Promise<Uint8Array> {
  const svg = await satori(node as unknown as ReactNode, { ...OG_SIZE, fonts: loadFonts() })
  return new Resvg(svg, { fitTo: { mode: 'width', value: OG_SIZE.width } }).render().asPng()
}

// 같은 카드는 다시 그리지 않는다. 빌드마다 public/og 를 비우므로 캐시에서 복사만 한다
export async function writeOgImage(node: OgNode, outFile: string, cacheDir: string): Promise<void> {
  const key = createHash('sha256').update(`${OG_VERSION}:${JSON.stringify(node)}`).digest('hex')
  const cached = join(cacheDir, `${key}.png`)
  if (!existsSync(cached)) {
    mkdirSync(cacheDir, { recursive: true })
    writeFileSync(cached, await renderOgPng(node))
  }
  mkdirSync(dirname(outFile), { recursive: true })
  copyFileSync(cached, outFile)
}
