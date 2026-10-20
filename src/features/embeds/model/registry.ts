import type { ComponentType } from 'react'
import type { WidgetName } from '../config/names'

// 위젯 코드는 그 위젯을 쓰는 글에서만 불러온다
export const widgets: Record<WidgetName, () => Promise<{ default: ComponentType }>> = {
  'counter-demo': () => import('../ui/counter-demo'),
}
