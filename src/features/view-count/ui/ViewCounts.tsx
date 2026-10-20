import { useRouter, useRouterState } from '@tanstack/react-router'
import { type ReactNode, createContext, useContext, useEffect, useRef, useState } from 'react'
import { createApiClient } from '~/shared/api'
import { withMinimumDelay } from '../lib/min-delay'
import { type MatchLike, viewKey, viewTarget } from '../lib/view-target'

// failed 는 마지막 요청이 실패했는지. 응답 전(스켈레톤)과 실패(빈자리)를 구분한다
type ViewCounts = { site: number | null; today: number | null; post: { slug: string; count: number } | null; failed: boolean }

const EMPTY: ViewCounts = { site: null, today: null, post: null, failed: false }
const ViewCountsContext = createContext<ViewCounts>(EMPTY)
const client = createApiClient()
const SKELETON_MIN_MS = 500

// 라우트 이동마다 한 번 센다 (스펙 4.8). 증가 호출은 여기 한 곳에서만 한다
export function ViewCountsProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  // 경로·쿼리가 바뀔 때만 센다. 목차(#id) 이동은 같은 화면이다
  const key = useRouterState({ select: (state) => viewKey(state.location) })
  const idle = useRouterState({ select: (state) => state.status === 'idle' })
  const [counts, setCounts] = useState<ViewCounts>(EMPTY)
  // StrictMode 에서 effect 가 두 번 돌아도 한 번만 센다
  const counted = useRef<string | null>(null)

  useEffect(() => {
    if (!idle || counted.current === key) return
    counted.current = key
    const matches: MatchLike[] = router.state.matches.map((match) => ({
      routeId: match.routeId,
      status: match.status,
      params: match.params as Record<string, string>,
      // 이 버전의 라우터는 경로가 없을 때 루트 매치에 _notFound 를 붙인다
      globalNotFound: match._notFound,
    }))
    const target = viewTarget(matches)
    if (!target) return
    // 셀 때마다 숫자 자리를 스켈레톤으로 돌리고, 응답이 성공이든 실패든 최소 SKELETON_MIN_MS 동안 보여 준다 [은솔]
    setCounts(EMPTY)
    // 요청은 취소하지 않는다. 응답이 왔을 때 이미 다른 화면이면 결과만 버린다
    void withMinimumDelay(client.recordView(target.slug), SKELETON_MIN_MS).then((result) => {
      if (counted.current !== key) return
      if (!result.ok) {
        setCounts({ ...EMPTY, failed: true })
        return
      }
      const { site, today, post } = result.data
      setCounts({ site, today, post: target.slug !== undefined && post !== undefined ? { slug: target.slug, count: post } : null, failed: false })
    })
  }, [idle, key, router])

  return <ViewCountsContext value={counts}>{children}</ViewCountsContext>
}

export function useViewCounts(): ViewCounts {
  return useContext(ViewCountsContext)
}

const numberFormat = new Intl.NumberFormat('en-US')

// 레이블은 프리렌더 HTML 에 들어 있다. 숫자 자리는 응답 전에는 스켈레톤, 실패하면 빈자리(visibility)다.
// 레이블을 숫자 앞에 둬서 영어도 단수·복수(1 view / 2 views)를 가릴 필요가 없다
export function ViewCount({ label, value, failed }: { label: string; value: number | null; failed: boolean }) {
  const state = value !== null ? 'ready' : failed ? 'failed' : 'loading'
  return (
    <span className="view-count">
      {label}{' '}
      <span className="view-count-number" data-state={state} aria-busy={state === 'loading' || undefined}>
        {numberFormat.format(value ?? 0)}
      </span>
    </span>
  )
}
