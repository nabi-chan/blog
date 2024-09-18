import { createAirport } from "@/translate/airport"
import { getLocale } from "@/translate/utils/getLocale"
import Image from "next/image"
import Link from "next/link"

export function Header() {
  const { t } = createAirport(getLocale())

  return (
    <header className="border-1 border-backgroundHover shadow-lv3 max-w-content sticky top-4 z-10 mx-auto flex w-full items-center justify-between rounded-lg bg-white/80 p-4 py-2 backdrop-blur-md lg:gap-32">
      <Link href="/">
        <Image src="/icon" width={32} height={32} alt="🐈" />
      </Link>
      <nav className="flex items-center gap-4">
        <Link
          className="hover:bg-background rounded p-3 font-semibold transition-colors"
          href="/posts">
          {t("nav.links.posts")}
        </Link>
        <Link
          className="hover:bg-background rounded p-3 font-semibold transition-colors"
          href="/notes">
          {t("nav.links.notes")}
        </Link>
        <Link
          className="hover:bg-background rounded p-3 font-semibold transition-colors"
          href="/tags">
          {t("nav.links.tags")}
        </Link>
      </nav>
    </header>
  )
}
