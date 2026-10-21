import { useLocation, useNavigate } from '@tanstack/react-router'
import { type MouseEvent, useEffect } from 'react'
import type { CategoryRef } from '~/entities/post'
import { localizeHref, m } from '~/shared/i18n'
import { applyCategorySelection, categoryFilterCss, isPlainClick } from '../lib/category-filter'

// 칩 마크업. URL 쿼리를 읽지 않으므로 프리렌더 HTML 과 hydration 결과가 언제나 같다.
// 라우터 Link 는 현재 쿼리로 활성 속성을 붙여 이 불변식을 깨므로 일반 <a> 를 쓰고, 클릭만 onSelect 로 넘긴다
export function CategoryChips({
  categories,
  allLabel,
  label,
  onSelect,
}: {
  categories: CategoryRef[]
  allLabel: string
  label: string
  onSelect?: (event: MouseEvent<HTMLAnchorElement>, category: string | undefined) => void
}) {
  return (
    <nav className="category-filter" aria-label={label}>
      <style>{categoryFilterCss(categories.map((category) => category.key))}</style>
      <a href={localizeHref('/posts')} data-chip="" onClick={(event) => onSelect?.(event, undefined)}>
        {allLabel}
      </a>
      {categories.map((category) => (
        <a
          key={category.key}
          href={localizeHref(`/posts?category=${category.key}`)}
          data-chip={category.key}
          onClick={(event) => onSelect?.(event, category.key)}
        >
          {category.label}
        </a>
      ))}
    </nav>
  )
}

// 실제 필터는 <html data-category> 와 칩의 <style> 규칙이 건다. 브라우저에서는 선택 상태(data-category, aria-current)를 다시 세운다.
// 칩을 누르면 문서를 새로 받지 않고 라우터로 쿼리만 바꾼다. 쿼리가 바뀌면(뒤로 가기 포함) effect 가 선택 상태를 다시 건다
export function CategoryFilter({ categories }: { categories: CategoryRef[] }) {
  const search = useLocation({ select: (location) => location.searchStr })
  const navigate = useNavigate()
  useEffect(() => applyCategorySelection(document, search), [search])

  if (categories.length === 0) return null
  return (
    <CategoryChips
      categories={categories}
      allLabel={m.posts_all_categories()}
      label={m.posts_category_filter()}
      onSelect={(event, category) => {
        if (!isPlainClick(event)) return
        event.preventDefault()
        void navigate({ to: '/posts', search: category ? { category } : {}, resetScroll: false })
      }}
    />
  )
}
