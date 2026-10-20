import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { folderFingerprint } from './fingerprint'

const isPostSource = (name: string) => /^index\.[a-z]+\.md$/.test(name)

describe('folderFingerprint', () => {
  it('하위 폴더 파일까지 내용으로 요약하고, 본문 파일은 뺀다', () => {
    const dir = mkdtempSync(join(tmpdir(), 'fingerprint-'))
    mkdirSync(join(dir, 'images'))
    writeFileSync(join(dir, 'index.ko.md'), '본문')
    writeFileSync(join(dir, 'images', 'a.png'), 'A')
    const first = folderFingerprint(dir, isPostSource)
    expect(first).toMatch(/^[0-9a-f]{64}$/)

    writeFileSync(join(dir, 'index.ko.md'), '본문 수정')
    expect(folderFingerprint(dir, isPostSource)).toBe(first)

    writeFileSync(join(dir, 'images', 'a.png'), 'B')
    expect(folderFingerprint(dir, isPostSource)).not.toBe(first)
  })
})
