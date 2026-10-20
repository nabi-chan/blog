import { Link, createFileRoute } from '@tanstack/react-router'
import { PostList } from '~/components/PostList'
import { listPostsFn } from '~/content/posts.functions'
import { m } from '~/i18n/messages'
import { getLocale } from '~/i18n/runtime'

const RECENT_COUNT = 5

export const Route = createFileRoute('/')({
  loader: () => listPostsFn({ data: { locale: getLocale() } }),
  component: Lobby,
})

function Lobby() {
  const { posts } = Route.useLoaderData()
  const locale = getLocale()
  return (
    <main className="lobby">
      <p className="lobby-intro">{m.lobby_intro()}</p>
      <section>
        <h2>{m.lobby_recent_posts()}</h2>
        {posts.length === 0 ? (
          <p>{m.posts_empty()}</p>
        ) : (
          <PostList posts={posts.slice(0, RECENT_COUNT)} locale={locale} />
        )}
      </section>
      <Link to="/posts">{m.lobby_view_all()}</Link>
    </main>
  )
}
