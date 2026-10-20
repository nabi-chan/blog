import { describe, expect, it } from 'vitest'
import { replaceSourceHash, splitFrontmatter } from './rehash'

describe('splitFrontmatter', () => {
  it('frontmatter 와 본문을 나눈다', () => {
    expect(splitFrontmatter('---\ntitle: "t"\ndescription: "d"\n---\n\n본문\n')).toEqual({
      frontmatter: 'title: "t"\ndescription: "d"',
      body: '\n본문\n',
    })
  })

  it('frontmatter 가 없으면 던진다', () => {
    expect(() => splitFrontmatter('본문만')).toThrow()
  })
})

describe('replaceSourceHash', () => {
  it('sourceHash 줄의 값만 바꾼다', () => {
    const enRaw = '---\ntitle: "t"\nsourceHash: "old"\ntranslationStatus: machine\n---\nbody'
    const hash = 'a'.repeat(64)
    expect(replaceSourceHash(enRaw, hash)).toBe(enRaw.replace('"old"', `"${hash}"`))
  })

  it('sourceHash 줄이 없으면 던진다', () => {
    expect(() => replaceSourceHash('---\ntitle: "t"\n---\n', 'x')).toThrow(/sourceHash/)
  })
})
