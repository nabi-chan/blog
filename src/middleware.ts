import { LOCALES } from "./translate/constant"
import { match } from "@formatjs/intl-localematcher"
import Negotiator from "negotiator"
import { I18NProvider } from "next/dist/server/future/helpers/i18n-provider"
import { NextResponse } from "next/server"
import type { Locale } from "./translate/constant"
import type { NextRequest } from "next/server"

function getLocaleFromHeaders(headers: Headers) {
  const acceptLanguage = headers.get("accept-language")
  if (acceptLanguage === null) {
    return LOCALES[0]
  }

  const locale = new Negotiator({
    headers: { "accept-language": acceptLanguage },
  }).languages()

  return match(locale, LOCALES, LOCALES[0]) as Locale
}

export function middleware(request: NextRequest) {
  const requestHeaders = new Headers(request.headers)
  const { pathname } = request.nextUrl

  const { detectedLocale } = new I18NProvider({
    locales: LOCALES as unknown as string[],
    defaultLocale: LOCALES[0],
  }).analyze(request.nextUrl.pathname)

  if (detectedLocale === undefined) {
    const locale = getLocaleFromHeaders(request.headers)
    request.nextUrl.pathname = `/${locale}${pathname}`
    requestHeaders.set("x-locale", locale)

    // Note: /en 으로 요청한 경우에 /ko/en 으로 리다이렉트 하지 않고 /ko 로 리다이렉트 하도록
    if (pathname.split("/")[1]?.match(/^[a-z]{2}(-[A-Z]{2})?$/)) {
      request.nextUrl.pathname = `/${locale}`
    }

    return NextResponse.redirect(request.nextUrl, {
      headers: requestHeaders,
    })
  }

  requestHeaders.set("x-locale", detectedLocale)
  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|icon|sitemap.xml|robots.txt|assets|rss.xml|api).*)",
  ],
}
