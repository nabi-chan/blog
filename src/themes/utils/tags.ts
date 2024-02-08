import { PageMapItem } from 'nextra';
import { getPosts } from './posts';

export function getTagsFromPosts(tree: PageMapItem[]) {
  return getPosts(tree).flatMap((post) => post.frontMatter.tags ?? []);
}

export function getUniqueTags(tree: PageMapItem[]) {
  return Array.from(new Set(getTagsFromPosts(tree)));
}

export function getTagsCountMap(tree: PageMapItem[]) {
  return getTagsFromPosts(tree).reduce(
    (acc, tag) => {
      acc[tag] = (acc[tag] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );
}
