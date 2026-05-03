"use client";

import { Collapsible } from "@base-ui/react/collapsible";
import type { TocItem } from "@/src/content/types";

const depthClassName: Record<TocItem["depth"], string> = {
  2: "pl-0",
  3: "pl-4",
  4: "pl-7",
  5: "pl-10",
  6: "pl-12",
};

export function TableOfContents({ items }: { items: TocItem[] }) {
  return (
    <aside className="toc-card">
      <Collapsible.Root defaultOpen>
        <Collapsible.Trigger className="focus-ring flex w-full items-center justify-between rounded-2xl px-1 py-1 text-left text-lg text-(--ink) data-panel-open:[&>span:last-child]:rotate-90">
          <span>목차</span>
          <span aria-hidden="true" className="transition-transform">
            ›
          </span>
        </Collapsible.Trigger>
        <Collapsible.Panel
          keepMounted
          className="mt-3 overflow-hidden data-closed:hidden"
        >
          <nav aria-label="글 목차">
            {items.length === 0 ? (
              <p className="text-center text-(--muted)">
                표시할 내용이 없습니다.
              </p>
            ) : (
              <ol className="space-y-2">
                {items.map((item) => (
                  <li key={item.id} className={depthClassName[item.depth]}>
                    <a
                      className="focus-ring inline-block rounded-xl text-(--muted) underline decoration-(--line) underline-offset-4 transition hover:text-(--ink)"
                      href={`#${item.id}`}
                    >
                      {item.text}
                    </a>
                  </li>
                ))}
              </ol>
            )}
          </nav>
        </Collapsible.Panel>
      </Collapsible.Root>
    </aside>
  );
}
