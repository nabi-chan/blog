import { LOCALES } from "./constant"
import { globalLS } from "./namespace/global"
import { Airport } from "airport-js"
import type { Locale } from "./constant"

export const createAirport = (locale: Locale) => {
  return new Airport({
    locale,
    globalLS,
    supportedLocales: LOCALES,
    fallbackLocale: LOCALES[0],
  })
}
