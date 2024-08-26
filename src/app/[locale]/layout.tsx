import { AirportProvider } from "@/provider/airport"
import { Toaster } from "@/provider/react-hot-toast"
import { ReactQueryProvider } from "@/provider/react-query"
import type { Locale } from "@/translate/constant"
import type { PropsWithChildren } from "react"

export default function LocaleLayout({
  children,
  params: { locale },
}: Readonly<PropsWithChildren<{ params: { locale: Locale } }>>) {
  return (
    <AirportProvider locale={locale}>
      <ReactQueryProvider>{children}</ReactQueryProvider>
      <Toaster />
    </AirportProvider>
  )
}
