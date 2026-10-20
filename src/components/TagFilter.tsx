import { useEffect } from 'react'
import type { TagRef } from '~/content/post-queries'
import { m } from '~/i18n/messages'
import { localizeHref } from '~/i18n/runtime'
import { applyTagSelection, tagFilterCss } from '~/lib/tag-filter'

// 칩 마크업. URL 쿼리를 읽지 않으므로 프리렌더 HTML 과 hydration 결과가 언제나 같다.
// 라우터 Link 는 현재 쿼리로 활성 속성을 붙여 이 불변식을 깨므로 일반 <a> 를 쓴다(정적 페이지라 새로 받는 비용이 작다)
export function TagChips({ tags, allLabel, label }: { tags: TagRef[]; allLabel: string; label: string }) {
  return (
    <nav className="tag-filter" aria-label={label}>
      <style>{tagFilterCss(tags.map((tag) => tag.key))}</style>
      <a href={localizeHref('/posts')} data-chip="">
        {allLabel}
      </a>
      {tags.map((tag) => (
        <a key={tag.key} href={localizeHref(`/posts?tag=${tag.key}`)} data-chip={tag.key}>
          {tag.label}
        </a>
      ))}
    </nav>
  )
}

// 실제 필터는 <html data-tag> 와 칩의 <style> 규칙이 건다. 브라우저에서는 선택 상태(data-tag, aria-current)를 다시 세운다
export function TagFilter({ tags }: { tags: TagRef[] }) {
  useEffect(() => applyTagSelection(document, window.location.search), [])

  if (tags.length === 0) return null
  return <TagChips tags={tags} allLabel={m.posts_all_tags()} label={m.posts_tag_filter()} />
}
