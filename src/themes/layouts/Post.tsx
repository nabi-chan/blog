import { ReactNode } from 'react';
import { BaseLayout } from './Base';
import { MDXRenderer } from 'Themes/components/MdxRenderer';
import { useBlogContext } from 'Themes/contexts/blogContext';
import { relativeTime } from 'Themes/utils/time';
import { Comment } from 'Themes/components/Comment';

interface PostLayoutProps {
  children: ReactNode;
}

export function PostLayout({ children }: PostLayoutProps) {
  const { opts } = useBlogContext();

  return (
    <BaseLayout className="flex flex-col gap-8">
      <header className="flex flex-col">
        <h1 className="text-4xl font-bold mb-1">{opts.title}</h1>
        <p className="mb-2">{opts.frontMatter.description}</p>
        <ul className="divide-bullet text-xs">
          {opts.frontMatter.date && (
            <li>
              <time>{relativeTime(opts.frontMatter.date)}</time>
            </li>
          )}
          <li>{opts.readingTime.text}</li>
        </ul>
      </header>
      <MDXRenderer>{children}</MDXRenderer>
      <Comment />
    </BaseLayout>
  );
}
