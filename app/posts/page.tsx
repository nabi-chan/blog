import type { Metadata } from "next";
import { EntryCard } from "@/src/components/EntryCard";
import { PageHeader } from "@/src/components/PageHeader";
import { getEntries, newestFirst } from "@/src/content/loader";
import { site } from "@/src/site";

export const metadata: Metadata = {
  title: "블로그",
  description: "길게 남긴 생각을 모아둔 블로그 글 목록입니다.",
  openGraph: {
    title: `블로그 · ${site.title}`,
    description: "길게 남긴 생각을 모아둔 블로그 글 목록입니다.",
    url: "/posts/",
  },
};

export default async function PostsPage() {
  const posts = newestFirst(await getEntries("posts"));

  return (
    <main className="site-shell pb-20">
      <PageHeader
        eyebrow="BLOG"
        title="블로그"
        description="조금 길게 남겨둔 생각과 시행착오입니다."
      />
      <div className="grid gap-7 md:grid-cols-2">
        {posts.map((post) => (
          <EntryCard key={post.url} entry={post} />
        ))}
      </div>
    </main>
  );
}
