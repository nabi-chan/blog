import { themes as prismThemes } from "prism-react-renderer"
import type { Config } from "@docusaurus/types"
import type * as Preset from "@docusaurus/preset-classic"

const config: Config = {
  title: "나비",
  tagline: "잡탕찌개",
  favicon: "favicon.ico",
  future: { v4: true },
  url: process.env.DOCUSAURUS_URL ?? `https://${process.env.VERCEL_URL}`,
  baseUrl: "/",
  organizationName: "nabi-chan",
  projectName: "blog",
  onBrokenLinks: "throw",
  i18n: { defaultLocale: "ko", locales: ["ko"] },
  presets: [
    [
      "classic",
      {
        docs: {
          sidebarPath: "./sidebars.ts",
        },
        blog: {
          onInlineTags: "warn",
          onInlineAuthors: "warn",
          onUntruncatedBlogPosts: "warn",
        },
        theme: {
          customCss: "./src/css/custom.css",
        },
      } satisfies Preset.Options,
    ],
  ],
  themeConfig: {
    // image: "img/docusaurus-social-card.jpg",
    colorMode: {
      disableSwitch: true,
    },
    navbar: {
      title: "나비",
      logo: {
        src: "images/butterfly.svg",
        alt: "",
      },
      items: [
        {
          type: "docSidebar",
          sidebarId: "docs",
          label: "토막글",
        },
        {
          to: "/blog",
          label: "블로그",
        },
      ],
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  } satisfies Preset.ThemeConfig,
}

export default config
