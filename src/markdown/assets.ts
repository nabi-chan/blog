import { existsSync } from 'node:fs'
import { copyFile, mkdir } from 'node:fs/promises'
import { dirname } from 'node:path'
import type { Asset } from './render'

// 렌더 결과의 이미지 목록을 실제 파일로 쓴다. 이름에 내용 해시가 있어 이미 있으면 건너뛴다
export async function writeAssets(assets: Asset[]): Promise<void> {
  for (const asset of assets) {
    if (existsSync(asset.to)) continue
    await mkdir(dirname(asset.to), { recursive: true })
    if (asset.kind === 'copy') {
      await copyFile(asset.from, asset.to)
    } else {
      const { default: sharp } = await import('sharp')
      await sharp(asset.from).resize({ width: asset.width }).webp({ quality: 82 }).toFile(asset.to)
    }
  }
}
