import { eq, get, isEmpty } from 'lodash-es';
import { MdxFile, PageMapItem } from 'nextra';
import { FrontMatter } from 'Themes/types/types';

export function flattenTree(tree: PageMapItem[]): PageMapItem[] {
  return tree.flatMap((item) => (item.kind === 'Folder' ? flattenTree(item.children) : item));
}

export function isActivePost(postMeta: MdxFile<FrontMatter>) {
  return [!isEmpty(postMeta.frontMatter.title), eq(get(postMeta.frontMatter, 'draft', false), false)].every(
    (conditional) => conditional === true,
  );
}

export function sortPostsByDate(postA: MdxFile<FrontMatter>, postB: MdxFile<FrontMatter>) {
  return new Date(get(postB.frontMatter, 'date', 0)).getTime() - new Date(get(postA.frontMatter, 'date', 0)).getTime();
}

export function isPublishedThisWeek(date: string) {
  const postDate = new Date(date);
  const today = new Date();
  const oneWeekAgo = new Date(today.setDate(today.getDate() - 7));

  return postDate > oneWeekAgo;
}

export function getPosts(tree: PageMapItem[]) {
  return flattenTree(tree)
    .map((page) => page as MdxFile<FrontMatter>)
    .filter((page) => page.frontMatter?.layout === 'post')
    .filter(isActivePost)
    .sort(sortPostsByDate);
}
