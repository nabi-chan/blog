import { ReactNode } from "react";
import { NextraThemeLayoutProps } from "nextra";
import { BlogProvider, useBlogContext } from "Themes/contexts/blogContext";
import { PageLayout } from "../layouts/Page";
import { PostsLayout } from "../layouts/Posts";
import { PostLayout } from "../layouts/Post";

const layoutMap = {
  page: PageLayout,
  posts: PostsLayout,
  post: PostLayout,
};

function BlogLayout({ children }: { children: ReactNode }) {
  const { opts } = useBlogContext();
  const Layout = layoutMap[opts.frontMatter.layout ?? "page"];

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
    <BlogProvider config={contexts.themeConfig} opts={contexts.pageOpts}>
      <BlogLayout>{children}</BlogLayout>
    </BlogProvider>
  );
}
