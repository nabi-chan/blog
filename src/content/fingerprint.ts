import { createHash } from 'node:crypto'
import { readFileSync, readdirSync } from 'node:fs'
import { join, relative } from 'node:path'

// 글 폴더의 본문 외 파일(이미지 등)을 하위 폴더까지 내용으로 요약한다.
// 렌더 캐시 키에 넣어, 본문은 그대로이고 이미지만 바뀌어도 캐시를 다시 만들게 한다
export function folderFingerprint(dir: string, skip: (name: string) => boolean): string {
  const hash = createHash('sha256')
  const walk = (current: string) => {
    for (const entry of readdirSync(current, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      const path = join(current, entry.name)
      if (entry.isDirectory()) walk(path)
      else if (entry.isFile() && !skip(entry.name)) hash.update(relative(dir, path)).update(readFileSync(path))
    }
  }
  walk(dir)
  return hash.digest('hex')
}
