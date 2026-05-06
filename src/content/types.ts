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
  showToc: boolean;
  comment: boolean;
  previous?: EntrySummary;
  next?: EntrySummary;
  seriesPrevious?: EntrySummary;
  seriesNext?: EntrySummary;
  seriesEntries?: EntrySummary[];
};

export type PageEntry = {
  slug: string;
  segments: string[];
  title: string;
  description: string;
  url: string;
  html: string;
  excerpt: string;
  toc: TocItem[];
  showToc: boolean;
  comment: boolean;
};

export type EntryFrontmatter = {
  title?: unknown;
  description?: unknown;
  date?: unknown;
  series?: unknown;
  comment?: unknown;
  toc?: unknown;
};
