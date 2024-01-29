import Head from "next/head";
import type { ReactNode } from "react";
import { useBlogContext } from "../contexts/blogContext";
import Link from "next/link";

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
        {(!opts.frontMatter.layout || opts.frontMatter.layout === "post") && (
          <Link href="/" className="nx-mb-4 nx-inline-block">
            {`🏠 돌아가기`}
          </Link>
        )}

        <h1>
          {opts.frontMatter.icon ?? "📝"} {opts.title}
        </h1>
        <p>{opts.frontMatter?.description}</p>
      </header>

      <article>{children}</article>

      <footer>{config.footer}</footer>
    </main>
  );
};
