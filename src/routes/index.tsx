import { Link, createFileRoute } from '@tanstack/react-router'
import { m } from '~/i18n/messages'

export const Route = createFileRoute('/')({
  component: Lobby,
})

function Lobby() {
  return (
    <main>
      <p>{m.lobby_intro()}</p>
      <Link to="/posts">{m.lobby_view_all()}</Link>
    </main>
  )
}
