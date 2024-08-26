import { LOCALES } from "../constant"
import { headers } from "next/headers"
import type { Locale } from "../constant"

export function getLocale() {
  return (headers().get("x-locale") ?? LOCALES[0]) as Locale
}
