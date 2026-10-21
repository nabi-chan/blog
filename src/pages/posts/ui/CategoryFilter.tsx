import { useEffect } from 'react'
import type { CategoryRef } from '~/entities/post'
import { localizeHref, m } from '~/shared/i18n'
import { applyCategorySelection, categoryFilterCss } from '../lib/category-filter'

// 칩 마크업. URL 쿼리를 읽지 않으므로 프리렌더 HTML 과 hydration 결과가 언제나 같다.
// 라우터 Link 는 현재 쿼리로 활성 속성을 붙여 이 불변식을 깨므로 일반 <a> 를 쓴다(정적 페이지라 새로 받는 비용이 작다)
export function CategoryChips({ categories, allLabel, label }: { categories: CategoryRef[]; allLabel: string; label: string }) {
  return (
    <nav className="category-filter" aria-label={label}>
      <style>{categoryFilterCss(categories.map((category) => category.key))}</style>
      <a href={localizeHref('/posts')} data-chip="">
        {allLabel}
      </a>
      {categories.map((category) => (
        <a key={category.key} href={localizeHref(`/posts?category=${category.key}`)} data-chip={category.key}>
          {category.label}
        </a>
      ))}
    </nav>
  )
}

// 실제 필터는 <html data-category> 와 칩의 <style> 규칙이 건다. 브라우저에서는 선택 상태(data-category, aria-current)를 다시 세운다
export function CategoryFilter({ categories }: { categories: CategoryRef[] }) {
  useEffect(() => applyCategorySelection(document, window.location.search), [])

  if (categories.length === 0) return null
  return <CategoryChips categories={categories} allLabel={m.posts_all_categories()} label={m.posts_category_filter()} />
}
