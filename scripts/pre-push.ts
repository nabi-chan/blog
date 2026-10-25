// main 으로 가는 push 에 draft 글이 들어 있으면 막는다. .githooks/pre-push 가 git 의 stdin 을 그대로 넘겨 부른다
// draft 글은 배포돼도 프리렌더·sitemap 에서 빠져서 사이트에 보이지 않는다. 일부러 올릴 때는 git push --no-verify
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { parse } from 'yaml'
import { splitFrontmatter } from '../src/entities/post/index.scripts.ts'
import { changedSlugs, mainPushes } from '../src/shared/tooling/index.ts'

const git = (args: string[]) => execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] })
const exists = (object: string) => {
  try {
    git(['cat-file', '-e', object])
    return true
  } catch {
    return false
  }
}

const drafts = new Set<string>()
for (const { base, head } of mainPushes(readFileSync(0, 'utf8'))) {
  // 원격 main 이 없거나 그 커밋을 아직 받지 않았으면 비교할 수 없어서 push 할 커밋의 글을 모두 본다
  const files =
    base !== undefined && exists(`${base}^{commit}`)
      ? git(['diff', '--name-only', base, head, '--', 'content/posts'])
      : git(['ls-tree', '-r', '--name-only', head, '--', 'content/posts'])
  for (const slug of changedSlugs(files.split('\n').filter(Boolean))) {
    const source = `${head}:content/posts/${slug}/index.ko.md`
    // 이번 push 에서 지운 글은 원문이 없다
    if (!exists(source)) continue
    const meta = parse(splitFrontmatter(git(['show', source])).frontmatter) as { draft?: boolean } | null
    if (meta?.draft === true) drafts.add(slug)
  }
}

if (drafts.size > 0) {
  console.error('main 에 draft 글이 들어갑니다. 배포돼도 사이트에 보이지 않습니다')
  for (const slug of drafts) console.error(`- content/posts/${slug}/index.ko.md`)
  console.error('공개하려면 draft 를 false 로 바꿉니다. 일부러 올리는 거라면 git push --no-verify')
  process.exit(1)
}
