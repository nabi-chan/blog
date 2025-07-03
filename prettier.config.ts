import type { Config } from "prettier"

export default {
  semi: false,
  tabWidth: 2,
  useTabs: false,
  printWidth: 120,
  endOfLine: "lf",
  bracketSameLine: true,
  jsxSingleQuote: false,
  singleQuote: false,
  overrides: [
    {
      files: "package.json",
      options: {
        plugins: ["prettier-plugin-packagejson"],
      },
    },
    {
      files: "*.java",
      options: {
        plugins: ["prettier-plugin-java"],
      },
    },
  ],
} satisfies Config
