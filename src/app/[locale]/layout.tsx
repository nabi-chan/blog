import { AirportProvider } from "@/provider/airport"
import { Toaster } from "@/provider/react-hot-toast"
import { ReactQueryProvider } from "@/provider/react-query"
import type { Locale } from "@/translate/constant"
import type { PropsWithChildren, ReactNode } from "react"

export default function LocaleLayout({
  blog,
  params: { locale },
}: Readonly<
  PropsWithChildren<{ blog: ReactNode; params: { locale: Locale } }>
>) {
  return (
    <AirportProvider locale={locale}>
      <ReactQueryProvider>{blog}</ReactQueryProvider>
      <Toaster />
    </AirportProvider>
  )
}
