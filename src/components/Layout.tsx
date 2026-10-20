import { Link } from '@tanstack/react-router'
import type { ReactNode } from 'react'
import { m } from '~/i18n/messages'
import { site } from '~/site'
import { LanguageSwitch } from './LanguageSwitch'
import { ViewCount, ViewCountsProvider, useViewCounts } from './ViewCounts'

export function Layout({ children }: { children: ReactNode }) {
  return (
    <ViewCountsProvider>
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
        <SiteFooter />
      </div>
    </ViewCountsProvider>
  )
}

function SiteFooter() {
  const counts = useViewCounts()
  return (
    <footer className="site-footer">
      <ViewCount label={m.view_site_label()} value={counts.site} />
      {/* 소셜 링크는 정해지면 site.socials 에 채운다 */}
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
  )
}
