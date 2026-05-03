import { visit } from "unist-util-visit";

type HastElement = {
  type: "element";
  tagName: string;
  properties?: Record<string, unknown>;
};

function isExternalHref(value: unknown): value is string {
  return typeof value === "string" && /^https?:\/\//.test(value);
}

export function rehypeExternalLinks() {
  return (tree: any) => {
    visit(tree, "element", (node: HastElement) => {
      if (node.tagName !== "a") return;
      if (!isExternalHref(node.properties?.href)) return;

      node.properties ||= {};
      node.properties.target = "_blank";
      node.properties.rel = "noreferrer noopener";
    });
  };
}
