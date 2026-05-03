import type { Metadata } from "next";
import { EntryCard } from "@/src/components/EntryCard";
import { PageHeader } from "@/src/components/PageHeader";
import { getEntries, newestFirst } from "@/src/content/loader";
import { site } from "@/src/site";

export const metadata: Metadata = {
  title: "토막글",
  description: "짧게 붙여둔 생각 조각들입니다.",
  openGraph: {
    title: `토막글 · ${site.title}`,
    description: "짧게 붙여둔 생각 조각들입니다.",
    url: "/notes/",
  },
};

export default async function NotesPage() {
  const notes = newestFirst(await getEntries("notes"));

  return (
    <main className="site-shell pb-20">
      <PageHeader
        eyebrow="NOTES"
        title="토막글"
        description="사라지기 전에 붙잡아 둔 작은 문장들입니다."
      />
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {notes.map((note) => (
          <EntryCard key={note.url} entry={note} compact />
        ))}
      </div>
    </main>
  );
}
