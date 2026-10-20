// 프리뷰(또는 배포) URL 에 요청을 보내 응답을 검사하는 스모크 스크립트
// 사용법: node scripts/smoke.ts <baseUrl>
import { checkResponse, type SmokeCheck } from '../src/lib/smoke.ts'

export const CHECKS: SmokeCheck[] = [
  { path: '/', status: 200, contains: ['<html', 'lang="ko"', 'href="/posts/how-this-blog-is-built"'] },
  { path: '/en', status: 200, contains: ['lang="en"', 'href="/en/posts/how-this-blog-is-built"'] },
  { path: '/posts', status: 200, contains: ['lang="ko"'] },
  { path: '/en/posts', status: 200, contains: ['lang="en"'] },
  { path: '/en/', status: 307, location: '/en' },
  { path: '/fr/posts', status: 404 },
  { path: '/EN/posts', status: 404 },
  {
    path: '/posts/how-this-blog-is-built',
    status: 200,
    contains: ['lang="ko"', 'kitchen-sink-ko', 'data-rehype-pretty-code', '<nav'],
  },
  { path: '/en/posts/how-this-blog-is-built', status: 200, contains: ['lang="en"', 'kitchen-sink-en'] },
  { path: '/posts/how-this-blog-is-built/', status: 307, location: '/posts/how-this-blog-is-built' },
  { path: '/posts/does-not-exist', status: 404 },
  { path: '/en/posts/does-not-exist', status: 404 },
  // 깨진 퍼센트 인코딩은 Workers 정적 에셋 계층이 Worker 앞에서 400 으로 끊는다 (500 이 아니면 된다)
  { path: '/posts/%E0', status: 400 },
]

async function main(baseUrl: string) {
  const failures: string[] = []
  for (const check of CHECKS) {
    const res = await fetch(new URL(check.path, baseUrl), { redirect: 'manual' })
    failures.push(
      ...checkResponse(check, {
        status: res.status,
        location: res.headers.get('location'),
        body: await res.text(),
      }),
    )
  }
  const passed = CHECKS.length - new Set(failures.map((f) => f.split(':')[0])).size
  console.log(`${passed}/${CHECKS.length} 통과`)
  if (failures.length > 0) {
    for (const failure of failures) console.error(`- ${failure}`)
    process.exit(1)
  }
}

const baseUrl = process.argv[2]
if (!baseUrl) {
  console.error('사용법: node scripts/smoke.ts <baseUrl>')
  process.exit(1)
}
await main(baseUrl)
