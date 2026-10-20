import { createFileRoute } from '@tanstack/react-router'

// Task 4 에서 글 본문을 붙인다. 지금은 Lobby 링크가 가리킬 자리만 둔다
export const Route = createFileRoute('/posts/$slug')({
  component: Post,
})

function Post() {
  const { slug } = Route.useParams()
  return <main>{slug}</main>
}
