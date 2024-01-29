import type { PageOpts } from "nextra";
import { ReactNode } from "react";

export type BlogPageConfig = {
  titlePrefix?: string;
  description?: string;
  readMore?: ReactNode;
  head?: ({
    meta,
    title,
  }: {
    meta: Record<string, any>;
    title: string;
  }) => ReactNode;
  footer?: ReactNode;
};

export type BlogPageOpts = PageOpts<BlogFrontMatter>;

type PageLayout = "post" | "page" | "posts" | "tag";

export type BlogFrontMatter = {
  author?: string;
  back?: string;
  date?: string;
  description?: string;
  tag?: string | string[];
  title?: string;
  layout?: PageLayout;
};

export interface LayoutProps {
  config: BlogPageConfig;
  opts: BlogPageOpts;
}
