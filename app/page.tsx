import Link from "next/link";
import { EntryCard } from "@/src/components/EntryCard";
import { PageHeader } from "@/src/components/PageHeader";
import { getContent, newestFirst } from "@/src/content/loader";
import { routes, site } from "@/src/site";

export default async function HomePage() {
  const { posts, notes } = await getContent();
  const latest = newestFirst([...posts, ...notes]).slice(0, 10);

  return (
    <main className="site-shell pb-20">
      <PageHeader
        eyebrow="NABI JOURNAL"
        title={site.title}
        description={site.description}
      />
      <section className="grid gap-6 md:grid-cols-2">
        <Link
          href={routes.posts}
          className="memo-card focus-ring block bg-[rgba(255,213,194,0.38)]"
        >
          <span className="sticker sticker-peach">블로그</span>
          <h2 className="mt-5 text-3xl text-(--ink)">길게 남긴 생각</h2>
          <p className="mt-4 text-xl leading-9 text-(--muted)">
            기술, 결정, 시행착오를 조금 더 천천히 정리합니다.
          </p>
        </Link>
        <Link
          href={routes.notes}
          className="memo-card focus-ring block bg-[rgba(201,242,223,0.38)]"
        >
          <span className="sticker sticker-mint">토막글</span>
          <h2 className="mt-5 text-3xl text-(--ink)">짧게 붙인 메모</h2>
          <p className="mt-4 text-xl leading-9 text-(--muted)">
            사라지기 전에 붙잡아 둔 작은 문장들입니다.
          </p>
        </Link>
      </section>
      <section className="mt-16">
        <h2 className="text-4xl text-(--ink)">최근 붙인 메모</h2>
        <div className="mt-8 grid gap-7 md:grid-cols-2">
          {latest.map((entry) => (
            <EntryCard key={entry.url} entry={entry} compact />
          ))}
        </div>
      </section>
    </main>
  );
}
