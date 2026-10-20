import { Link } from '@tanstack/react-router'
import type { ReactNode } from 'react'
import { m } from '~/shared/i18n'
import { site } from '~/shared/config'
import { LanguageMenu } from './LanguageMenu'
import { ViewCountsProvider } from '~/features/view-count'

export function Layout({ children }: { children: ReactNode }) {
  return (
    // 조회수는 화면마다 여기서 한 번 센다. 표시는 Lobby(사이트 오늘·전체)와 Post(글별)가 한다
    <ViewCountsProvider>
      <div className="site">
        <header className="site-header">
          <Link to="/" className="site-name">
            {site.name}
          </Link>
          <nav className="site-nav">
            <Link to="/posts">{m.nav_posts()}</Link>
            <LanguageMenu />
          </nav>
        </header>
        {children}
        {/* 소셜 링크가 정해지면 푸터를 그린다 (site.socials) */}
        {site.socials.length > 0 && (
          <footer className="site-footer">
            <ul className="site-socials">
              {site.socials.map((social) => (
                <li key={social.href}>
                  <a href={social.href}>{social.label}</a>
                </li>
              ))}
            </ul>
          </footer>
        )}
      </div>
    </ViewCountsProvider>
  )
}
