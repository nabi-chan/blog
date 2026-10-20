// 프리뷰(또는 배포) URL 에 요청을 보내 응답을 검사하는 스모크 스크립트
// 사용법: node scripts/smoke.ts <baseUrl>
import { checkResponse, type SmokeCheck } from '../src/lib/smoke.ts'

export const CHECKS: SmokeCheck[] = [{ path: '/', status: 200, contains: ['<html'] }]

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
