import { BaseLayout } from './Base';
import { useRouter } from 'next/router';
import tagsDescription from '@/constants/tags.json';
import { useBlogContext } from '../contexts/blogContext';
import { getPosts } from '../utils/posts';
import { Post } from '../components/Post';

export function TagLayout() {
  const { query } = useRouter();
  const { opts } = useBlogContext();

  const tag = query.slug as string;
  const tagDescription = tagsDescription[tag];

  const posts = getPosts(opts.pageMap).filter((page) => page.frontMatter.tags?.includes(tag));

  return (
    <BaseLayout className="flex flex-col gap-2">
      <h1 className="text-4xl font-bold">{tag}</h1>
      {tagDescription && <p className="break-keep whitespace-pre-wrap">{tagDescription}</p>}
      <div className="divide-y divide-slate-200">
        {posts.length === 0 && <p className="py-12 text-center">아직은 작성된 글이 없네요 😢</p>}
        {posts.map((post) => (
          <Post key={post.route} post={post} />
        ))}
      </div>
    </BaseLayout>
  );
}
