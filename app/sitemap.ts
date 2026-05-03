import type { MetadataRoute } from "next";
import { getContent } from "@/src/content/loader";
import { toSitemapDate } from "@/src/content/date";
import { site } from "@/src/site";

export const dynamic = "force-static";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { posts, notes } = await getContent();
  const now = new Date().toISOString();

  return [
    { url: `${site.url}/`, lastModified: now },
    { url: `${site.url}/posts/`, lastModified: now },
    { url: `${site.url}/notes/`, lastModified: now },
    ...posts.map((post) => ({
      url: `${site.url}${post.url}`,
      lastModified: toSitemapDate(post.dateTime),
    })),
    ...notes.map((note) => ({
      url: `${site.url}${note.url}`,
      lastModified: toSitemapDate(note.dateTime),
    })),
  ];
}
