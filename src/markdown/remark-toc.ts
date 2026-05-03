import { romanize } from "es-hangul";
import { visit } from "unist-util-visit";
import type { TocItem } from "@/src/content/types";

type TocDepth = TocItem["depth"];

type MdastText = {
  type: "text" | "inlineCode";
  value: string;
};

type MdastHeading = {
  type: "heading";
  depth: number;
  children: Array<MdastText | { type: string }>;
  data?: {
    hProperties?: Record<string, unknown>;
  };
};

type VFileLike = {
  data: Record<string, unknown>;
};

function toText(node: MdastHeading): string {
  return node.children
    .map((child) => {
      if (child.type === "text" || child.type === "inlineCode") {
        return "value" in child ? child.value : "";
      }
      return "";
    })
    .join("")
    .trim();
}

function toSlug(value: string): string {
  const romanized = romanize(value)
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

  return romanized || "section";
}

function isTocDepth(depth: number): depth is TocDepth {
  return depth >= 2 && depth <= 6;
}

export function remarkToc() {
  return (tree: any, file: VFileLike) => {
    const toc: TocItem[] = [];
    const used = new Map<string, number>();

    visit(tree, "heading", (node: MdastHeading) => {
      if (!isTocDepth(node.depth)) return;

      const text = toText(node);
      if (!text) return;

      const baseId = toSlug(text);
      const count = used.get(baseId) ?? 0;
      used.set(baseId, count + 1);

      const id = count === 0 ? baseId : `${baseId}-${count + 1}`;
      node.data ||= {};
      node.data.hProperties = {
        ...(node.data.hProperties as Record<string, unknown> | undefined),
        id,
      };

      toc.push({ id, text, depth: node.depth });
    });

    file.data.toc = toc;
  };
}
