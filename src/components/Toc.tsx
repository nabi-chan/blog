import type { TocItem } from '~/markdown/rehype-toc'

export function Toc({ items, title }: { items: TocItem[]; title: string }) {
  if (items.length === 0) return null
  return (
    <nav aria-label={title}>
      <p>{title}</p>
      <ol>
        {items.map((item) => (
          <li key={item.id} data-depth={item.depth}>
            <a href={`#${item.id}`}>{item.text}</a>
          </li>
        ))}
      </ol>
    </nav>
  )
}
