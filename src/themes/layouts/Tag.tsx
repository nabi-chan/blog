import { BaseLayout } from './Base';
import { MDXRenderer } from '../components/MdxRenderer';
import { useRouter } from 'next/router';
import tagsDescription from '@/constants/tags.json';
import { useBlogContext } from '../contexts/blogContext';
import { flattenTree, isActivePost } from '../utils/posts';
import { MdxFile } from 'nextra';
import { FrontMatter } from '../types/types';
import { Post } from '../components/Post';
import { Link } from '../components/Link';

export function TagLayout() {
  const { query } = useRouter();
  const { opts } = useBlogContext();

  const tag = query.slug as string;
  const tagDescription = tagsDescription[tag];

  const posts = flattenTree(opts.pageMap)
    .map((page) => page as MdxFile<FrontMatter>)
    .filter((page) => page.frontMatter?.layout === 'post')
    .filter((page) => page.frontMatter.tags?.includes(tag))
    .filter(isActivePost);

  return (
    <BaseLayout className="flex flex-col gap-2">
      <h1 className="text-4xl font-bold">{tag}</h1>
      {tagDescription && <p>{tagDescription}</p>}
      <div className="divide-y divide-slate-200">
        {posts.length === 0 && <p className="py-12 text-center">아직은 작성된 글이 없네요 😢</p>}
        {posts.map((post) => (
          <Post key={post.route} post={post} />
        ))}
      </div>
    </BaseLayout>
  );
}
