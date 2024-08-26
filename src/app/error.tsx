"use client"

import "./globals.css"

import { createAirport } from "@/translate/airport"
import { useLocale } from "@/translate/utils/useLocale"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error
  reset: () => void
}) {
  const locale = useLocale()
  const airport = createAirport(locale)

  return (
    <html lang={locale}>
      <body>
        <main className="page-root flex flex-col gap-4">
          <h2 className="text-4xl font-black">{airport.t("error.title")}</h2>
          <p className="whitespace-pre-wrap">
            {airport.t("error.description", {
              errorName: error.name,
              errorMessage: error.message,
            })}
          </p>
          <button
            className="link inline-block"
            onClick={() => {
              reset()
            }}>
            {airport.t("error.retry")}
          </button>
        </main>
      </body>
    </html>
  )
}
