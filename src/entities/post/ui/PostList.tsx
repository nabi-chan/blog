import { Link } from '@tanstack/react-router'
import { formatCompactDate, formatDate } from '~/shared/lib/date'
import { type PostMeta, groupByYear as group } from '../model/post-index'
import { type Locale, m } from '~/shared/i18n'

function Item({ post, locale }: { post: PostMeta; locale: Locale }) {
  return (
    <li data-post="" data-tags={post.tags.join(' ')} className="post-item">
      <Link to="/$slug" params={{ slug: post.slug }} className="post-item-title">
        {post.title}
        {/* dev 에서만 보인다. 프로덕션에는 draft 글이 없다 */}
        {post.draft && <span className="draft-badge">{m.post_draft()}</span>}
      </Link>
      <time dateTime={post.date} title={formatDate(post.date, locale)}>
        {formatCompactDate(post.date)}
      </time>
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
