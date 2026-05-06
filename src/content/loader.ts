import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { renderMarkdown } from "@/src/markdown/render";
import { contentVersion } from "./content-version";
import type {
  Entry,
  EntryFrontmatter,
  EntryKind,
  EntrySummary,
  PageEntry,
} from "./types";
import { compareEntryDate, parseSeoulDate } from "./date";

const CONTENT_ROOT = path.join(process.cwd(), "content");
const CONTENT_VERSION_FILE = path.join(
  process.cwd(),
  "src/content/content-version.ts",
);
const RESERVED_PAGE_SEGMENTS = new Set([
  "_not-found",
  "feed.xml",
  "notes",
  "opengraph-image",
  "posts",
  "sitemap.xml",
]);

let cache:
  | Promise<{ posts: Entry[]; notes: Entry[]; pages: PageEntry[] }>
  | undefined;
let cachedContentVersion = contentVersion;
let watchingContent = false;

function touchContentVersion() {
  const nextVersion = new Date().toISOString();
  fs.writeFileSync(
    CONTENT_VERSION_FILE,
    `export const contentVersion = "${nextVersion}";\n`,
  );
}

function watchContentInDevelopment() {
  if (process.env.NODE_ENV !== "development" || watchingContent) return;
  if (!fs.existsSync(CONTENT_ROOT)) return;

  watchingContent = true;
  fs.watch(CONTENT_ROOT, { recursive: true }, (_eventType, filename) => {
    if (!filename || !filename.endsWith(".md")) return;
    touchContentVersion();
  });
}

watchContentInDevelopment();

function warn(message: string) {
  console.warn(`[content] ${message}`);
}

function isString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function slugFromFile(file: string): string {
  return path.basename(file, path.extname(file));
}

function entryUrl(kind: EntryKind, slug: string): string {
  return `/${kind}/${slug}/`;
}

function pageUrl(slug: string): string {
  return `/${slug}/`;
}

function summary(entry: Entry): EntrySummary {
  return {
    kind: entry.kind,
    slug: entry.slug,
    title: entry.title,
    description: entry.description,
    date: entry.date,
    dateTime: entry.dateTime,
    url: entry.url,
    series: entry.series,
  };
}

function listMarkdownFiles(kind: EntryKind): string[] {
  const dir = path.join(CONTENT_ROOT, kind);
  if (!fs.existsSync(dir)) return [];

  return fs
    .readdirSync(dir)
    .filter((file) => file.endsWith(".md"))
    .map((file) => path.join(dir, file));
}

function listMarkdownFilesRecursive(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];

  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(dir, entry.name);

    if (entry.isDirectory()) return listMarkdownFilesRecursive(file);
    return entry.isFile() && entry.name.endsWith(".md") ? [file] : [];
  });
}

function entryCommentEnabled(data: EntryFrontmatter): boolean {
  return data.comment !== false;
}

function pageCommentEnabled(data: EntryFrontmatter): boolean {
  return data.comment === true;
}

function tocEnabled(data: EntryFrontmatter): boolean {
  return data.toc !== false;
}

function normalizeFrontmatter(
  kind: EntryKind,
  slug: string,
  data: EntryFrontmatter,
): null | {
  title: string;
  description?: string;
  dateTime: string;
  series?: string;
  comment: boolean;
  showToc: boolean;
} {
  if (!isString(data.title)) {
    warn(`${kind}/${slug}: title이 없어 문서를 무시합니다.`);
    return null;
  }

  if (!isString(data.date) || !parseSeoulDate(data.date)) {
    warn(
      `${kind}/${slug}: date는 YYYY-MM-DD 또는 YYYY-MM-DD hh:mm:ss 형식이어야 합니다.`,
    );
    return null;
  }

  if (kind === "posts" && !isString(data.description)) {
    warn(`${kind}/${slug}: posts 문서는 description이 필요합니다.`);
    return null;
  }

  if (kind === "notes" && data.series !== undefined) {
    warn(`${kind}/${slug}: notes는 series를 지원하지 않아 문서를 무시합니다.`);
    return null;
  }

  return {
    title: data.title.trim(),
    description: isString(data.description)
      ? data.description.trim()
      : undefined,
    dateTime:
      data.date.trim().length === 10
        ? `${data.date.trim()} 00:00:00`
        : data.date.trim(),
    series:
      kind === "posts" && isString(data.series)
        ? data.series.trim()
        : undefined,
    comment: entryCommentEnabled(data),
    showToc: tocEnabled(data),
  };
}

function pageSlugFromFile(file: string): { segments: string[]; slug: string } {
  const pagesRoot = path.join(CONTENT_ROOT, "pages");
  const relative = path.relative(pagesRoot, file);
  const withoutExt = relative.slice(0, -path.extname(relative).length);
  const parts = withoutExt.split(path.sep).filter(Boolean);
  const segments = parts.at(-1) === "index" ? parts.slice(0, -1) : parts;

  return {
    segments,
    slug: segments.join("/"),
  };
}

function isReservedPagePath(segments: string[]): boolean {
  const first = segments[0];

  return !first || RESERVED_PAGE_SEGMENTS.has(first);
}

function normalizePageFrontmatter(
  slug: string,
  data: EntryFrontmatter,
): null | {
  title: string;
  description?: string;
  comment: boolean;
  showToc: boolean;
} {
  if (!isString(data.title)) {
    warn(`pages/${slug}: title이 없어 문서를 무시합니다.`);
    return null;
  }

  return {
    title: data.title.trim(),
    description: isString(data.description)
      ? data.description.trim()
      : undefined,
    comment: pageCommentEnabled(data),
    showToc: tocEnabled(data),
  };
}

