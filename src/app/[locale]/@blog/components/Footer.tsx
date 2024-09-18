import Link from "next/link"
import { FiFile, FiGithub, FiRss } from "react-icons/fi"

export function Footer() {
  return (
    <footer className="bg-background -mx-4 -mb-4 px-4">
      <div className="max-w-content mx-auto flex w-full justify-end p-12">
        <div className="flex flex-col gap-4">
          <div className="flex justify-end gap-4 text-lg">
            <Link href="https://github.com/nabi-chan" className="button">
              <FiGithub />
            </Link>
            <Link href="/resume" className="button">
              <FiFile />
            </Link>
            <Link href="/rss.xml" className="button">
              <FiRss />
            </Link>
          </div>
          <p className="text-xs font-light text-[#888]">
            Copyright © nabi-chan, All right reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
