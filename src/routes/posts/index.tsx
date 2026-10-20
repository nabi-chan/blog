import { createFileRoute } from '@tanstack/react-router'
import { m } from '~/i18n/messages'

export const Route = createFileRoute('/posts/')({
  component: Posts,
})

function Posts() {
  return (
    <main>
      <h1>{m.posts_title()}</h1>
    </main>
  )
}
