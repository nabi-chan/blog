import { createAirport } from "@/translate/airport"
import { blogHomeLS } from "@/translate/namespace/blog-home"
import { getLocale } from "@/translate/utils/getLocale"
import Image from "next/image"
import Link from "next/link"
import { FiArrowRight } from "react-icons/fi"

function LargeCard() {
  const { fd } = createAirport(getLocale())

  return (
    <article className="col-span-3 row-span-4 flex flex-col gap-6">
      <figure className="bg-background relative h-[400px] w-full overflow-hidden rounded-2xl">
        <Image src="" alt="" fill />
      </figure>
      <div className="flex flex-1 flex-col gap-4">
        <div className="flex flex-col gap-2">
          <h3 className="font-semibold">카테고리카테고리</h3>
          <h2 className="line-clamp-2 whitespace-pre-wrap break-words text-3xl font-bold">
            제목제목제목제목제목제목제목제목제목제목제목제목제목제목제목제목제목제목제목제목제목제목
          </h2>
        </div>
        <p className="line-clamp-3 font-semibold">
          내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용
          내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용
          내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용
        </p>
        <span className="text-sm font-semibold text-gray-600">
          {fd(new Date(), "YYYY. MM. DD.")}
        </span>
      </div>
    </article>
  )
}

function SmallCard() {
  const { fd } = createAirport(getLocale())

  return (
    <article className="col-span-2 grid grid-cols-2 gap-6">
      <figure className="bg-background relative overflow-hidden rounded-2xl">
        <Image src="" alt="" fill />
      </figure>
      <div className="flex flex-col justify-between gap-6">
        <div className="flex flex-col gap-1">
          <h3 className="text-sm font-semibold">카테고리카테고리</h3>
          <h2 className="line-clamp-3 break-words text-xl font-bold">
            제목제목제목제목제목제목제목제목제목제목제목제목제목제목제목제목제목제목제목제목제목제목
          </h2>
        </div>
        <span className="text-xs font-semibold text-gray-600">
          {fd(new Date(), "YYYY. MM. DD.")}
        </span>
      </div>
    </article>
  )
}

export default async function Home() {
  const { t } = createAirport(getLocale())

  return (
    <div className="flex flex-col gap-16 py-16">
      <section className="flex flex-col items-center gap-4">
        <Image src="/api/assets/hero" alt="🐈" width={192} height={192} />

        <h1 className="text-3xl font-bold">
          {t(blogHomeLS["blog-home.title"])}
        </h1>
        <p className="text-lg">{t(blogHomeLS["blog-home.description"])}</p>
      </section>
      <section className="grid grid-cols-5 grid-rows-4 gap-x-8 gap-y-7">
        <LargeCard />

        <SmallCard />
        <SmallCard />
        <SmallCard />
        <SmallCard />
      </section>
      <nav className="flex justify-end">
        <Link className="flex items-center gap-2 px-3 py-2" href="/posts">
          <span className="font-semibold underline underline-offset-4">
            {t(blogHomeLS["blog-home.all-posts"])}
          </span>
          <FiArrowRight className="text-xl" />
        </Link>
      </nav>
    </div>
  )
}
