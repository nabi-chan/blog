import { Footer } from "./components/Footer"
import { Header } from "./components/Header"
import { setTimeout } from "timers/promises"
import type { PropsWithChildren } from "react"

export default async function BlogLayout({ children }: PropsWithChildren) {
  await setTimeout(2525)

  return (
    <>
      <div className="page-root flex flex-col">
        <Header />
        <main className="max-w-content mx-auto w-full flex-1 px-16">
          {children}
        </main>
        <Footer />
      </div>
    </>
  )
}
