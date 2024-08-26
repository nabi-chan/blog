import { LOCALES } from "@/translate/constant"
import { I18NProvider } from "next/dist/server/future/helpers/i18n-provider"
import { headers } from "next/headers"
import type { Locale } from "@/translate/constant"

export function detectLocale() {
  try {
    const { detectedLocale } = new I18NProvider({
      defaultLocale: LOCALES[0],
      locales: LOCALES as unknown as string[],
    }).analyze(new URL(headers().get("referer") ?? "").pathname)

    return detectedLocale as Locale | undefined
  } catch {
    return undefined
  }
}
