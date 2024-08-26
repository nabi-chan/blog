"use client"

import { LOCALES } from "@/translate/constant"
import { globalLS } from "@/translate/namespace/global"
import { AirportProvider as BaseAirportProvider } from "airport-react"
import { notFound } from "next/navigation"
import type { Locale } from "@/translate/constant"
import type { PropsWithChildren } from "react"

export function AirportProvider({
  locale,
  children,
}: PropsWithChildren<{ locale: Locale }>) {
  if (LOCALES.includes(locale) === false) {
    notFound()
  }

  return (
    <BaseAirportProvider
      locale={locale}
      supportedLocales={LOCALES}
      fallbackLocale={LOCALES[0]}
      globalLS={globalLS}>
      {children}
    </BaseAirportProvider>
  )
}
