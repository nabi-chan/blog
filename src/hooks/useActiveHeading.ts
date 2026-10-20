import { useEffect, useState } from 'react'
import { pickActiveHeading } from '~/lib/active-heading'

// 스크롤 위치에 따라 지금 보고 있는 헤딩 id 를 돌려준다. 서버 렌더와 첫 hydration 에서는 null 이다
export function useActiveHeading(ids: string[]): string | null {
  const [active, setActive] = useState<string | null>(null)
  const key = ids.join('\n')

  useEffect(() => {
    if (ids.length === 0) return
    let frame = 0
    const update = () => {
      frame = 0
      const headings = ids.flatMap((id) => {
        const element = document.getElementById(id)
        return element ? [{ id, top: element.getBoundingClientRect().top }] : []
      })
      const threshold = Math.min(window.innerHeight * 0.3, 200)
      const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2
      setActive(pickActiveHeading(headings, { threshold, atBottom }))
    }
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }
    update()
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
    }
    // ids 배열 대신 내용(key)이 바뀔 때만 다시 건다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  return active
}
