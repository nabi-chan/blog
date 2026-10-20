import { useEffect, useRef } from 'react'
import { getLocale } from '~/shared/i18n'

type TurnstileApi = {
  render: (container: HTMLElement, options: Record<string, unknown>) => string
  remove: (widgetId: string) => void
}

declare global {
  interface Window {
    turnstile?: TurnstileApi
  }
}

// 프록시·캐시를 거치면 안 되는 공식 주소다. explicit 모드라 우리가 render 를 부를 때만 위젯이 생긴다
const SCRIPT_URL = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
let loading: Promise<TurnstileApi> | null = null

function loadTurnstile(): Promise<TurnstileApi> {
  loading ??= new Promise<TurnstileApi>((resolve, reject) => {
    const script = document.createElement('script')
    script.src = SCRIPT_URL
    script.async = true
    script.onload = () => (window.turnstile ? resolve(window.turnstile) : reject(new Error('turnstile 전역 객체가 없습니다')))
    script.onerror = () => {
      // 다음에 다시 시도할 수 있게 비운다
      loading = null
      reject(new Error('Turnstile 스크립트를 불러오지 못했습니다'))
    }
    // append 는 Workers 타입(HTMLRewriter Element)과 겹쳐서 appendChild 를 쓴다
    document.head.appendChild(script)
  })
  return loading
}

// 항상 위젯 높이(65px) 자리를 그리고, active 일 때만 스크립트를 불러 위젯을 붙인다.
// 토큰은 한 번만 쓸 수 있으니, 새 토큰이 필요하면 부모가 key 를 바꿔 다시 마운트한다
export function Turnstile({ siteKey, onToken, active }: { siteKey: string; onToken: (token: string | null) => void; active: boolean }) {
  const box = useRef<HTMLDivElement>(null)
  const latestOnToken = useRef(onToken)
  latestOnToken.current = onToken

  useEffect(() => {
    if (!active || !siteKey) return
    let widgetId: string | undefined
    let cancelled = false
    loadTurnstile()
      .then((turnstile) => {
        if (cancelled || !box.current) return
        widgetId = turnstile.render(box.current, {
          sitekey: siteKey,
          size: 'flexible',
          language: getLocale(),
          callback: (token: string) => latestOnToken.current(token),
          'expired-callback': () => latestOnToken.current(null),
          'error-callback': () => latestOnToken.current(null),
        })
      })
      .catch((error: unknown) => {
        console.error('[turnstile]', error)
        latestOnToken.current(null)
      })
    return () => {
      cancelled = true
      if (widgetId) window.turnstile?.remove(widgetId)
    }
  }, [active, siteKey])

  return <div ref={box} className="turnstile" />
}
