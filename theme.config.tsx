import { BlogPageConfig } from "@/themes/types/types";

export default {
  titlePrefix: "🐈 > ",
  footer: (
    <footer className="nx-flex nx-items-center nx-justify-between nx-text-xs nx-pt-20">
      <span>
        Authored by <a href="https://github.com/nabi-chan">@nabi-chan</a>
      </span>
      <ul className="nx-flex nx-gap-2 nx-list-none nx-font-bold">
        <li>
          <a href="https://github.com/nabi-chan">Github</a>
        </li>
      </ul>
    </footer>
  ),
} satisfies BlogPageConfig;
