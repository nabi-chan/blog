import { Link } from '@tanstack/react-router'
import { m } from '~/shared/i18n'

export function NotFound() {
  return (
    <main className="not-found">
      <h1 className="display">{m.not_found_title()}</h1>
      <p>{m.not_found_description()}</p>
      <Link to="/">{m.not_found_back_home()}</Link>
    </main>
  )
}
