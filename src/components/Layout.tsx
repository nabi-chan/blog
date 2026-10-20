import { Link } from '@tanstack/react-router'
import type { ReactNode } from 'react'
import { m } from '~/i18n/messages'
import { site } from '~/site'
import { LanguageSwitch } from './LanguageSwitch'

export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="site">
      <header className="site-header">
        <Link to="/" className="site-name">
          {site.name}
        </Link>
        <nav className="site-nav">
          <Link to="/posts">{m.nav_posts()}</Link>
          <LanguageSwitch />
        </nav>
      </header>
      {children}
      <footer className="site-footer">
        <p>
          {m.footer_license()}{' '}
          <a href={site.license.url} rel="license">
            {site.license.name}
          </a>
        </p>
        {site.socials.length > 0 && (
          <ul className="site-socials">
            {site.socials.map((social) => (
              <li key={social.href}>
                <a href={social.href}>{social.label}</a>
              </li>
            ))}
          </ul>
        )}
      </footer>
    </div>
  )
}
