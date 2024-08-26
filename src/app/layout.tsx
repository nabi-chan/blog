import "./globals.css"

import { createAirport } from "@/translate/airport"
import { getLocale } from "@/translate/utils/getLocale"
import type { PropsWithChildren } from "react"

export function generateMetadata() {
  const airport = createAirport(getLocale())

  return {
    title: airport.t("global.title"),
    description: airport.t("global.description"),
  }
}

export default function GlobalLayout({
  children,
}: Readonly<PropsWithChildren>) {
  const locale = getLocale()

  return (
    <html lang={locale}>
      <body>{children}</body>
    </html>
  )
}
