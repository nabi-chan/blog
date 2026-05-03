"use client";

import Link from "next/link";
import { Collapsible } from "@base-ui/react/collapsible";
import type { EntrySummary } from "@/src/content/types";

export function SeriesNavigation({
  title,
  currentSlug,
  entries,
  previous,
  next,
}: {
  title?: string;
  currentSlug: string;
  entries?: EntrySummary[];
  previous?: EntrySummary;
  next?: EntrySummary;
}) {
  if (!title || !entries || entries.length <= 1) return null;

  const currentIndex = entries.findIndex((entry) => entry.slug === currentSlug);

  return (
    <section className="series-card">
      <Collapsible.Root defaultOpen>
        <Collapsible.Trigger className="focus-ring flex w-full items-center justify-between rounded-2xl text-left">
          <span>
            <span className="block text-sm text-(--muted)">시리즈 노트</span>
            <span className="block text-2xl text-(--ink)">{title}</span>
          </span>
          <span className="rounded-full bg-(--butter) px-3 py-1 text-sm text-(--ink)">
            {currentIndex + 1} / {entries.length}
          </span>
        </Collapsible.Trigger>
        <Collapsible.Panel keepMounted className="mt-5 data-[closed]:hidden">
          <ol className="space-y-3">
            {entries.map((entry, index) => {
              const current = entry.slug === currentSlug;
              return (
                <li key={entry.url}>
                  <Link
                    href={entry.url}
                    aria-current={current ? "page" : undefined}
                    className={`focus-ring flex items-center gap-3 rounded-2xl border border-(--line) bg-white/55 px-4 py-3 transition hover:-translate-y-0.5 hover:bg-white ${current ? "ring-2 ring-(--rose)" : ""}`}
                  >
                    <span className="flex size-8 items-center justify-center rounded-full bg-(--lavender) text-sm text-(--ink)">
                      {index + 1}
                    </span>
                    <span className="text-lg text-(--ink)">{entry.title}</span>
                  </Link>
                </li>
              );
            })}
          </ol>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {previous ? (
              <Link className="paper-button focus-ring" href={previous.url}>
                이전 편: {previous.title}
              </Link>
            ) : (
              <span />
            )}
            {next ? (
              <Link
                className="paper-button focus-ring md:text-right"
                href={next.url}
              >
                다음 편: {next.title}
              </Link>
            ) : (
              <span />
            )}
          </div>
        </Collapsible.Panel>
      </Collapsible.Root>
    </section>
  );
}
