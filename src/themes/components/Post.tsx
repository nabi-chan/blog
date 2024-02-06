import { MdxFile } from "nextra";
import { FrontMatter } from "../types/types";
import { Link } from "./Link";
import { isPublishedThisWeek } from "../utils/posts";
import { relativeTime } from "../utils/time";
import { get } from "lodash-es";

export function Post({ post }: { post: MdxFile<FrontMatter> }) {
  return (
    <article className="py-4 group">
      <Link
        href={post.route}
        title={post.frontMatter?.title}
        className="text-2xl font-bold group-hover:text-blue-500 transition-colors truncate flex items-center gap-2"
      >
        {post.frontMatter?.title}
        {isPublishedThisWeek(get(post.frontMatter, "date", "0")) && (
          <span className="text-xs bg-blue-300 text-zinc-900 px-1 rounded-md">
            new!
          </span>
        )}
      </Link>
      <p className="text-sm my-1">{post.frontMatter.description}</p>
      <div className="flex gap-2">
        {post.frontMatter.date && (
          <time className="text-xs">{relativeTime(post.frontMatter.date)}</time>
        )}
      </div>
    </article>
  );
}
