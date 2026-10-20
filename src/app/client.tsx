import { StartClient } from '@tanstack/react-start/client'
import { StrictMode, startTransition } from 'react'
import { hydrateRoot } from 'react-dom/client'

declare global {
  interface Window {
    __recoverableErrors?: string[]
  }
}

// 기본 클라이언트 엔트리와 같지만, hydration 불일치 같은 복구 가능한 오류를 모아 둔다.
// 브라우저 검증에서 window.__recoverableErrors 가 비어 있는지로 hydration 을 확인한다
startTransition(() => {
  hydrateRoot(
    document,
    <StrictMode>
      <StartClient />
    </StrictMode>,
    {
      onRecoverableError: (error) => {
        window.__recoverableErrors = [...(window.__recoverableErrors ?? []), String(error)]
        console.error(error)
      },
    },
  )
})
