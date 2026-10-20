import { useRouter, useRouterState } from '@tanstack/react-router'
import { type ReactNode, createContext, useContext, useEffect, useRef, useState } from 'react'
import { createApiClient } from '~/lib/api-client'
import { type MatchLike, viewTarget } from '~/lib/view-target'

type ViewCounts = { site: number | null; post: { slug: string; count: number } | null }

const EMPTY: ViewCounts = { site: null, post: null }
const ViewCountsContext = createContext<ViewCounts>(EMPTY)
const client = createApiClient()

// 라우트 이동마다 한 번 센다 (스펙 4.8). 증가 호출은 여기 한 곳에서만 한다
export function ViewCountsProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  // 같은 주소로 다시 이동해도 히스토리 항목마다 키가 달라서 다시 센다
  const key = useRouterState({ select: (state) => state.location.state.__TSR_key ?? state.location.href })
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
    // 요청은 취소하지 않는다. 응답이 왔을 때 이미 다른 화면이면 결과만 버린다
    void client.recordView(target.slug).then((result) => {
      if (counted.current !== key) return
      if (!result.ok) {
        setCounts(EMPTY)
        return
      }
      const { site, post } = result.data
      setCounts({ site, post: target.slug !== undefined && post !== undefined ? { slug: target.slug, count: post } : null })
    })
  }, [idle, key, router])

  return <ViewCountsContext value={counts}>{children}</ViewCountsContext>
}

export function useViewCounts(): ViewCounts {
  return useContext(ViewCountsContext)
}

const numberFormat = new Intl.NumberFormat('en-US')

// 레이블은 프리렌더 HTML 에 들어 있고, 숫자 자리는 폭을 잡아 둔 채 visibility 로만 감춘다 (CLS 0).
// 레이블을 숫자 앞에 둬서 영어도 단수·복수(1 view / 2 views)를 가릴 필요가 없다
export function ViewCount({ label, value }: { label: string; value: number | null }) {
  return (
    <span className="view-count">
      {label}{' '}
      <span className="view-count-number" style={{ visibility: value === null ? 'hidden' : 'visible' }}>
        {numberFormat.format(value ?? 0)}
      </span>
    </span>
  )
}
