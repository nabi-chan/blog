import { ReactNode } from "react";
import { MDXTheme } from "../components/MdxTheme";
import { BasicLayout } from "./Basic";
import { collectPostsAndNavs } from "../utils/collect";
import { useBlogContext } from "../contexts/blogContext";
import { useRouter } from "next/router";
import Link from "next/link";
import getTags from "../utils/get-tags";

export function PostsLayout({ children }: { children: ReactNode }) {
  const { config, opts } = useBlogContext();
  const { posts } = collectPostsAndNavs({ config, opts });
  const router = useRouter();
  const { layout } = opts.frontMatter;
  const tagName = layout === "tag" ? router.query.tag : null;

  const postList = posts.map((post) => {
    if (tagName) {
      const tags = getTags(post);
      if (!Array.isArray(tagName) && !tags.includes(tagName)) {
        return null;
      }
    } else if (layout === "tag") {
      return null;
    }

    const postTitle = post.frontMatter?.title || post.name;
    const date: Date | null = post.frontMatter?.date
      ? new Date(post.frontMatter.date)
      : null;
    const description = post.frontMatter?.description;

    return (
      <div key={post.route} className="post-item">
        <h3>
          <Link href={post.route} passHref legacyBehavior>
            <a className="!nx-no-underline">{postTitle}</a>
          </Link>
        </h3>
        {description && (
          <p className="nx-mb-2 dark:nx-text-gray-400 nx-text-gray-600">
            {description}
            {config.readMore && (
              <Link href={post.route} passHref legacyBehavior>
                <a className="post-item-more nx-ml-2">{config.readMore}</a>
              </Link>
            )}
          </p>
        )}
        {date && (
          <time
            className="nx-text-sm dark:nx-text-gray-400 nx-text-gray-600"
            dateTime={date.toISOString()}
          >
            {date.toDateString()}
          </time>
        )}
      </div>
    );
  });

  return (
    <BasicLayout>
      {postList}
      {children}
    </BasicLayout>
  );
}
