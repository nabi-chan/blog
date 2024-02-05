import { ReactNode } from "react";
import { NextraThemeLayoutProps } from "nextra";
import { BlogProvider, useBlogContext } from "Themes/contexts/blogContext";

const layoutMap = {
  page: ({ children }: { children: ReactNode }) => <>{children}</>,
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
    <BlogProvider config={blogConfig} opts={contexts.pageOpts}>
      <BlogLayout>{children}</BlogLayout>
    </BlogProvider>
  );
}
