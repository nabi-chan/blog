import { getAllEntries } from "@/src/content/loader";
import { toRssDate } from "@/src/content/date";
import { site } from "@/src/site";

export const dynamic = "force-static";

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET() {
  const entries = (await getAllEntries()).reverse();
  const items = entries
    .map((entry) => {
      const url = `${site.url}${entry.url}`;
      return `
        <item>
          <title>${escapeXml(entry.title)}</title>
          <link>${escapeXml(url)}</link>
          <guid>${escapeXml(url)}</guid>
          <pubDate>${toRssDate(entry.dateTime)}</pubDate>
          <description>${escapeXml(entry.description)}</description>
          <category>${entry.kind === "posts" ? "blog" : "note"}</category>
        </item>`;
    })
    .join("");

  const xml = `<?xml version="1.0" encoding="UTF-8" ?>
    <rss version="2.0">
      <channel>
        <title>${escapeXml(site.title)}</title>
        <link>${escapeXml(site.url)}</link>
        <description>${escapeXml(site.description)}</description>
        <language>ko-KR</language>
        ${items}
      </channel>
    </rss>`;

  return new Response(xml.trim(), {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
    },
  });
}
