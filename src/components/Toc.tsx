import type { TocItem } from '~/markdown/rehype-toc'

function TocList({ items, activeId }: { items: TocItem[]; activeId: string | null }) {
  return (
    <ol>
      {items.map((item) => (
        <li key={item.id} data-depth={item.depth}>
          <a href={`#${item.id}`} aria-current={item.id === activeId ? 'location' : undefined}>
            {item.text}
          </a>
        </li>
      ))}
    </ol>
  )
}

// compact: 본문 위 접기 블록(좁은 화면), side: 본문 오른쪽 280px 칸(넓은 화면). CSS 가 화면 폭에 따라 하나만 보인다
// activeId 는 지금 보고 있는 섹션이다 (useActiveHeading)
export function Toc({
  items,
  title,
  variant,
  activeId,
}: {
  items: TocItem[]
  title: string
  variant: 'compact' | 'side'
  activeId: string | null
}) {
  if (items.length === 0) return null
  if (variant === 'side') {
    return (
      <nav className="toc toc-side" aria-label={title}>
        <p>{title}</p>
        <TocList items={items} activeId={activeId} />
      </nav>
    )
  }
  return (
    <details className="toc toc-compact">
      <summary>{title}</summary>
      <nav aria-label={title}>
        <TocList items={items} activeId={activeId} />
      </nav>
    </details>
  )
}
