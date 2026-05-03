import Link from "next/link";
import type { EntrySummary } from "@/src/content/types";
import { formatDisplayDate } from "@/src/content/date";
import { Sticker, Tape } from "./Decorations";

export function EntryCard({
  entry,
  compact = false,
}: {
  entry: EntrySummary;
  compact?: boolean;
}) {
  return (
    <Link
      href={entry.url}
      className="focus-ring block rounded-[32px]"
      aria-label={`${entry.title} 글로 이동`}
    >
      <article
        className={`memo-card group ${compact ? "memo-card-compact" : ""}`}
      >
        <Tape />
        <div className="flex items-center justify-between gap-3 text-sm text-(--muted)">
          <time dateTime={entry.dateTime}>
            {formatDisplayDate(entry.dateTime)}
          </time>
          {entry.series ? (
            <Sticker tone="lavender">{entry.series}</Sticker>
          ) : (
            <Sticker tone={entry.kind === "posts" ? "peach" : "mint"}>
              {entry.kind === "posts" ? "블로그" : "토막글"}
            </Sticker>
          )}
        </div>
        <h2 className="mt-4 text-2xl leading-tight text-(--ink)">
          {entry.title}
        </h2>
        <p className="entry-excerpt mt-3 leading-8 text-(--muted)">
          {entry.description}
        </p>
      </article>
    </Link>
  );
}
