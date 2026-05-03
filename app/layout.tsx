import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { site, routes } from "@/src/site";
import { contentVersion } from "@/src/content/content-version";

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: site.title,
    template: `%s · ${site.title}`,
  },
  description: site.description,
  openGraph: {
    type: "website",
    siteName: site.title,
    title: site.title,
    description: site.description,
    url: site.url,
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko" data-scroll-behavior="smooth">
      <body>
        <div
          className="root min-h-screen"
          data-content-version={contentVersion}
        >
          <div className="pastel-orbs" aria-hidden="true" />
          <header className="site-shell site-nav">
            <Link
              href={routes.home}
              className="focus-ring rounded-2xl text-3xl text-(--ink)"
            >
              {site.title}
            </Link>
            <nav aria-label="주요 메뉴" className="flex gap-2">
              <Link className="nav-pill focus-ring" href={routes.posts}>
                블로그
              </Link>
              <Link className="nav-pill focus-ring" href={routes.notes}>
                토막글
              </Link>
            </nav>
          </header>
          {children}
          <footer className="site-shell py-14 text-center text-lg text-(--muted)">
            <p>작은 생각을 모아 붙여두는 곳 · nabi.kim</p>
          </footer>
        </div>
      </body>
    </html>
  );
}
