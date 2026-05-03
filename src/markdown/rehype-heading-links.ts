import { visit } from "unist-util-visit";

type HastText = { type: "text"; value: string };

type HastElement = {
  type: "element";
  tagName: string;
  properties?: Record<string, unknown>;
  children?: HastChild[];
};

type HastChild = HastElement | HastText | { type: string };

function isElement(node: HastChild): node is HastElement {
  return node.type === "element";
}

function isText(node: HastChild): node is HastText {
  return node.type === "text" && "value" in node;
}

function isHeading(tagName: string): boolean {
  return /^h[2-6]$/.test(tagName);
}

function toText(node: HastChild): string {
  if (isText(node)) return node.value;
  if (!isElement(node)) return "";

  return (node.children || []).map(toText).join("");
}

function hasHeadingAnchor(node: HastElement): boolean {
  return (node.children || []).some((child) => {
    if (!isElement(child) || child.tagName !== "a") return false;

    const className = child.properties?.className;
    return Array.isArray(className) && className.includes("heading-anchor");
  });
}

export function rehypeHeadingLinks() {
  return (tree: any) => {
    visit(tree, "element", (node: HastElement) => {
      if (!isHeading(node.tagName)) return;
      if (typeof node.properties?.id !== "string") return;
      if (hasHeadingAnchor(node)) return;

      const text = toText(node).trim() || node.properties.id;

      node.children ||= [];
      node.children.push({
        type: "element",
        tagName: "a",
        properties: {
          ariaLabel: `${text} 섹션 링크`,
          className: ["heading-anchor"],
          href: `#${node.properties.id}`,
        },
        children: [{ type: "text", value: "#" }],
      });
    });
  };
}
