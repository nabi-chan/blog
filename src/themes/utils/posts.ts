import { PageMapItem } from "nextra";

export function flattenTree(tree: PageMapItem[]) {
  return tree.flatMap((item) =>
    item.kind === "Folder" ? flattenTree(item.children) : item
  );
}
