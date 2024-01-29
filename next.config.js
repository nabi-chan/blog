import nextra from "nextra";

const withNextra = nextra({
  theme: "Themes/index.ts",
  themeConfig: "./theme.config.tsx",
  readingTime: true,
});

export default withNextra({
  reactStrictMode: true,
  cleanDistDir: true,
});
