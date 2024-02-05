import { Blog } from "@/constants/blog";
import type { PageOpts } from "nextra";

export type BlogPageOpts = PageOpts<BlogFrontMatter>;

type PageLayout = "page";

export type BlogFrontMatter = {
  layout?: PageLayout;
};

export interface LayoutProps {
  config: typeof Blog;
  opts: BlogPageOpts;
}
