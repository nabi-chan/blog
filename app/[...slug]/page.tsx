import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Comments } from "@/src/components/Comments";
import { MarkdownCards } from "@/src/components/MarkdownContent";
import { PageHeader } from "@/src/components/PageHeader";
import { TableOfContents } from "@/src/components/TableOfContents";
import { getPage, getPages } from "@/src/content/loader";
import { site } from "@/src/site";

type Props = { params: Promise<{ slug: string[] }> };

export const dynamicParams = false;

function slugFromParams(slug: string[]): string {
  return slug.join("/");
}

export async function generateStaticParams() {
  const pages = await getPages();
  const params = pages.map((page) => ({ slug: page.segments }));

  if (process.env.NODE_ENV === "development") {
    params.push({ slug: ["[...slug]"] });
  }

  return params;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const page = await getPage(slugFromParams(slug));
  if (!page) return {};

  return {
    title: page.title,
    description: page.description,
    openGraph: {
      type: "article",
      title: page.title,
      description: page.description,
      url: page.url,
      siteName: site.title,
    },
  };
}

export default async function MarkdownPage({ params }: Props) {
  const { slug } = await params;
  const page = await getPage(slugFromParams(slug));
  if (!page) notFound();

  return (
    <main className="site-shell pb-20">
      <article>
        <PageHeader
          eyebrow="PAGE"
          title={page.title}
          description={page.description}
        />
        <div
          className={`grid gap-8 lg:items-start ${page.showToc ? "lg:grid-cols-[minmax(0,1fr)_280px]" : ""}`}
        >
          <div className="min-w-0">
            <MarkdownCards html={page.html} />
            {page.comment ? (
              <Comments entryKind="pages" entrySlug={page.slug} />
            ) : null}
          </div>
          {page.showToc ? (
            <div className="order-first lg:sticky lg:top-8 lg:order-none lg:self-start">
              <TableOfContents items={page.toc} />
            </div>
          ) : null}
        </div>
      </article>
    </main>
  );
}
