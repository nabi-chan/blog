import { createAirport } from "@/translate/airport"
import { blogHomeLS } from "@/translate/namespace/blog-home"
import { getLocale } from "@/translate/utils/getLocale"
import Image from "next/image"
import Link from "next/link"
import { FiArrowRight } from "react-icons/fi"

function LargeCard() {
  const { fd } = createAirport(getLocale())

  return (
    <article className="flex flex-col gap-6 lg:col-span-3 lg:row-span-4">
      <figure className="relative h-auto w-full max-lg:aspect-video lg:h-full">
        <Image
          fill
          src=""
          alt=""
          className="border-1 rounded-2xl border-slate-200 bg-slate-200"
        />
      </figure>
      <div className="flex flex-col gap-4">
        <div className="grid gap-2">
          <h3 className="truncate font-semibold">
            카테고리카테고리카테고리카테고리카테고리카테고리카테고리카테고리카테고리카테고리카테고리카테고리카테고리카테고리카테고리카테고리카테고리카테고리카테고리카테고리카테고리
          </h3>
          <h2 className="line-clamp-2 !break-all text-2xl font-bold">
            제목제목제목제목제목제목제목제목제목제목제목제목제목제목제목제목제목제목제목제목제목제목제목제목제목제목제목제목제목제목제목제목제목제목제목제목제목제목제목제목제목제목
          </h2>
        </div>
        <p className="line-clamp-3 !break-all font-semibold">
          내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용
        </p>
        <span className="text-xs font-semibold text-[#666]">
          {fd(new Date(), "YYYY. MM. DD.")}
        </span>
      </div>
    </article>
  )
}

function SmallCard() {
  const { fd } = createAirport(getLocale())

  return (
    <article className="grid auto-rows-auto gap-6 lg:col-span-2 lg:grid-cols-2 lg:gap-3">
      <figure className="relative h-auto w-full max-lg:aspect-video lg:h-full">
        <Image
          fill
          src=""
          alt=""
          className="border-1 rounded-2xl border-slate-200 bg-slate-200"
        />
      </figure>
      <div className="grid gap-8">
        <div className="grid gap-2">
          <h3 className="truncate font-semibold">
            카테고리카테고리카테고리카테고리카테고리카테고리카테고리카테고리카테고리카테고리카테고리카테고리카테고리카테고리카테고리카테고리카테고리카테고리카테고리카테고리카테고리
          </h3>
          <h2 className="line-clamp-2 !break-all text-2xl font-bold lg:text-xl">
            제목제목제목제목제목제목제목제목제목제목제목제목제목제목제목제목제목제목제목제목제목제목제목제목제목제목제목제목제목제목제목제목제목제목제목제목제목제목제목제목제목제목
          </h2>
        </div>
        <span className="text-xs font-semibold text-[#666]">
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

        <h1 className="text-center text-2xl font-bold lg:text-3xl">
          {t(blogHomeLS["blog-home.title"])}
        </h1>
        <p className="text-lg">{t(blogHomeLS["blog-home.description"])}</p>
      </section>
      <section className="grid auto-rows-auto gap-12 lg:grid-cols-5 lg:gap-x-8 lg:gap-y-7">
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
