const FRONTMATTER = /^---\n([\s\S]*?)\n---\n?/

export function splitFrontmatter(raw: string): { frontmatter: string; body: string } {
  const match = FRONTMATTER.exec(raw)
  if (!match) throw new Error('frontmatter(---) 가 없습니다')
  return { frontmatter: match[1], body: raw.slice(match[0].length) }
}

export function replaceSourceHash(enRaw: string, hash: string): string {
  const line = /^sourceHash:.*$/m
  if (!line.test(enRaw)) throw new Error('영어 번역본에 sourceHash 줄이 없습니다')
  return enRaw.replace(line, `sourceHash: "${hash}"`)
}