async function loadKind(kind: EntryKind): Promise<Entry[]> {
  const entries = await Promise.all(
    listMarkdownFiles(kind).map(async (file): Promise<Entry | null> => {
      const slug = slugFromFile(file);
      const source = fs.readFileSync(file, "utf8");
      const parsed = matter(source);
      const frontmatter = normalizeFrontmatter(
        kind,
        slug,
        parsed.data as EntryFrontmatter,
      );
      if (!frontmatter) return null;

      const rendered = await renderMarkdown(parsed.content, {
        headingLinks: frontmatter.showToc,
      });
      const description = frontmatter.description || rendered.excerpt;

      const entry: Entry = {
        kind,
        slug,
        title: frontmatter.title,
        description,
        date: frontmatter.dateTime.slice(0, 10),
        dateTime: frontmatter.dateTime,
        url: entryUrl(kind, slug),
        html: rendered.html,
        toc: rendered.toc,
        showToc: frontmatter.showToc,
        excerpt: rendered.excerpt,
        comment: frontmatter.comment,
        ...(frontmatter.series ? { series: frontmatter.series } : {}),
      };

      return entry;
    }),
  );

  return entries
    .filter((entry): entry is Entry => entry !== null)
    .sort(compareEntryDate);
}

async function loadPages(): Promise<PageEntry[]> {
  const pagesRoot = path.join(CONTENT_ROOT, "pages");
  const entries = await Promise.all(
    listMarkdownFilesRecursive(pagesRoot).map(
      async (file): Promise<PageEntry | null> => {
        const { segments, slug } = pageSlugFromFile(file);
        if (isReservedPagePath(segments)) {
          warn(
            `pages/${slug || "index"}: 기존 라우트와 중복되어 문서를 무시합니다.`,
          );
          return null;
        }

        const source = fs.readFileSync(file, "utf8");
        const parsed = matter(source);
        const frontmatter = normalizePageFrontmatter(
          slug,
          parsed.data as EntryFrontmatter,
        );
        if (!frontmatter) return null;

        const rendered = await renderMarkdown(parsed.content, {
          headingLinks: frontmatter.showToc,
        });

        return {
          slug,
          segments,
          title: frontmatter.title,
          description: frontmatter.description || rendered.excerpt,
          url: pageUrl(slug),
          html: rendered.html,
          toc: rendered.toc,
          showToc: frontmatter.showToc,
          excerpt: rendered.excerpt,
          comment: frontmatter.comment,
        };
      },
    ),
  );

  return entries.filter((entry): entry is PageEntry => entry !== null);
}

function attachNavigation(entries: Entry[]): Entry[] {
  const bySeries = new Map<string, Entry[]>();

  for (const entry of entries) {
    if (entry.kind === "posts" && entry.series) {
      const group = bySeries.get(entry.series) || [];
      group.push(entry);
      bySeries.set(entry.series, group);
    }
  }

  for (const [, group] of bySeries) {
    group.sort(compareEntryDate);
  }

  return entries.map((entry, index) => {
    const seriesEntries = entry.series ? bySeries.get(entry.series) : undefined;
    const seriesIndex =
      seriesEntries?.findIndex((item) => item.slug === entry.slug) ?? -1;

    return {
      ...entry,
      previous: index > 0 ? summary(entries[index - 1]) : undefined,
      next:
        index < entries.length - 1 ? summary(entries[index + 1]) : undefined,
      seriesPrevious:
        seriesEntries && seriesIndex > 0
          ? summary(seriesEntries[seriesIndex - 1])
          : undefined,
      seriesNext:
        seriesEntries &&
        seriesIndex >= 0 &&
        seriesIndex < seriesEntries.length - 1
          ? summary(seriesEntries[seriesIndex + 1])
          : undefined,
      seriesEntries:
        seriesEntries && seriesEntries.length > 1
          ? seriesEntries.map(summary)
          : undefined,
    };
  });
}

export async function getContent() {
  if (process.env.NODE_ENV === "development") {
    const [posts, notes, pages] = await Promise.all([
      loadKind("posts"),
      loadKind("notes"),
      loadPages(),
    ]);

    return {
      posts: attachNavigation(posts),
      notes: attachNavigation(notes),
      pages,
    };
  }

  if (cachedContentVersion !== contentVersion) {
    cache = undefined;
    cachedContentVersion = contentVersion;
  }

  cache ||= (async () => {
    const [posts, notes, pages] = await Promise.all([
      loadKind("posts"),
      loadKind("notes"),
      loadPages(),
    ]);

    return {
      posts: attachNavigation(posts),
      notes: attachNavigation(notes),
      pages,
    };
  })();

  return cache;
}

export async function getEntries(kind: EntryKind): Promise<Entry[]> {
  const content = await getContent();
  return content[kind];
}

export async function getAllEntries(): Promise<Entry[]> {
  const content = await getContent();
  return [...content.posts, ...content.notes].sort(compareEntryDate);
}

export async function getPages(): Promise<PageEntry[]> {
  const content = await getContent();
  return content.pages;
}

export async function getPage(slug: string): Promise<PageEntry | undefined> {
  const pages = await getPages();
  return pages.find((page) => page.slug === slug);
}

export async function getEntry(
  kind: EntryKind,
  slug: string,
): Promise<Entry | undefined> {
  const entries = await getEntries(kind);
  return entries.find((entry) => entry.slug === slug);
}

export function newestFirst<T extends { dateTime: string; slug: string }>(
  entries: T[],
): T[] {
  return [...entries].sort((a, b) => compareEntryDate(b, a));
}
