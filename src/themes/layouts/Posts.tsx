import { ReactNode } from "react";
import { BaseLayout } from "./Base";
import { useBlogContext } from "Themes/contexts/blogContext";
import { MdxFile } from "nextra";
import { Link } from "Themes/components/Link";
import { FrontMatter } from "Themes/types/types";
import { relativeTime } from "../utils/time";
import { MDXRenderer } from "../components/MdxRenderer";
import { isEmpty } from "lodash-es";

interface PostsLayoutProps {
  children: ReactNode;
}

export function PostsLayout({ children }: PostsLayoutProps) {
  const { opts } = useBlogContext();

  const posts = opts.pageMap
    .flatMap((page) => (page.kind === "Folder" ? page.children : page))
    .filter((page) => (page as MdxFile).frontMatter?.layout === "post")
    .filter((page) => !isEmpty((page as MdxFile).frontMatter?.title))
    .map((page) => page as MdxFile<FrontMatter>);

  return (
    <BaseLayout className="flex flex-col gap-2">
      <MDXRenderer>{children}</MDXRenderer>
      <div className="divide-y divide-slate-200">
        {posts.length === 0 && (
          <p className="py-12 text-center text-slate-700">
            아직은 작성된 글이 없네요 😢
          </p>
        )}
        {posts.map((post) => (
          <article key={post.route} className="py-4 group">
            <Link
              href={post.route}
              title={post.frontMatter?.title}
              className="text-2xl font-bold group-hover:text-blue-500 transition-colors truncate"
            >
              {post.frontMatter?.title}
            </Link>
            <p className="text-sm my-1">{post.frontMatter.description}</p>
            <div className="flex gap-2">
              {post.frontMatter.date && (
                <time className="text-xs">
                  {relativeTime(post.frontMatter.date)}
                </time>
              )}
            </div>
          </article>
        ))}
      </div>
    </BaseLayout>
  );
}
