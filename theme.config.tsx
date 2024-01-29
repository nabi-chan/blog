import { BlogPageConfig } from "@/themes/types/types";
import { useBlogContext } from "@/themes/contexts/blogContext";

export default {
  titlePrefix: "🐈 > ",
  description: "고양이의 작고 소중한 기술 블로그",
  head: function useHead() {
    const { opts, config } = useBlogContext();

    const title = `${config.titlePrefix}${opts.title}`;
    const description = opts.frontMatter.description || config.description;
    const image = opts.frontMatter.image;

    return (
      <>
        <meta httpEquiv="Content-Language" content="ko" />
        <meta name="description" content={description} />

        <meta name="og:title" content={title} />
        <meta name="og:description" content={description} />
        {image && <meta name="og:image" content={image} />}

        <meta name="apple-mobile-web-app-title" content="Nabi Blog" />
      </>
    );
  },
  footer: (
    <footer className="nx-flex nx-items-center nx-justify-between nx-text-xs nx-pt-4">
      <span>
        Created by{" "}
        <a className="nx-text-primary-900" href="https://github.com/nabi-chan">
          @nabi-chan
        </a>
      </span>
      <ul className="nx-flex nx-gap-2 nx-list-none nx-font-bold">
        <li>
          <a href="https://github.com/nabi-chan/nabi-blog-2024">Github</a>
        </li>
      </ul>
    </footer>
  ),
} satisfies BlogPageConfig;
