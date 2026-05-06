import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Comments } from "@/src/components/Comments";
import { MarkdownContent } from "@/src/components/MarkdownContent";
import { TableOfContents } from "@/src/components/TableOfContents";
import { formatDisplayDate } from "@/src/content/date";
import { getEntries, getEntry } from "@/src/content/loader";
import { site } from "@/src/site";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  const notes = await getEntries("notes");
  return notes.map((note) => ({ slug: note.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const note = await getEntry("notes", slug);
  if (!note) return {};

  return {
    title: note.title,
    description: note.description,
    openGraph: {
      type: "article",
      title: note.title,
      description: note.description,
      url: note.url,
      siteName: site.title,
    },
  };
}

export default async function NotePage({ params }: Props) {
  const { slug } = await params;
  const note = await getEntry("notes", slug);
  if (!note) notFound();

  return (
    <main className="site-shell pb-20">
      <article>
        <header className="page-header pb-8">
          <p className="sticker sticker-mint">NOTE</p>
          <h1 className="mt-6 text-4xl leading-tight text-(--ink) md:text-7xl">
            {note.title}
          </h1>
          <p className="mt-3 text-2xl leading-10 text-(--muted)">
            {note.description}
          </p>
          <time
            className="mt-5 block text-lg text-(--muted)"
            dateTime={note.dateTime}
          >
            {formatDisplayDate(note.dateTime)}
          </time>
        </header>
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-start">
          <div className="min-w-0">
            <div className="memo-card rotate-0">
              <MarkdownContent html={note.html} />
            </div>
            <Comments entryKind="notes" entrySlug={note.slug} />
          </div>
          <div className="order-first lg:sticky lg:top-8 lg:order-none lg:self-start">
            <TableOfContents items={note.toc} />
          </div>
        </div>
      </article>
    </main>
  );
}
