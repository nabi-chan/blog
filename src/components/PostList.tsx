import { Link } from '@tanstack/react-router'
import { formatDate } from '~/content/date'
import { type PostMeta, groupByYear as group } from '~/content/post-index'
import type { Locale } from '~/i18n/runtime'

function Item({ post, locale }: { post: PostMeta; locale: Locale }) {
  return (
    <li data-post="" data-tags={post.tags.join(' ')} className="post-item">
      <Link to="/$slug" params={{ slug: post.slug }} className="post-item-title">
        {post.title}
      </Link>
      <time dateTime={post.date}>{formatDate(post.date, locale)}</time>
      <p>{post.description}</p>
    </li>
  )
}

export function PostList({ posts, locale, groupByYear = false }: { posts: PostMeta[]; locale: Locale; groupByYear?: boolean }) {
  if (!groupByYear) {
    return (
      <ul className="post-list">
        {posts.map((post) => (
          <Item key={post.slug} post={post} locale={locale} />
        ))}
      </ul>
    )
  }
  return (
    <>
      {group(posts).map(({ year, posts: items }) => (
        <section key={year} data-year={year} className="post-year">
          <h2>{year}</h2>
          <ul className="post-list">
            {items.map((post) => (
              <Item key={post.slug} post={post} locale={locale} />
            ))}
          </ul>
        </section>
      ))}
    </>
  )
}
