// 글에서 :::widget-<이름> 으로 쓸 수 있는 위젯 이름. React 를 import 하지 않는다 (Content Collections 설정이 읽음)
export const widgetNames = ['counter-demo'] as const

export type WidgetName = (typeof widgetNames)[number]
