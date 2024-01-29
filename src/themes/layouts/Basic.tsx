import Head from "next/head";
import type { ReactNode } from "react";
import { useRef } from "react";
import { useBlogContext } from "../contexts/blogContext";

export const BasicLayout = ({ children }: { children: ReactNode }) => {
  const { config, opts } = useBlogContext();
  const title = `${config.titlePrefix}${opts.title}`;

  return (
    <article className="nx-container nx-prose max-md:nx-prose-sm dark:nx-prose-dark">
      <Head>
        <title>{title}</title>
        {config.head?.({ title, meta: opts.frontMatter })}
      </Head>

      <h1>{opts.title}</h1>
      {children}
      {config.footer}
    </article>
  );
};
