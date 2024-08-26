import { createAirport } from "@/translate/airport"
import { getLocale } from "@/translate/utils/getLocale"
import Link from "next/link"

export default function NotFound() {
  const airport = createAirport(getLocale())

  return (
    <>
      <title>{airport.t("not-found.title")}</title>
      <meta name="description" content="" />

      <main className="page-root flex flex-col gap-4">
        <h2 className="text-4xl font-black">{airport.t("not-found.title")}</h2>
        <p className="whitespace-pre-wrap">
          {airport.t("not-found.description")}
        </p>
        <Link className="link" href="/">
          {airport.t("not-found.goto.index")}
        </Link>
      </main>
    </>
  )
}
