import { ReactNode } from "react";
import { NextraThemeLayoutProps } from "nextra";
import { BlogProvider, useBlogContext } from "Themes/contexts/blogContext";
import { Blog as blogConfig } from "@/constants/blog";
import { PostsLayout } from "Themes/layouts/Posts";
import { PageLayout } from "Themes/layouts/Page";
import { PostLayout } from "Themes/layouts/Post";

const layoutMap = {
  default: PageLayout,
  posts: PostsLayout,
  post: PostLayout,
};

function BlogLayout({ children }: { children: ReactNode }) {
  const { opts } = useBlogContext();
  const Layout = layoutMap[opts.frontMatter.layout ?? "default"];

  if (!Layout) {
    throw new Error(
      `Invalid layout: ${
        opts.frontMatter.layout
      }, Supported Layout is ${Object.keys(layoutMap).join(", ")}`
    );
  }

  return <Layout>{children}</Layout>;
}

export function RootLayout({ children, ...contexts }: NextraThemeLayoutProps) {
  return (
    <BlogProvider config={blogConfig} opts={contexts.pageOpts}>
      <BlogLayout>{children}</BlogLayout>
    </BlogProvider>
  );
}
