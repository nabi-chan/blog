import { ReactNode } from 'react';
import { BaseLayout } from './Base';
import { MDXRenderer } from '../components/MdxRenderer';
import { useBlogContext } from '../contexts/blogContext';
import { Link } from '../components/Link';
import { Badge } from '../components/Badge';
import { getTagsCountMap } from '../utils/tags';

interface TagsLayoutProps {
  children: ReactNode;
}

export function TagsLayout({ children }: TagsLayoutProps) {
  const { opts } = useBlogContext();

  const tagCountMap = getTagsCountMap(opts.pageMap);

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
