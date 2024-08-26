import { LOCALES } from "../constant"
import { useParams } from "next/navigation"
import type { Locale } from "../constant"

export function useLocale() {
  return (useParams().locale as Locale) ?? LOCALES[0]
}
