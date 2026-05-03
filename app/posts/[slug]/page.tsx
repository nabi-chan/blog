import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MarkdownContent } from "@/src/components/MarkdownContent";
import { SeriesNavigation } from "@/src/components/SeriesNavigation";
import { TableOfContents } from "@/src/components/TableOfContents";
import { formatDisplayDate } from "@/src/content/date";
import { getEntries, getEntry } from "@/src/content/loader";
import { site } from "@/src/site";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  const posts = await getEntries("posts");
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getEntry("posts", slug);
  if (!post) return {};

  return {
    title: post.title,
    description: post.description,
    openGraph: {
      type: "article",
      title: post.title,
      description: post.description,
      url: post.url,
      siteName: site.title,
    },
  };
}

export default async function PostPage({ params }: Props) {
  const { slug } = await params;
  const post = await getEntry("posts", slug);
  if (!post) notFound();

  return (
    <main className="site-shell pb-20">
      <article>
        <header className="page-header pb-8">
          <p className="sticker sticker-peach">BLOG</p>
          <h1 className="mt-6 text-4xl leading-tight text-(--ink) md:text-7xl">
            {post.title}
          </h1>
          <p className="mt-3 text-2xl leading-10 text-(--muted)">
            {post.description}
          </p>
          <time
            className="mt-5 block text-lg text-(--muted)"
            dateTime={post.dateTime}
          >
            {formatDisplayDate(post.dateTime)}
          </time>
        </header>
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-start">
          <div className="min-w-0">
            <div className="memo-card rotate-0">
              <MarkdownContent html={post.html} />
            </div>
            <div className="mt-8 space-y-7">
              <SeriesNavigation
                title={post.series}
                currentSlug={post.slug}
                entries={post.seriesEntries}
                previous={post.seriesPrevious}
                next={post.seriesNext}
              />
            </div>
          </div>
          <div className="order-first lg:sticky lg:top-8 lg:order-none lg:self-start">
            <TableOfContents items={post.toc} />
          </div>
        </div>
      </article>
    </main>
  );
}
