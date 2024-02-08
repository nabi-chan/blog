import { ReactNode } from 'react';
import { BaseLayout } from 'Themes/layouts/Base';
import { useBlogContext } from 'Themes/contexts/blogContext';
import { MdxFile } from 'nextra';
import { FrontMatter } from 'Themes/types/types';
import { MDXRenderer } from 'Themes/components/MdxRenderer';
import { flattenTree, isActivePost, sortPostsByDate } from 'Themes/utils/posts';
import { Post } from 'Themes/components/Post';
import { Tags } from './Tags';

interface PostsLayoutProps {
  children: ReactNode;
}

export function PostsLayout({ children }: PostsLayoutProps) {
  const { opts } = useBlogContext();

  const posts = flattenTree(opts.pageMap)
    .map((page) => page as MdxFile<FrontMatter>)
    .filter((page) => page.frontMatter?.layout === 'post')
    .filter(isActivePost)
    .sort(sortPostsByDate);

  return (
    <BaseLayout className="flex flex-col gap-2" rightPanel={<Tags />}>
      <MDXRenderer>{children}</MDXRenderer>
      <div className="divide-y divide-slate-200">
        {posts.length === 0 && <p className="py-12 text-center">아직은 작성된 글이 없네요 😢</p>}
        {posts.map((post) => (
          <Post key={post.route} post={post} />
        ))}
      </div>
    </BaseLayout>
  );
}
