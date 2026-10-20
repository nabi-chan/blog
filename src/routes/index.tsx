import { Link, createFileRoute } from '@tanstack/react-router'
import { listPostsFn } from '~/content/posts.functions'
import { m } from '~/i18n/messages'
import { getLocale } from '~/i18n/runtime'

export const Route = createFileRoute('/')({
  loader: () => listPostsFn({ data: { locale: getLocale() } }),
  component: Lobby,
})

function Lobby() {
  const { posts } = Route.useLoaderData()
  return (
    <main>
      <p>{m.lobby_intro()}</p>
      <ul>
        {posts.map((post) => (
          <li key={post.slug}>
            <Link to="/posts/$slug" params={{ slug: post.slug }}>
              {post.title}
            </Link>
          </li>
        ))}
      </ul>
      <Link to="/posts">{m.lobby_view_all()}</Link>
    </main>
  )
}
