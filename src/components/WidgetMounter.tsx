import { type RefObject, createElement, useEffect } from 'react'
import { type Root, createRoot } from 'react-dom/client'
import { widgetNames } from '~/widgets/names'
import { widgets } from '~/widgets/registry'

const isWidgetName = (name: string): name is (typeof widgetNames)[number] =>
  (widgetNames as readonly string[]).includes(name)

// 본문의 [data-widget] 자리에 위젯 컴포넌트를 붙인다. 본문은 dangerouslySetInnerHTML 이라
// React 가 안쪽을 관리하지 않으므로, 따로 root 를 만들어도 hydration 과 부딪히지 않는다
export function WidgetMounter({ container }: { container: RefObject<HTMLElement | null> }) {
  useEffect(() => {
    const root = container.current
    if (!root) return
    const roots: Root[] = []
    let cancelled = false
    for (const slot of root.querySelectorAll<HTMLElement>('[data-widget]')) {
      const name = slot.dataset.widget ?? ''
      if (!isWidgetName(name)) continue
      widgets[name]().then(({ default: Widget }) => {
        if (cancelled) return
        const widgetRoot = createRoot(slot)
        widgetRoot.render(createElement(Widget))
        roots.push(widgetRoot)
      })
    }
    return () => {
      cancelled = true
      for (const widgetRoot of roots) widgetRoot.unmount()
    }
  }, [container])
  return null
}
