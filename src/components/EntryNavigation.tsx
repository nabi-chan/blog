import Link from "next/link";
import type { EntrySummary } from "@/src/content/types";

export function EntryNavigation({
  previous,
  next,
  previousLabel = "이전 글",
  nextLabel = "다음 글",
}: {
  previous?: EntrySummary;
  next?: EntrySummary;
  previousLabel?: string;
  nextLabel?: string;
}) {
  if (!previous && !next) return null;

  return (
    <nav className="grid gap-4 md:grid-cols-2" aria-label="이전 다음 글">
      <NavButton label={previousLabel} entry={previous} align="left" />
      <NavButton label={nextLabel} entry={next} align="right" />
    </nav>
  );
}

function NavButton({
  label,
  entry,
  align,
}: {
  label: string;
  entry?: EntrySummary;
  align: "left" | "right";
}) {
  if (!entry) return <div className="hidden md:block" />;

  return (
    <Link
      href={entry.url}
      className={`paper-button focus-ring ${align === "right" ? "md:text-right" : ""}`}
    >
      <span className="block text-sm text-(--muted)">{label}</span>
      <span className="mt-1 block text-xl text-(--ink)">{entry.title}</span>
    </Link>
  );
}
