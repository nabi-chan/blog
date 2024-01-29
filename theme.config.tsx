import { BlogPageConfig } from "@/themes/types/types";

export default {
  titlePrefix: "🐈 > ",
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
