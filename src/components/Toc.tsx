import type { TocItem } from '~/markdown/rehype-toc'

function TocList({ items }: { items: TocItem[] }) {
  return (
    <ol>
      {items.map((item) => (
        <li key={item.id} data-depth={item.depth}>
          <a href={`#${item.id}`}>{item.text}</a>
        </li>
      ))}
    </ol>
  )
}

// 넓은 화면에서는 오른쪽 sticky, 좁은 화면에서는 본문 위 접기 블록으로 보인다 (CSS 가 하나를 숨긴다)
export function Toc({ items, title }: { items: TocItem[]; title: string }) {
  if (items.length === 0) return null
  return (
    <>
      <details className="toc toc-compact">
        <summary>{title}</summary>
        <TocList items={items} />
      </details>
      <nav className="toc toc-side" aria-label={title}>
        <p>{title}</p>
        <TocList items={items} />
      </nav>
    </>
  )
}
