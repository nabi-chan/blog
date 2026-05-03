export type EntryKind = "posts" | "notes";

export type TocItem = {
  id: string;
  text: string;
  depth: 2 | 3 | 4 | 5 | 6;
};

export type EntrySummary = {
  kind: EntryKind;
  slug: string;
  title: string;
  description: string;
  date: string;
  dateTime: string;
  url: string;
  series?: string;
};

export type Entry = EntrySummary & {
  html: string;
  excerpt: string;
  toc: TocItem[];
  previous?: EntrySummary;
  next?: EntrySummary;
  seriesPrevious?: EntrySummary;
  seriesNext?: EntrySummary;
  seriesEntries?: EntrySummary[];
};

export type EntryFrontmatter = {
  title?: unknown;
  description?: unknown;
  date?: unknown;
  series?: unknown;
};
