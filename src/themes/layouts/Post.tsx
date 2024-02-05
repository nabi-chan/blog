import { ReactNode } from "react";
import { BaseLayout } from "./Base";
import { MDXRenderer } from "Themes/components/MdxRenderer";
import { useBlogContext } from "Themes/contexts/blogContext";
import { relativeTime } from "Themes/utils/time";

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
        <div className="flex divide-x">
          {opts.frontMatter.date && (
            <time className="text-xs px-2 first:-ml-2">
              {relativeTime(opts.frontMatter.date)}
            </time>
          )}
          {opts.readingTime && (
            <span className="text-xs px-2 first:-ml-2">
              {opts.readingTime.text}
            </span>
          )}
        </div>
      </header>
      <MDXRenderer>{children}</MDXRenderer>
    </BaseLayout>
  );
}
