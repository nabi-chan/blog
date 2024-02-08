import { ReactNode } from 'react';
import { BaseLayout } from './Base';
import { MDXRenderer } from '../components/MdxRenderer';
import { useBlogContext } from '../contexts/blogContext';
import { flattenTree, isActivePost } from '../utils/posts';
import { MdxFile } from 'nextra';
import { FrontMatter } from '../types/types';
import { Link } from '../components/Link';
import { Badge } from '../components/Badge';

interface TagsLayoutProps {
  children: ReactNode;
}

export function TagsLayout({ children }: TagsLayoutProps) {
  const { opts } = useBlogContext();

  const tagCountMap = flattenTree(opts.pageMap)
    .map((page) => page as MdxFile<FrontMatter>)
    .filter((page) => page.frontMatter?.layout === 'post')
    .filter(isActivePost)
    .flatMap((page) => page.frontMatter.tags ?? [])
    .reduce(
      (acc, tag) => {
        if (!acc[tag]) {
          acc[tag] = 0;
        }
        acc[tag] += 1;

        return acc;
      },
      {} as Record<string, number>,
    );

  return (
    <BaseLayout className="flex flex-col gap-4">
      <MDXRenderer>{children}</MDXRenderer>
      <ul className="flex gap-2 flex-wrap">
        {Object.entries(tagCountMap)
          .sort(([tagA], [tagB]) => tagA.localeCompare(tagB, 'ko'))
          .sort(([, countA], [, countB]) => countB - countA)
          .map(([tag, count]) => (
            <li key={tag}>
              <Link href={`/tag/${tag}`}>
                <Badge>
                  #{tag} ({count})
                </Badge>
              </Link>
            </li>
          ))}
      </ul>
    </BaseLayout>
  );
}
