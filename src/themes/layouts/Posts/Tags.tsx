import { Badge } from '@/themes/components/Badge';
import { Link } from '@/themes/components/Link';
import { useBlogContext } from '@/themes/contexts/blogContext';
import { getUniqueTags } from '@/themes/utils/tags';

export function Tags() {
  const { opts } = useBlogContext();
  const tags = getUniqueTags(opts.pageMap);

  return (
    <aside className="flex flex-col gap-2">
      <h1 className="text-xl font-bold">태그 목록</h1>
      <ul className="flex flex-wrap gap-2">
        {tags.slice(0, 10).map((tag) => (
          <li key={tag}>
            <Link href={`/tag/${tag}`}>
              <Badge className="text-sm">#{tag}</Badge>
            </Link>
          </li>
        ))}
        <Link href="/tags" className="text-sm text-zinc-500">
          더보기
        </Link>
      </ul>
    </aside>
  );
}
