import Head from "next/head";
import type { ReactNode } from "react";
import { useRef } from "react";
import { useBlogContext } from "../contexts/blogContext";

export const BasicLayout = ({ children }: { children: ReactNode }) => {
  const { config, opts } = useBlogContext();
  const title = `${config.titlePrefix}${opts.title}`;

  return (
    <main className="nx-container nx-prose max-md:nx-prose-sm dark:nx-prose-dark">
      <Head>
        <title>{title}</title>
        {config.head?.({ title, meta: opts.frontMatter })}
      </Head>

      <header className="prose-h1:nx-mb-0 prose-p:nx-mt-2 prose-p:text-xs">
        <h1>{opts.title}</h1>
        <p>{opts.frontMatter?.description}</p>
      </header>

      <article>{children}</article>

      <footer>{config.footer}</footer>
    </main>
  );
};
