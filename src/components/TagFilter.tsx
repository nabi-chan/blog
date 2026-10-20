import { Link, useRouterState } from '@tanstack/react-router'
import { useEffect } from 'react'
import type { TagRef } from '~/content/post-queries'
import { m } from '~/i18n/messages'
import { readTagParam, tagFilterCss } from '~/lib/tag-filter'

// 렌더 결과는 ?tag 와 상관없이 같다. 실제 필터는 <html data-tag> 와 아래 <style> 규칙이 건다
export function TagFilter({ tags }: { tags: TagRef[] }) {
  const searchStr = useRouterState({ select: (state) => state.location.searchStr })

  useEffect(() => {
    const tag = readTagParam(searchStr)
    if (tag) document.documentElement.dataset.tag = tag
    else delete document.documentElement.dataset.tag
  }, [searchStr])

  useEffect(
    () => () => {
      delete document.documentElement.dataset.tag
    },
    [],
  )

  if (tags.length === 0) return null
  return (
    <nav className="tag-filter" aria-label={m.posts_all_tags()}>
      <style>{tagFilterCss(tags.map((tag) => tag.key))}</style>
      <Link to="/posts" search={{}} data-chip="">
        {m.posts_all_tags()}
      </Link>
      {tags.map((tag) => (
        <Link key={tag.key} to="/posts" search={{ tag: tag.key }} data-chip={tag.key}>
          {tag.label}
        </Link>
      ))}
    </nav>
  )
}
